import * as jwt from 'jsonwebtoken';
import type {ExtendedResponse} from '@lemon/tiny-server';

export function addAuthenticationCookies(
  user: {id: string},
  response: ExtendedResponse,
) {
  const token = jwt.sign(user, '123', {expiresIn: '7d'});

  response.cookies.set('Auth', token, {
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
    secure: true,
    httpOnly: true,
    sameSite: 'lax',
  });

  return response;
}
