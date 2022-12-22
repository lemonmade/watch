import jwt from 'jsonwebtoken';
import type {SignOptions, VerifyOptions} from 'jsonwebtoken';
import Env from '@quilted/quilt/env';
import type {
  EnhancedResponse,
  EnhancedRequest,
} from '@quilted/quilt/request-router';

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

export function createSignedToken(
  data: Record<string, any>,
  {
    secret = Env.JWT_DEFAULT_SECRET,
    ...options
  }: SignOptions & {secret?: string} = {},
) {
  return jwt.sign(data, secret, options);
}

interface SignedTokenResult<T> {
  data: T;
  subject?: string;
  expired: boolean;
  expiresAt?: Date;
}

export function verifySignedToken<T = Record<string, unknown>>(
  token: string,
  {
    secret = Env.JWT_DEFAULT_SECRET!,
    ...options
  }: VerifyOptions & {secret?: string} = {},
): SignedTokenResult<T> {
  const {exp, sub, ...data} = jwt.verify(token, secret, {
    ...options,
    ignoreExpiration: true,
  }) as any as T & {exp?: number; sub?: string};

  const expiresAt = exp ? new Date(exp * 1_000) : undefined;
  const expired = expiresAt != null && expiresAt.getTime() < Date.now();

  return {data: data as T, subject: sub || undefined, expired, expiresAt};
}

export function getUserIdFromRequest(request: EnhancedRequest) {
  const cookie = request.cookies.get(Cookie.Auth);

  if (!cookie) return undefined;

  try {
    const {subject, expired} = verifySignedToken(cookie);
    return expired ? undefined : subject;
  } catch {
    return undefined;
  }
}

export function addAuthCookies(user: {id: string}, response: EnhancedResponse) {
  const token = createSignedToken({}, {expiresIn: '7 days', subject: user.id});

  response.cookies.set(Cookie.Auth, token, {
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
    secure: true,
    httpOnly: true,
    sameSite: 'lax',
  });

  return response;
}

export function removeAuthCookies(
  response: EnhancedResponse,
  {request}: {request?: EnhancedRequest} = {},
) {
  if (request == null || request.cookies.has(Cookie.Auth)) {
    response.cookies.delete(Cookie.Auth, {path: '/'});
  }

  return response;
}
