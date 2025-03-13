import {type Prisma as PrismaData} from '@prisma/client';

import {type PrismaClient} from '~/global/database.ts';

export async function createAccountWithGiftCode(
  data: PrismaData.UserCreateInput,
  {giftCode, prisma}: {giftCode?: string; prisma: PrismaClient},
) {
  const code = giftCode
    ? await prisma.accountGiftCode.findUniqueOrThrow({
        where: {code: giftCode},
      })
    : undefined;

  if (code?.redeemedById != null) {
    throw new Error(`Gift code ${code.code} has already been used`);
  }

  const user = await prisma.user.create({
    data: {
      level: code ? 'PATRON' : undefined,
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
