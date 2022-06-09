import type {
  User as DatabaseUser,
  GithubAccount as DatabaseGithubAccount,
  PersonalAccessToken as DatabasePersonalAccessToken,
} from '@prisma/client';

import {createSignedToken, removeAuthCookies} from '../../shared/auth';

import type {Resolver, QueryResolver, MutationResolver} from './types';
import {toGid, fromGid} from './utilities/id';
import {enqueueSendEmail} from './utilities/email';

declare module './types' {
  export interface ValueMap {
    User: DatabaseUser;
    GithubAccount: DatabaseGithubAccount;
    PersonalAccessToken: DatabasePersonalAccessToken;
  }
}

export const Query: Pick<QueryResolver, 'me' | 'my'> = {
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
};

export const User: Resolver<'User'> = {
  id: ({id}) => toGid(id, 'User'),
  githubAccount({id}, _, {prisma}) {
    return prisma.githubAccount.findFirst({
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
};

export const PersonalAccessToken: Resolver<'PersonalAccessToken'> = {
  id: ({id}) => toGid(id, 'PersonalAccessToken'),
  prefix: () => PERSONAL_ACCESS_TOKEN_PREFIX,
  length: ({token}) => token.length,
  lastFourCharacters: ({token}) => token.slice(-4),
};

export const GithubAccount: Resolver<'GithubAccount'> = {
  avatarImage: ({avatarUrl}) => {
    return avatarUrl ? {source: avatarUrl} : null;
  },
};

const PERSONAL_ACCESS_TOKEN_RANDOM_LENGTH = 12;
const PERSONAL_ACCESS_TOKEN_PREFIX = 'wlp_';

export const Mutation: Pick<
  MutationResolver,
  | 'createAccount'
  | 'deleteAccount'
  | 'signIn'
  | 'signOut'
  | 'updateUserSettings'
  | 'disconnectGithubAccount'
  | 'createPersonalAccessToken'
  | 'deletePersonalAccessToken'
> = {
  async signIn(_, {email, redirectTo}, {prisma}) {
    const user = await prisma.user.findFirst({where: {email}});

    if (user == null) {
      // Need to make this take roughly the same amount of time as
      // enqueuing a message, which can sometimes take a long time...
      return {email};
    }

    await enqueueSendEmail('signIn', {
      token: await createSignedToken(
        {redirectTo},
        {subject: email, expiresIn: '15 minutes'},
      ),
      userEmail: email,
    });

    return {email};
  },
  async signOut(_, __, {user, response, request}) {
    removeAuthCookies(response, {request});
    return {userId: toGid(user.id, 'User')};
  },
  async createAccount(_, {email, redirectTo}, {prisma}) {
    const user = await prisma.user.findFirst({
      where: {email},
      select: {id: true},
    });

    if (user != null) {
      await enqueueSendEmail('signIn', {
        token: await createSignedToken(
          {redirectTo},
          {subject: email, expiresIn: '15 minutes'},
        ),
        userEmail: email,
      });

      return {email};
    }

    await enqueueSendEmail('welcome', {
      token: await createSignedToken(
        {redirectTo},
        {subject: email, expiresIn: '15 minutes'},
      ),
      userEmail: email,
    });

    return {email};
  },
  async deleteAccount(_, __, {prisma, user}) {
    const deleted = await prisma.user.delete({where: {id: user.id}});
    return {deletedId: toGid(deleted.id, 'User')};
  },
  async disconnectGithubAccount(_, __, {prisma, user}) {
    const githubAccount = await prisma.githubAccount.findFirst({
      where: {userId: user.id},
    });

    if (githubAccount) {
      await prisma.githubAccount.delete({where: {id: githubAccount.id}});
    }

    return {deletedAccount: githubAccount};
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
};
