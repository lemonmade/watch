import type {GithubAccount as DatabaseGithubAccount} from '@prisma/client';

import {
  createResolverWithGid,
  createMutationResolver,
} from '../shared/resolvers.ts';

declare module '../types' {
  export interface ValueMap {
    GithubAccount: DatabaseGithubAccount;
  }
}

export const GithubAccount = createResolverWithGid('GithubAccount', {
  avatarImage: ({avatarUrl}) => {
    return avatarUrl ? {source: avatarUrl} : null;
  },
});

export const Mutation = createMutationResolver({
  async disconnectGithubAccount(_, __, {prisma, user}) {
    const githubAccount = await prisma.githubAccount.findFirst({
      where: {userId: user.id},
    });

    if (githubAccount) {
      await prisma.githubAccount.delete({where: {id: githubAccount.id}});
    }

    return {deletedAccount: githubAccount};
  },
});
