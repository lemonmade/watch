import type {
  User as DatabaseUser,
  GithubAccount as DatabaseGithubAccount,
  PersonalAccessToken as DatabasePersonalAccessToken,
  WebAuthnCredential as DatabaseWebAuthnCredential,
} from '@prisma/client';

import {
  createSignedToken,
  removeAuthCookies,
  addAuthCookies,
} from '../../shared/auth';

import type {Resolver, QueryResolver, MutationResolver} from './types';
import {toGid, fromGid} from './utilities/id';
import {enqueueSendEmail} from './utilities/email';

const WEBAUTHN_CHALLENGE_COOKIE = 'WebAuthnChallenge';

declare module './types' {
  export interface ValueMap {
    User: DatabaseUser;
    GithubAccount: DatabaseGithubAccount;
    PersonalAccessToken: DatabasePersonalAccessToken;
    WebAuthnCredential: DatabaseWebAuthnCredential;
  }
}

export const Query: Pick<QueryResolver, 'me' | 'my'> = {
  me(_, __, {prisma, user}) {
    return prisma.user.findFirst({
      where: {id: user.id},
      rejectOnNotFound: true,
    });
  },
  my(_, __, {prisma, user}) {
    return prisma.user.findFirst({
      where: {id: user.id},
      rejectOnNotFound: true,
    });
  },
};

export const User: Resolver<'User'> = {
  id: ({id}) => toGid(id, 'User'),
  githubAccount({id}, _, {prisma}) {
    return prisma.githubAccount.findFirst({
      where: {userId: id},
    });
  },
  accessTokens({id}, _, {user, prisma}) {
    if (user.id !== id) {
      throw new Error();
    }

    return prisma.personalAccessToken.findMany({
      where: {userId: user.id},
      take: 50,
    });
  },
  settings({spoilerAvoidance}) {
    return {
      spoilerAvoidance,
    };
  },
  webAuthnCredentials({id}, _, {prisma}) {
    return prisma.webAuthnCredential.findMany({
      where: {userId: id},
    });
  },
};

export const WebAuthnCredential: Resolver<'WebAuthnCredential'> = {
  id: ({id}) => toGid(id, 'WebAuthnCredential'),
};

export const PersonalAccessToken: Resolver<'PersonalAccessToken'> = {
  id: ({id}) => toGid(id, 'PersonalAccessToken'),
  prefix: () => PERSONAL_ACCESS_TOKEN_PREFIX,
  length: ({token}) => token.length,
  lastFourCharacters: ({token}) => token.slice(-4),
};

export const GithubAccount: Resolver<'GithubAccount'> = {
  avatarImage: ({avatarUrl}) => {
    return avatarUrl ? {source: avatarUrl} : null;
  },
};

const PERSONAL_ACCESS_TOKEN_RANDOM_LENGTH = 12;
const PERSONAL_ACCESS_TOKEN_PREFIX = 'wlp_';

export const Mutation: Pick<
  MutationResolver,
  | 'createAccount'
  | 'deleteAccount'
  | 'signIn'
  | 'signOut'
  | 'updateUserSettings'
  | 'disconnectGithubAccount'
  | 'createPersonalAccessToken'
  | 'deletePersonalAccessToken'
  | 'startWebAuthnRegistration'
  | 'createWebAuthnCredential'
  | 'startWebAuthnSignIn'
  | 'completeWebAuthnSignIn'
> = {
  async signIn(_, {email, redirectTo}, {prisma}) {
    const user = await prisma.user.findFirst({where: {email}});

    if (user == null) {
      // Need to make this take roughly the same amount of time as
      // enqueuing a message, which can sometimes take a long time...
      return {email};
    }

    await enqueueSendEmail('signIn', {
      token: await createSignedToken(
        {redirectTo},
        {subject: email, expiresIn: '15 minutes'},
      ),
      userEmail: email,
    });

    return {email};
  },
  async signOut(_, __, {user, response, request}) {
    removeAuthCookies(response, {request});
    return {userId: toGid(user.id, 'User')};
  },
  async createAccount(_, {email, redirectTo}, {prisma}) {
    const user = await prisma.user.findFirst({
      where: {email},
      select: {id: true},
    });

    if (user != null) {
      await enqueueSendEmail('signIn', {
        token: await createSignedToken(
          {redirectTo},
          {subject: email, expiresIn: '15 minutes'},
        ),
        userEmail: email,
      });

      return {email};
    }

    await enqueueSendEmail('welcome', {
      token: await createSignedToken(
        {redirectTo},
        {subject: email, expiresIn: '15 minutes'},
      ),
      userEmail: email,
    });

    return {email};
  },
  async deleteAccount(_, __, {prisma, user}) {
    const deleted = await prisma.user.delete({where: {id: user.id}});
    return {deletedId: toGid(deleted.id, 'User')};
  },
  async disconnectGithubAccount(_, __, {prisma, user}) {
    const githubAccount = await prisma.githubAccount.findFirst({
      where: {userId: user.id},
    });

    if (githubAccount) {
      await prisma.githubAccount.delete({where: {id: githubAccount.id}});
    }

    return {deletedAccount: githubAccount};
  },
  async updateUserSettings(_, {spoilerAvoidance}, {user: {id}, prisma}) {
    const data: Parameters<typeof prisma['user']['update']>[0]['data'] = {};

    if (spoilerAvoidance != null) {
      data.spoilerAvoidance = spoilerAvoidance;
    }

    const user = await prisma.user.update({
      data,
      where: {
        id,
      },
    });

    return {user};
  },
  async createPersonalAccessToken(_, {label}, {user, prisma}) {
    const {randomBytes} = await import('crypto');

    const token = `${PERSONAL_ACCESS_TOKEN_PREFIX}${randomBytes(
      PERSONAL_ACCESS_TOKEN_RANDOM_LENGTH,
    )
      .toString('hex')
      .slice(0, PERSONAL_ACCESS_TOKEN_RANDOM_LENGTH)}`;

    const personalAccessToken = await prisma.personalAccessToken.create({
      data: {
        token,
        label,
        userId: user.id,
      },
    });

    return {personalAccessToken, plaintextToken: token};
  },
  async deletePersonalAccessToken(
    _,
    {id, token: plaintextToken},
    {user, prisma},
  ) {
    const token = await prisma.personalAccessToken.findFirst({
      where: {
        id: id ? fromGid(id).id : undefined,
        token: plaintextToken ?? undefined,
        userId: user.id,
      },
    });

    if (token) {
      await prisma.personalAccessToken.delete({where: {id: token.id}});
    }

    return {deletedPersonalAccessTokenId: token?.id ?? null};
  },
  async startWebAuthnRegistration(_, __, {request, user, response}) {
    const {generateRegistrationOptions} = await import(
      '@simplewebauthn/server'
    );

    const result = generateRegistrationOptions({
      rpID: new URL(request.url).host,
      rpName: 'Watch',
      userID: user.id,
      userName: 'Name',
      attestationType: 'none',
      excludeCredentials: [],
    });

    response.cookies.set(WEBAUTHN_CHALLENGE_COOKIE, result.challenge, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      maxAge: 60 * 1000,
    });

    return {
      result: JSON.stringify(result),
    };
  },
  async createWebAuthnCredential(
    _,
    {credential},
    {user, prisma, request, response},
  ) {
    try {
      const cookie = request.cookies.get(WEBAUTHN_CHALLENGE_COOKIE);

      if (cookie == null) {
        throw new Error('No challenge cookie');
      }

      const {verifyRegistrationResponse} = await import(
        '@simplewebauthn/server'
      );

      const {origin, host} = new URL(request.url);

      const result = await verifyRegistrationResponse({
        credential: JSON.parse(credential),
        expectedChallenge: cookie,
        expectedOrigin: origin,
        expectedRPID: host,
      });

      if (!result.verified || result.registrationInfo == null) {
        throw new Error('Could not verify challenge');
      }

      const {registrationInfo} = result;

      const {user: updatedUser, ...credentialResult} =
        await prisma.webAuthnCredential.create({
          data: {
            counter: registrationInfo.counter,
            credentialId: registrationInfo.credentialID,
            publicKey: registrationInfo.credentialPublicKey,
            userId: user.id,
          },
          include: {user: true},
        });

      return {user: updatedUser, credential: credentialResult};
    } finally {
      response.cookies.delete(WEBAUTHN_CHALLENGE_COOKIE);
    }
  },
  async startWebAuthnSignIn(_, __, {prisma, request, response}) {
    const {generateAuthenticationOptions} = await import(
      '@simplewebauthn/server'
    );

    const credentials = await prisma.webAuthnCredential.findMany({
      take: 5,
    });

    const result = generateAuthenticationOptions({
      rpID: new URL(request.url).host,
      userVerification: 'preferred',
      allowCredentials: credentials.map((credential) => ({
        id: credential.credentialId,
        type: 'public-key',
      })),
    });

    response.cookies.set(WEBAUTHN_CHALLENGE_COOKIE, result.challenge, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      maxAge: 60 * 1000,
    });

    return {
      result: JSON.stringify(result),
    };
  },
  async completeWebAuthnSignIn(_, {credential}, {prisma, request, response}) {
    try {
      const cookie = request.cookies.get(WEBAUTHN_CHALLENGE_COOKIE);

      if (cookie == null) {
        throw new Error('No challenge cookie');
      }

      const {origin, host} = new URL(request.url);
      const credentialJson = JSON.parse(credential);

      const [{default: base64url}, {verifyAuthenticationResponse}] =
        await Promise.all([
          import('base64url'),
          import('@simplewebauthn/server'),
        ]);

      const webAuthnCredential =
        await prisma.webAuthnCredential.findFirstOrThrow({
          where: {
            credentialId: base64url.toBuffer(credentialJson.rawId),
          },
        });

      const result = await verifyAuthenticationResponse({
        credential: credentialJson,
        expectedChallenge: cookie,
        expectedOrigin: origin,
        expectedRPID: host,
        authenticator: {
          counter: webAuthnCredential.counter,
          credentialID: webAuthnCredential.credentialId,
          credentialPublicKey: webAuthnCredential.publicKey,
        },
      });

      if (!result.verified || result.authenticationInfo == null) {
        throw new Error('Could not verify challenge');
      }

      const {authenticationInfo} = result;

      const [updatedWebAuthnCredential] = await Promise.all([
        prisma.webAuthnCredential.update({
          where: {id: webAuthnCredential.id},
          data: {counter: authenticationInfo.newCounter},
          include: {user: true},
        }),
        addAuthCookies({id: webAuthnCredential.userId}, response),
      ]);

      return {
        user: updatedWebAuthnCredential.user,
        credential: updatedWebAuthnCredential,
      };
    } finally {
      response.cookies.delete(WEBAUTHN_CHALLENGE_COOKIE);
    }
  },
};
