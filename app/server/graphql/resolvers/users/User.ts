import type {User as DatabaseUser} from '@prisma/client';
import {customAlphabet} from 'nanoid';

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

    return {
      code: giftCode.code,
      redeemedAt: giftCode.redeemedAt!.toISOString(),
    };
  },
  subscription({id}, _, {prisma}) {
    return prisma.stripeSubscription.findFirst({
      where: {userId: id},
    });
  },
  ...AppsUser,
});

// @see https://github.com/CyberAP/nanoid-dictionary#nolookalikes
const createCode = customAlphabet('346789ABCDEFGHJKLMNPQRTUVWXY', 8);

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
});
