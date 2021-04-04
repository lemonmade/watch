import * as jwt from 'jsonwebtoken';
import type {SignOptions, VerifyOptions} from 'jsonwebtoken';
import type {ExtendedRequest, ExtendedResponse} from '@lemon/tiny-server';

export enum Cookie {
  Auth = 'Auth',
}

export function createSignedToken(
  data: Record<string, any>,
  {
    secret = process.env.JWT_DEFAULT_SECRET!,
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
    secret = process.env.JWT_DEFAULT_SECRET!,
    ...options
  }: VerifyOptions & {secret?: string} = {},
): SignedTokenResult<T> {
  const {exp, sub, ...data} = (jwt.verify(
    token,
    secret,
    options,
  ) as any) as T & {exp?: number; sub?: string};

  const expiresAt = exp ? new Date(exp) : undefined;
  const expired = expiresAt != null && expiresAt.getTime() < Date.now();

  return {data: data as T, subject: sub || undefined, expired, expiresAt};
}

export function addAuthCookies(user: {id: string}, response: ExtendedResponse) {
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
  response: ExtendedResponse,
  {request}: {request?: ExtendedRequest} = {},
) {
  if (request == null || request.cookies.has(Cookie.Auth)) {
    response.cookies.delete(Cookie.Auth);
  }

  return response;
}
