import Env from '@quilted/quilt/env';
import type {
  EnhancedRequest,
  EnhancedResponse,
} from '@quilted/quilt/request-router';
import type {SignOptions, VerifyOptions} from 'jsonwebtoken';

import type {UserRole} from '~/graphql/types.ts';

import {createPrisma, type Prisma} from './database.ts';

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
  explicitPrisma?: Prisma,
): Promise<Authentication> {
  const cookieAuthUserId = await getUserIdFromRequest(request);
  const accessToken = request.headers.get(ACCESS_TOKEN_HEADER);

  if (cookieAuthUserId == null && accessToken == null) {
    return {type: 'unauthenticated'};
  }

  const prisma = explicitPrisma ?? (await createPrisma());

  const userFromCookie = cookieAuthUserId
    ? await prisma.user.findFirst({
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

  const token = await prisma.personalAccessToken.findFirst({
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

export async function createSignedToken(
  data?: Record<string, any>,
  {
    secret = Env.JWT_DEFAULT_SECRET,
    ...options
  }: SignOptions & {secret?: string} = {},
) {
  const {default: jwt} = await import('jsonwebtoken');
  return jwt.sign(data ?? {}, secret, options);
}

interface SignedTokenResult<T> {
  data: T;
  subject?: string;
  expired: boolean;
  expiresAt?: Date;
}

export async function verifySignedToken<T = Record<string, unknown>>(
  token: string,
  {
    secret = Env.JWT_DEFAULT_SECRET!,
    ...options
  }: VerifyOptions & {secret?: string} = {},
): Promise<SignedTokenResult<T>> {
  const {default: jwt} = await import('jsonwebtoken');

  const {exp, sub, ...data} = jwt.verify(token, secret, {
    ...options,
    ignoreExpiration: true,
  }) as any as T & {exp?: number; sub?: string};

  const expiresAt = exp ? new Date(exp * 1_000) : undefined;
  const expired = expiresAt != null && expiresAt.getTime() < Date.now();

  return {data: data as T, subject: sub || undefined, expired, expiresAt};
}

export async function getUserIdFromRequest(request: EnhancedRequest) {
  const cookie = request.cookies.get(Cookie.Auth);

  if (!cookie) return undefined;

  try {
    const {subject, expired} = await verifySignedToken(cookie);
    return expired ? undefined : subject;
  } catch {
    return undefined;
  }
}

export async function addAuthCookies<
  ResponseType extends Pick<EnhancedResponse, 'cookies'>,
>(user: {id: string}, response: ResponseType) {
  const token = await createSignedToken(
    {},
    {expiresIn: '7 days', subject: user.id},
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
