import {createSignedToken, Header} from '../../../shared/auth';

import type {
  Message,
  EmailType,
  PropsForEmail,
} from '../../../../../functions/email';

// TODO
export async function enqueueSendEmail<T extends EmailType>(
  type: T,
  props: PropsForEmail<T>,
  {request}: {request: Request},
) {
  const message: Message = {
    type,
    props,
  };

  const response = await fetch(new URL('/internal/email/queue', request.url), {
    method: 'PUT',
    body: JSON.stringify(message),
    headers: {
      [Header.Token]: await createSignedToken({}, {expiresIn: '5 minutes'}),
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to enqueue email: ${await response.text()}`);
  }
}
