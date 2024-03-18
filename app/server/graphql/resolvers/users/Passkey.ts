import type {Passkey as DatabasePasskey} from '@prisma/client';

import {addAuthCookies} from '../../../shared/auth.ts';

import {toGid, fromGid} from '../shared/id.ts';
import {
  createResolverWithGid,
  createMutationResolver,
} from '../shared/resolvers.ts';

const PASSKEY_CHALLENGE_COOKIE = 'PasskeyChallenge';

declare module '../types' {
  export interface GraphQLValues {
    Passkey: DatabasePasskey;
  }
}

export const Passkey = createResolverWithGid('Passkey', {});

export const Mutation = createMutationResolver({
  async startPasskeyCreate(_, __, {prisma, user, request, response}) {
    const {generateRegistrationOptions} = await import(
      '@simplewebauthn/server'
    );

    const {email} = await prisma.user.findUniqueOrThrow({
      where: {id: user.id},
    });

    const result = generateRegistrationOptions({
      rpID: new URL(request.url).host,
      rpName: 'Watch',
      userID: user.id,
      userName: email,
      attestationType: 'none',
      excludeCredentials: [],
      authenticatorSelection: {
        residentKey: 'required',
        userVerification: 'required',
      },
    });

    response.cookies.set(PASSKEY_CHALLENGE_COOKIE, result.challenge, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      maxAge: 60 * 1000,
    });

    return {
      result: JSON.stringify(result),
    };
  },
  async finishPasskeyCreate(
    _,
    {credential},
    {user, prisma, request, response},
  ) {
    try {
      const cookie = request.cookies.get(PASSKEY_CHALLENGE_COOKIE);

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

      const {user: updatedUser, ...passkeyResult} = await prisma.passkey.create(
        {
          data: {
            counter: registrationInfo.counter,
            credentialId: registrationInfo.credentialID,
            publicKey: registrationInfo.credentialPublicKey,
            transports: parsedCredential.transports,
            userId: user.id,
          },
          include: {user: true},
        },
      );

      return {user: updatedUser, passkey: passkeyResult};
    } finally {
      response.cookies.delete(PASSKEY_CHALLENGE_COOKIE);
    }
  },
  async startPasskeySignIn(_, {email}, {prisma, request, response}) {
    const {generateAuthenticationOptions} = await import(
      '@simplewebauthn/server'
    );

    const passkeys = email
      ? await prisma.passkey.findMany({
          take: 5,
          where: {
            user: {email},
          },
        })
      : [];

    const result = generateAuthenticationOptions({
      rpID: new URL(request.url).host,
      userVerification: 'required',
      allowCredentials: passkeys.map((passkey) => ({
        id: passkey.credentialId,
        type: 'public-key',
        transports:
          Array.isArray(passkey.transports) &&
          typeof passkey.transports[0] === 'string'
            ? (passkey.transports as any[])
            : undefined,
      })),
    });

    response.cookies.set(PASSKEY_CHALLENGE_COOKIE, result.challenge, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      maxAge: 60 * 1000,
    });

    return {
      result: JSON.stringify(result),
    };
  },
  async finishPasskeySignIn(_, {credential}, {prisma, request, response}) {
    try {
      const cookie = request.cookies.get(PASSKEY_CHALLENGE_COOKIE);

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

      const passkey = await prisma.passkey.findFirstOrThrow({
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
          counter: passkey.counter,
          credentialID: passkey.credentialId,
          credentialPublicKey: passkey.publicKey,
        },
      });

      if (!result.verified || result.authenticationInfo == null) {
        throw new Error('Could not verify challenge');
      }

      const {authenticationInfo} = result;

      const [updatedPasskey] = await Promise.all([
        prisma.passkey.update({
          where: {id: passkey.id},
          data: {counter: authenticationInfo.newCounter},
          include: {user: true},
        }),
        addAuthCookies({id: passkey.userId}, response),
      ]);

      return {
        user: updatedPasskey.user,
        passkey: updatedPasskey,
      };
    } finally {
      response.cookies.delete(PASSKEY_CHALLENGE_COOKIE);
    }
  },
  async deletePasskey(_, {id}, {user, prisma}) {
    const passkey = await prisma.passkey.findUniqueOrThrow({
      where: {
        id: fromGid(id).id,
        userId: user.id,
      },
    });

    const {user: updatedUser} = await prisma.passkey.delete({
      where: {id: passkey.id},
      select: {user: true},
    });

    return {deletedPasskeyId: toGid(passkey.id, 'Passkey'), user: updatedUser};
  },
});
