import type {PersonalAccessToken as DatabasePersonalAccessToken} from '@prisma/client';

import {fromGid} from '../shared/id.ts';
import {
  createResolverWithGid,
  createMutationResolver,
} from '../shared/resolvers.ts';

declare module '../types' {
  export interface ValueMap {
    PersonalAccessToken: DatabasePersonalAccessToken;
  }
}

export const PersonalAccessToken = createResolverWithGid(
  'PersonalAccessToken',
  {
    prefix: () => PERSONAL_ACCESS_TOKEN_PREFIX,
    length: ({token}) => token.length,
    lastFourCharacters: ({token}) => token.slice(-4),
  },
);

const PERSONAL_ACCESS_TOKEN_RANDOM_LENGTH = 12;
const PERSONAL_ACCESS_TOKEN_PREFIX = 'wlp_';

export const Mutation = createMutationResolver({
  async createPersonalAccessToken(_, {label}, {user, prisma}) {
    const {randomBytes} = await import('crypto');

    const token = `${PERSONAL_ACCESS_TOKEN_PREFIX}${randomBytes(
      PERSONAL_ACCESS_TOKEN_RANDOM_LENGTH,
    )
      .toString('hex')
      .slice(0, PERSONAL_ACCESS_TOKEN_RANDOM_LENGTH)}`;

    const personalAccessToken = await prisma.personalAccessToken.create({
      data: {
        token,
        label,
        userId: user.id,
      },
    });

    return {personalAccessToken, plaintextToken: token};
  },
  async deletePersonalAccessToken(
    _,
    {id, token: plaintextToken},
    {user, prisma},
  ) {
    const token = await prisma.personalAccessToken.findFirst({
      where: {
        id: id ? fromGid(id).id : undefined,
        token: plaintextToken ?? undefined,
        userId: user.id,
      },
    });

    if (token) {
      await prisma.personalAccessToken.delete({where: {id: token.id}});
    }

    return {deletedPersonalAccessTokenId: token?.id ?? null};
  },
});
