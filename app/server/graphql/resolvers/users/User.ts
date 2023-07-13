import type {User as DatabaseUser} from '@prisma/client';

import {createSignedToken, removeAuthCookies} from '../../../shared/auth.ts';

import {User as AppsUser} from '../apps.ts';

import {toGid} from '../shared/id.ts';
import {enqueueSendEmail} from '../shared/email.ts';
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
});

export const User = createResolverWithGid('User', {
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
    return prisma.stripeSubscription.findFirst({
      where: {userId: id},
    });
  },
  ...AppsUser,
});

export const Mutation = createMutationResolver({
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
  async updateUserSettings(_, {spoilerAvoidance}, {user: {id}, prisma}) {
    const data: Parameters<(typeof prisma)['user']['update']>[0]['data'] = {};

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
