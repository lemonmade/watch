import * as jwt from 'jsonwebtoken';

export function sign(user: {id: string}) {
  return jwt.sign(user, '123', {
    expiresIn: '7d',
  });
}
