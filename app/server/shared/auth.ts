import type {
  EnhancedRequest,
  EnhancedResponse,
} from '@quilted/quilt/request-router';

import type {PrismaClient} from '~/global/database.ts';
import {createSignedToken, verifySignedToken} from '~/global/tokens.ts';
import type {UserRole} from '~/graphql/types.ts';

import type {Environment} from '../context.ts';

declare module '@quilted/quilt/env' {
  interface EnvironmentVariables {
    JWT_DEFAULT_SECRET: string;
  }
}

export enum Cookie {
  Auth = 'Auth',
}

export enum Header {
  Token = 'Watch-Token',
}

export interface AuthenticatedUser {
  readonly id: string;
  readonly role: UserRole;
}

export type Authentication =
  | {
      type: 'unauthenticated';
      user?: never;
    }
  | {type: 'cookie'; user: AuthenticatedUser}
  | {
      type: 'accessToken';
      token: {readonly id: string};
      user: AuthenticatedUser;
    };

export const ACCESS_TOKEN_HEADER = 'X-Access-Token';

export async function authenticate(
  request: EnhancedRequest,
  {prisma, env}: {prisma: PrismaClient; env: Environment},
): Promise<Authentication> {
  const cookieAuthUserId = await getUserIdFromRequest(request, {env});
  const accessToken = request.headers.get(ACCESS_TOKEN_HEADER);

  if (cookieAuthUserId == null && accessToken == null) {
    return {type: 'unauthenticated'};
  }

  const userFromCookie = cookieAuthUserId
    ? await prisma.user.findUnique({
        where: {id: cookieAuthUserId},
      })
    : undefined;

  if (userFromCookie) {
    const {id, role} = userFromCookie;
    return {type: 'cookie', user: {id, role}};
  }

  if (accessToken == null) {
    return {type: 'unauthenticated'};
  }

  const token = await prisma.personalAccessToken.findUnique({
    where: {token: accessToken},
    include: {user: true},
  });

  if (token == null) {
    throw new Error('Invalid token');
  }

  await prisma.personalAccessToken.update({
    where: {id: token.id},
    data: {lastUsedAt: new Date()},
  });

  return {
    type: 'accessToken',
    user: {id: token.user.id, role: token.user.role},
    token: {id: token.id},
  };
}

export async function getUserIdFromRequest(
  request: EnhancedRequest,
  {env}: {env: Environment},
) {
  const cookie = request.cookies.get(Cookie.Auth);

  if (!cookie) return undefined;

  try {
    const {subject, expired} = await verifySignedToken(cookie, {
      secret: env.JWT_DEFAULT_SECRET,
    });
    return expired ? undefined : subject;
  } catch {
    return undefined;
  }
}

export async function addAuthCookies<
  ResponseType extends Pick<EnhancedResponse, 'cookies'>,
>(user: {id: string}, response: ResponseType, {env}: {env: Environment}) {
  const token = await createSignedToken(
    {sub: user.id},
    {
      expiresIn: 7 * 24 * 60 * 60 * 1_000,
      secret: env.JWT_DEFAULT_SECRET,
    },
  );

  response.cookies.set(Cookie.Auth, token, {
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
    secure: true,
    httpOnly: true,
    sameSite: 'lax',
  });

  return response;
}

export function removeAuthCookies<T extends Pick<EnhancedResponse, 'cookies'>>(
  response: T,
  {request}: {request?: EnhancedRequest} = {},
) {
  if (request == null || request.cookies.has(Cookie.Auth)) {
    response.cookies.delete(Cookie.Auth, {path: '/'});
  }

  return response;
}
