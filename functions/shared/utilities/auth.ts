import * as jwt from 'jsonwebtoken';
import type {ExtendedResponse} from '@lemon/tiny-server';

export enum Cookie {
  Auth = 'Auth',
}

export function addAuthenticationCookies(
  user: {id: string},
  response: ExtendedResponse,
) {
  const token = jwt.sign({}, '123', {expiresIn: '7d', subject: user.id});

  response.cookies.set(Cookie.Auth, token, {
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
    secure: true,
    httpOnly: true,
    sameSite: 'lax',
  });

  return response;
}
