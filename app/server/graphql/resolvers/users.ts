import type {
  User as DatabaseUser,
  GithubAccount as DatabaseGithubAccount,
  GoogleAccount as DatabaseGoogleAccount,
  PersonalAccessToken as DatabasePersonalAccessToken,
  WebAuthnCredential as DatabaseWebAuthnCredential,
} from '@prisma/client';
import {customAlphabet} from 'nanoid';

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
    GoogleAccount: DatabaseGoogleAccount;
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
  role: ({role}) => role,
  level: ({level}) => level,
  githubAccount({id}, _, {prisma}) {
    return prisma.githubAccount.findFirst({
      where: {userId: id},
    });
  },
  googleAccount({id}, _, {prisma}) {
    return prisma.googleAccount.findFirst({
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
  async giftCode({id}, _, {prisma}) {
    const giftCode = await prisma.accountGiftCode.findFirst({
      where: {redeemedById: id},
    });

    if (giftCode == null) return null;

    return {
      code: giftCode.code,
      redeemedAt: giftCode.redeemedAt!.toISOString(),
    };
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

export const GoogleAccount: Resolver<'GoogleAccount'> = {
  id: ({id}) => toGid(id, 'GoogleAccount'),
  image: ({imageUrl}) => {
    return imageUrl ? {source: imageUrl} : null;
  },
};

const PERSONAL_ACCESS_TOKEN_RANDOM_LENGTH = 12;
const PERSONAL_ACCESS_TOKEN_PREFIX = 'wlp_';

// @see https://github.com/CyberAP/nanoid-dictionary#nolookalikes
const createCode = customAlphabet('346789ABCDEFGHJKLMNPQRTUVWXY', 8);

export const Mutation: Pick<
  MutationResolver,
  | 'createAccount'
  | 'deleteAccount'
  | 'createAccountGiftCode'
  | 'redeemAccountGiftCode'
  | 'signIn'
  | 'signOut'
  | 'updateUserSettings'
  | 'disconnectGithubAccount'
  | 'disconnectGoogleAccount'
  | 'createPersonalAccessToken'
  | 'deletePersonalAccessToken'
  | 'startWebAuthnRegistration'
  | 'createWebAuthnCredential'
  | 'deleteWebAuthnCredential'
  | 'startWebAuthnSignIn'
  | 'completeWebAuthnSignIn'
> = {
  async signIn(_, {email, redirectTo}, {prisma, request}) {
    const user = await prisma.user.findFirst({where: {email}});

    if (user == null) {
      // Need to make this take roughly the same amount of time as
      // enqueuing a message, which can sometimes take a long time...
      return {email};
    }

    await enqueueSendEmail(
      'signIn',
      {
        token: await createSignedToken(
          {redirectTo},
          {subject: email, expiresIn: '15 minutes'},
        ),
        userEmail: email,
      },
      {request},
    );

    return {email};
  },
  async signOut(_, __, {user, response, request}) {
    removeAuthCookies(response, {request});
    return {userId: toGid(user.id, 'User')};
  },
  async createAccount(_, {email, code, redirectTo}, {prisma, request}) {
    const user = await prisma.user.findFirst({
      where: {email},
      select: {id: true},
    });

    if (user != null) {
      await enqueueSendEmail(
        'signIn',
        {
          token: await createSignedToken(
            {giftCode: code, redirectTo},
            {subject: email, expiresIn: '15 minutes'},
          ),
          userEmail: email,
        },
        {request},
      );

      return {email};
    }

    await enqueueSendEmail(
      'welcome',
      {
        token: await createSignedToken(
          {giftCode: code, redirectTo},
          {subject: email, expiresIn: '15 minutes'},
        ),
        userEmail: email,
      },
      {request},
    );

    return {email};
  },
  async deleteAccount(_, __, {prisma, user}) {
    const deleted = await prisma.user.delete({where: {id: user.id}});
    return {deletedId: toGid(deleted.id, 'User')};
  },
  async createAccountGiftCode(_, __, {prisma, user}) {
    const {role} = await prisma.user.findFirstOrThrow({
      where: {id: user.id},
    });

    if (role !== 'ADMIN') {
      throw new Error(`Can’t create an account gift code`);
    }

    const {code} = await prisma.accountGiftCode.create({
      data: {
        code: createCode(),
      },
    });

    return {
      code,
    };
  },
  async redeemAccountGiftCode(_, {code}, {prisma, user}) {
    const [giftCode, existingCodeForUser] = await Promise.all([
      prisma.accountGiftCode.findFirst({
        where: {code},
      }),
      prisma.accountGiftCode.findFirst({
        where: {redeemedById: user.id},
      }),
    ]);

    if (giftCode == null) {
      // eslint-disable-next-line no-console
      console.log(`Could not find gift code ${code} for user ${user.id}`);

      return {giftCode: null};
    }

    if (giftCode.redeemedById != null) {
      // eslint-disable-next-line no-console
      console.log(`Gift code ${code} has already been used`);

      return {giftCode: null};
    }

    if (existingCodeForUser != null) {
      // eslint-disable-next-line no-console
      console.log(`User ${user.id} already has applied a gift code`);

      return {giftCode: null};
    }

    const [updatedGiftCode] = await prisma.$transaction([
      prisma.accountGiftCode.update({
        where: {id: giftCode.id},
        data: {redeemedById: user.id, redeemedAt: new Date()},
      }),
      prisma.user.update({where: {id: user.id}, data: {level: 'PATRON'}}),
    ]);

    return {
      giftCode: {
        code: updatedGiftCode.code,
        redeemedAt: updatedGiftCode.redeemedAt!.toISOString(),
      },
    };
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
  async disconnectGoogleAccount(_, __, {prisma, user}) {
    const googleAccount = await prisma.googleAccount.findFirst({
      where: {userId: user.id},
    });

    if (googleAccount) {
      await prisma.googleAccount.delete({where: {id: googleAccount.id}});
    }

    return {
      deletedAccountId:
        googleAccount && toGid(googleAccount.id, 'GoogleAccount'),
    };
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
      authenticatorSelection: {
        residentKey: 'required',
        userVerification: 'required',
      },
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

      const parsedCredential = JSON.parse(credential);

      const result = await verifyRegistrationResponse({
        credential: parsedCredential,
        expectedChallenge: cookie,
        expectedOrigin: origin,
        expectedRPID: host,
        requireUserVerification: true,
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
            transports: parsedCredential.transports,
            userId: user.id,
          },
          include: {user: true},
        });

      return {user: updatedUser, credential: credentialResult};
    } finally {
      response.cookies.delete(WEBAUTHN_CHALLENGE_COOKIE);
    }
  },
  async deleteWebAuthnCredential(_, {id}, {user, prisma}) {
    const credential = await prisma.webAuthnCredential.findFirstOrThrow({
      where: {
        id: fromGid(id).id,
        userId: user.id,
      },
    });

    const {user: updatedUser} = await prisma.webAuthnCredential.delete({
      where: {id: credential.id},
      select: {user: true},
    });

    return {deletedCredentialId: credential.id, user: updatedUser};
  },
  async startWebAuthnSignIn(_, {email}, {prisma, request, response}) {
    const {generateAuthenticationOptions} = await import(
      '@simplewebauthn/server'
    );

    const credentials = email
      ? await prisma.webAuthnCredential.findMany({
          take: 5,
          where: {
            user: {email},
          },
        })
      : [];

    const result = generateAuthenticationOptions({
      rpID: new URL(request.url).host,
      userVerification: 'required',
      allowCredentials: credentials.map((credential) => ({
        id: credential.credentialId,
        type: 'public-key',
        transports:
          Array.isArray(credential.transports) &&
          typeof credentials[0] === 'string'
            ? (credential.transports as any[])
            : undefined,
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
        requireUserVerification: true,
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
