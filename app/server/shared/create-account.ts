import {type Prisma as PrismaData} from '@prisma/client';

import {type Prisma} from './database.ts';

export async function createAccountWithGiftCode(
  data: PrismaData.UserCreateInput,
  {giftCode, prisma}: {giftCode: string; prisma: Prisma},
) {
  const code = giftCode
    ? await prisma.accountGiftCode.findFirstOrThrow({
        where: {code: giftCode},
      })
    : undefined;

  if (code?.redeemedById != null) {
    throw new Error(`Gift code ${code.code} has already been used`);
  }

  const user = await prisma.user.create({
    data: {
      level: giftCode ? 'PATRON' : undefined,
      ...data,
    },
  });

  if (code) {
    await prisma.accountGiftCode.update({
      where: {id: code.id},
      data: {
        redeemedById: user.id,
        redeemedAt: new Date(),
      },
    });
  }

  return user;
}
