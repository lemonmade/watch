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

export function verifySignedToken<T = Record<string, unknown>>(
  token: string,
  {
    secret = process.env.JWT_DEFAULT_SECRET!,
    ...options
  }: VerifyOptions & {secret?: string} = {},
) {
  return (jwt.verify(token, secret, options) as any) as T;
}

export function addAuthCookies(user: {id: string}, response: ExtendedResponse) {
  const token = createSignedToken({}, {expiresIn: '7d', subject: user.id});

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
