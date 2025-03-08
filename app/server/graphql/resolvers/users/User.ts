import type {User as DatabaseUser, Prisma} from '@prisma/client';

import {isE2ETestAccountEmail} from '~/global/e2e.ts';

import {createSignedToken, removeAuthCookies} from '../../../shared/auth.ts';
import {addAuthCookies} from '../../../shared/auth.ts';
import {createAccountWithGiftCode} from '../../../shared/create-account.ts';

import {User as AppsUser} from '../apps.ts';
import {User as WatchThroughUser} from '../watching.ts';

import {toGid} from '../shared/id.ts';
import {sendEmail} from '../shared/email.ts';
import {
  createResolverWithGid,
  createQueryResolver,
  createMutationResolver,
} from '../shared/resolvers.ts';

declare module '../types' {
  export interface GraphQLValues {
    User: DatabaseUser;
  }
}

export const Query = createQueryResolver({
  me(_, __, {prisma, user}) {
    return prisma.user.findUniqueOrThrow({
      where: {id: user.id},
    });
  },
  my(_, __, {prisma, user}) {
    return prisma.user.findUniqueOrThrow({
      where: {id: user.id},
    });
  },
  viewer(_, __, {prisma, user}) {
    return prisma.user.findUniqueOrThrow({
      where: {id: user.id},
    });
  },
});

export const User = createResolverWithGid('User', {
  role: ({role}) => role,
  level: ({level}) => level,
  appleAccount({id}, _, {prisma}) {
    return prisma.appleAccount.findUnique({
      where: {userId: id},
    });
  },
  githubAccount({id}, _, {prisma}) {
    return prisma.githubAccount.findUnique({
      where: {userId: id},
    });
  },
  googleAccount({id}, _, {prisma}) {
    return prisma.googleAccount.findUnique({
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
  passkeys({id}, _, {prisma}) {
    return prisma.passkey.findMany({
      where: {userId: id},
    });
  },
  async giftCode({id}, _, {prisma}) {
    const giftCode = await prisma.accountGiftCode.findFirst({
      where: {redeemedById: id},
    });

    if (giftCode == null) return null;

    return giftCode;
  },
  subscription({id}, _, {prisma}) {
    return prisma.stripeSubscription.findUnique({
      where: {userId: id},
    });
  },
  ...AppsUser,
  ...WatchThroughUser,
});

export const Mutation = createMutationResolver({
  async signIn(_, {email, redirectTo}, {prisma, request, response, e2e}) {
    const user = await prisma.user.findUnique({where: {email}});

    if (user == null) {
      // Need to make this take roughly the same amount of time as
      // enqueuing a message, which can sometimes take a long time...
      return {
        email,
        errors: [],
        user: null,
        nextStepUrl: new URL('/sign-in/check-your-email', request.url).href,
      };
    }

    if (e2e && isE2ETestAccountEmail(email)) {
      await addAuthCookies(user, response);

      return {
        email,
        user,
        errors: [],
        nextStepUrl: redirectTo ?? new URL('/app', request.url).href,
      };
    }

    await sendEmail(
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

    return {
      email,
      errors: [],
      user: null,
      nextStepUrl: new URL('/sign-in/check-your-email', request.url).href,
    };
  },
  async signOut(_, __, {user, response, request}) {
    removeAuthCookies(response, {request});
    return {userId: toGid(user.id, 'User')};
  },
  async createAccount(
    _,
    {email, code, redirectTo},
    {prisma, request, response, e2e},
  ) {
    // Auto-login E2E test accounts
    if (e2e && isE2ETestAccountEmail(email)) {
      const user = await createAccountWithGiftCode(
        {email},
        {giftCode: code ?? undefined, prisma},
      );

      await addAuthCookies(user, response);

      return {
        email,
        nextStepUrl: redirectTo ?? new URL('/app', request.url).href,
        user,
        errors: [],
      };
    }

    const user = await prisma.user.findUnique({
      where: {email},
    });

    if (user != null) {
      await sendEmail(
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

      return {
        email,
        nextStepUrl: new URL('/sign-in/check-your-email', request.url).href,
        user,
        errors: [],
      };
    }

    await sendEmail(
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

    return {
      email,
      nextStepUrl: new URL('/sign-in/check-your-email', request.url).href,
      user,
      errors: [],
    };
  },
  async deleteAccount(_, __, {prisma, user}) {
    const deleted = await prisma.user.delete({where: {id: user.id}});
    return {deletedId: toGid(deleted.id, 'User')};
  },
  async updateUserSettings(_, {spoilerAvoidance}, {user: {id}, prisma}) {
    const data: Prisma.UserUncheckedUpdateInput = {};

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
});
