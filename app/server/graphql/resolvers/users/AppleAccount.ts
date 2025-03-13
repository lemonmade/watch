import type {KeyObject} from 'crypto';

import {nanoid} from 'nanoid';
import type {AppleAccount as DatabaseAppleAccount} from '@prisma/client';

import {decodeSignedToken, verifySignedToken} from '~/global/tokens.ts';

import {toGid} from '../shared/id.ts';
import {
  createResolverWithGid,
  createMutationResolver,
} from '../shared/resolvers.ts';

import {addAuthCookies} from '../../../shared/auth.ts';
import {createAccountWithGiftCode} from '../../../shared/create-account.ts';

declare module '../types' {
  export interface GraphQLValues {
    AppleAccount: DatabaseAppleAccount;
  }
}

export const AppleAccount = createResolverWithGid('AppleAccount', {});

export const Mutation = createMutationResolver({
  async signInWithApple(
    _,
    {idToken, redirectTo},
    {prisma, request, response, env},
  ) {
    const token = await validateIdToken(idToken);

    let normalizedRedirectTo = redirectTo
      ? new URL(redirectTo, request.url)
      : undefined;

    if (
      normalizedRedirectTo == null ||
      normalizedRedirectTo?.origin !== request.URL.origin
    ) {
      normalizedRedirectTo = new URL('/app', request.url);
    }

    const existingAccount = await prisma.appleAccount.findUnique({
      where: {id: token.id},
      include: {user: true},
    });

    if (existingAccount == null) {
      return {
        user: null,
        appleAccount: null,
        nextStepUrl: null,
        errors: [
          {
            code: 'GENERIC',
            message: 'No Apple account found for the provided ID token',
          },
        ],
      };
    }

    await addAuthCookies(existingAccount.user, response, {env});

    return {
      user: existingAccount.user,
      appleAccount: existingAccount,
      nextStepUrl: normalizedRedirectTo.href,
      errors: [],
    };
  },
  async createAccountWithApple(
    _,
    {idToken, code, redirectTo},
    {prisma, request, response, env},
  ) {
    const token = await validateIdToken(idToken);

    let normalizedRedirectTo = redirectTo
      ? new URL(redirectTo, request.url)
      : undefined;

    if (
      normalizedRedirectTo == null ||
      normalizedRedirectTo?.origin !== request.URL.origin
    ) {
      normalizedRedirectTo = new URL('/app', request.url);
    }

    const existingAccount = await prisma.appleAccount.findUnique({
      where: {id: token.id},
      include: {user: true},
    });

    if (existingAccount) {
      await addAuthCookies(existingAccount.user, response, {env});

      return {
        user: existingAccount.user,
        appleAccount: existingAccount,
        nextStepUrl: normalizedRedirectTo.href,
        errors: [],
      };
    }

    const user = await createAccountWithGiftCode(
      {
        email: token.email ?? `user-${nanoid()}@sign-in-with.apple.com`,
      },
      {prisma, giftCode: code ?? undefined},
    );

    const appleAccount = await prisma.appleAccount.create({
      data: {
        id: token.id,
        email: token.email,
        emailVerified: token.emailVerified,
        isPrivateEmail: token.isPrivateEmail,
        userId: user.id,
      },
    });

    await addAuthCookies(user, response, {env});

    return {
      user,
      appleAccount,
      nextStepUrl: normalizedRedirectTo.href,
      errors: [],
    };
  },
  async connectAppleAccount(_, {idToken}, {prisma, user}) {
    const token = await validateIdToken(idToken);

    const existingAccount = await prisma.appleAccount.findUnique({
      where: {userId: user.id},
      include: {user: true},
    });

    if (existingAccount) {
      if (existingAccount.id === token.id) {
        return {
          user: existingAccount.user,
          appleAccount: existingAccount,
          errors: [],
        };
      } else {
        const updatedAccount = await prisma.appleAccount.update({
          where: {id: existingAccount.id},
          data: {
            id: token.id,
            email: token.email,
            emailVerified: token.emailVerified,
            isPrivateEmail: token.isPrivateEmail,
          },
          include: {
            user: true,
          },
        });

        return {
          user: updatedAccount.user,
          appleAccount: updatedAccount,
          errors: [],
        };
      }
    }

    const createdAccount = await prisma.appleAccount.create({
      data: {
        id: token.id,
        email: token.email,
        emailVerified: token.emailVerified,
        isPrivateEmail: token.isPrivateEmail,
        userId: user.id,
      },
      include: {
        user: true,
      },
    });

    return {
      user: createdAccount.user,
      appleAccount: createdAccount,
      errors: [],
    };
  },
  async disconnectAppleAccount(_, __, {prisma, user}) {
    const appleAccount = await prisma.appleAccount.findUnique({
      where: {userId: user.id},
    });

    if (appleAccount) {
      await prisma.appleAccount.delete({where: {id: appleAccount.id}});
    }

    return {
      deletedAccountId: appleAccount && toGid(appleAccount.id, 'AppleAccount'),
      errors: [],
    };
  },
});

/**
 * @see https://developer.apple.com/documentation/sign_in_with_apple/sign_in_with_apple_rest_api/authenticating_users_with_sign_in_with_apple
 */
async function validateIdToken(idToken: string) {
  const [{importJWK}] = await Promise.all([import('jose')]);

  const token = await decodeSignedToken(idToken);

  const kid = (token?.header as any)?.kid;

  if (kid == null) {
    throw new Error('Invalid token');
  }

  const keyResponse = await fetch('https://appleid.apple.com/auth/keys', {
    method: 'GET',
  });

  const {keys} = (await keyResponse.json()) as {keys: {kid: string}[]};

  const key = keys.find((key) => key.kid === kid);

  if (key == null) {
    throw new Error('Invalid token');
  }

  const jwk = await importJWK(key, 'RS256');
  const secret = (jwk as KeyObject).export({
    format: 'pem',
    type: 'spki',
  });

  const verifiedToken = await verifySignedToken(idToken, {
    secret: secret as string,
  });

  if (
    verifiedToken.expired ||
    verifiedToken.data.aud !== 'tools.lemon.watch-web'
  ) {
    throw new Error('Invalid token');
  }

  return {
    id: verifiedToken.data.sub as string,
    email: verifiedToken.data.email as string | undefined,
    emailVerified: normalizeStrangeAppleBooleans(
      verifiedToken.data.email_verified,
    ),
    isPrivateEmail: normalizeStrangeAppleBooleans(
      verifiedToken.data.is_private_email,
    ),
  };
}

function normalizeStrangeAppleBooleans(value?: unknown) {
  switch (value) {
    case true:
    case 'true':
      return true;
    case false:
    case 'false':
      return false;
    default:
      return undefined;
  }
}
