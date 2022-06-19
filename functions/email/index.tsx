import Env from '@quilted/quilt/env';
import {renderEmail} from '@quilted/quilt/server';
import type {Sender} from '@quilted/quilt/email';

import {createPubSubHandler} from '~/shared/utilities/pubsub';

declare module '@quilted/quilt/env' {
  interface EnvironmentVariables {
    SENDGRID_API_KEY: string;
  }
}

import {Email} from './Email';

import type {EmailType, PropsForEmail} from './types';

export type {EmailType, PropsForEmail};

const DEFAULT_SENDER: Sender = {
  email: 'no-reply@lemon.tools',
};

export default createPubSubHandler<{
  type: EmailType;
  props: PropsForEmail<EmailType>;
}>(async ({type, props}) => {
  const {
    subject,
    to,
    cc,
    bcc,
    html,
    plainText,
    sender = DEFAULT_SENDER,
  } = await renderEmail(<Email type={type} props={props} />);

  if (to == null || to.length === 0 || subject == null) {
    throw new Error();
  }

  // eslint-disable-next-line no-console
  console.log(`Sending ${type} email:`);
  // eslint-disable-next-line no-console
  console.log({sender, subject, to, cc, bcc});

  const content = [{type: 'text/html', value: html}];

  if (plainText != null) {
    content.unshift({type: 'text/plain', value: plainText});
  }

  const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${Env.SENDGRID_API_KEY}`,
    },
    body: JSON.stringify({
      from: sender,
      personalizations: {
        to: to.map((name) => ({name})),
        cc: cc?.map((name) => ({name})),
        bcc: bcc?.map((name) => ({name})),
      },
      content,
    }),
  });

  if (!response.ok) {
    // eslint-disable-next-line no-console
    console.log(response);
    throw new Error('Sendgrid error');
  }
});
