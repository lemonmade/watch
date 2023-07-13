import type {AccountGiftCode as DatabaseAccountGiftCode} from '@prisma/client';
import {customAlphabet} from 'nanoid';

import {
  createResolverWithGid,
  createQueryResolver,
  createMutationResolver,
} from '../shared/resolvers.ts';

declare module '../types' {
  export interface GraphQLValues {
    AccountGiftCode: DatabaseAccountGiftCode;
  }
}

export const AccountGiftCode = createResolverWithGid('AccountGiftCode', {
  createAccountUrl({code}, _, {request}) {
    const url = new URL('/create-account', request.url);
    url.searchParams.set('gift-code', code);
    return url.href;
  },
});

// @see https://github.com/CyberAP/nanoid-dictionary#nolookalikes
const createCode = customAlphabet('346789ABCDEFGHJKLMNPQRTUVWXY', 8);

export const Query = createQueryResolver({
  async giftCodes(_, __, {prisma, response, user}) {
    if (user.role !== 'ADMIN') {
      response.status = 401;
      return [];
    }

    const giftCodes = await prisma.accountGiftCode.findMany({
      orderBy: {createdAt: 'desc'},
    });

    return giftCodes;
  },
});

export const Mutation = createMutationResolver({
  async createAccountGiftCode(_, __, {prisma, user}) {
    const {role} = await prisma.user.findFirstOrThrow({
      where: {id: user.id},
    });

    if (role !== 'ADMIN') {
      throw new Error(`Can’t create an account gift code`);
    }

    const giftCode = await prisma.accountGiftCode.create({
      data: {
        code: createCode(),
      },
    });

    return {
      giftCode,
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
      giftCode: updatedGiftCode,
    };
  },
});
