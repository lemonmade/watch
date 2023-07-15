import {createSignedToken, Header} from '../../../shared/auth.ts';

import type {
  Email,
  EmailType,
  PropsForEmail,
} from '../../../../../functions/email/index.tsx';

export async function sendEmail<T extends EmailType>(
  type: T,
  props: PropsForEmail<T>,
  {request}: {request: Request},
) {
  const email: Email = {
    type,
    props,
  };

  const response = await fetch(new URL('/internal/email/queue', request.url), {
    method: 'PUT',
    body: JSON.stringify(email),
    headers: {
      [Header.Token]: await createSignedToken({}, {expiresIn: '5 minutes'}),
      'Content-Type': 'application/json',
    },
    // @see https://github.com/nodejs/node/issues/46221
    ...{duplex: 'half'},
  });

  if (!response.ok) {
    throw new Error(`Failed to send email: ${await response.text()}`);
  }
}
