import type {GoogleAccount as DatabaseGoogleAccount} from '@prisma/client';

import {toGid} from '../shared/id.ts';
import {
  createResolverWithGid,
  createMutationResolver,
} from '../shared/resolvers.ts';

declare module '../types' {
  export interface ValueMap {
    GoogleAccount: DatabaseGoogleAccount;
  }
}

export const GoogleAccount = createResolverWithGid('GoogleAccount', {
  image: ({imageUrl}) => {
    return imageUrl ? {source: imageUrl} : null;
  },
});

export const Mutation = createMutationResolver({
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
});
