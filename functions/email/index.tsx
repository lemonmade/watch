import {z} from 'zod';
import type {Sender} from '@quilted/react-email';
import jwt from '@tsndr/cloudflare-worker-jwt';
import {json, noContent} from '@quilted/request-router';
import {renderEmail} from '@quilted/react-email/server';

import {Email, type EmailType, type PropsForEmail} from './Email.tsx';

export type {EmailType, PropsForEmail};

export interface Email<Type extends EmailType = EmailType> {
  readonly type: Type;
  readonly props: PropsForEmail<Type>;
}

interface Environment {
  JWT_SECRET: string;
  SENDGRID_API_KEY: string;
}

const DEFAULT_SENDER: Sender = {
  email: 'no-reply@lemon.tools',
};

const DEFAULT_HEADERS = {
  Allow: 'PUT',
  'Cache-Control': 'no-store',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'PUT',
  'Timing-Allow-Origin': '*',
};

const EmailSchema = z.object({
  type: z.string(),
  props: z.record(z.any()),
});

async function handleRequest(request: Request, env: Environment) {
  if (request.method === 'OPTIONS') {
    return noContent({headers: DEFAULT_HEADERS});
  }

  if (request.method !== 'PUT') {
    return json(
      {error: 'Must use PUT'},
      {status: 405, headers: DEFAULT_HEADERS},
    );
  }

  const valid = await jwt.verify(
    request.headers.get('Watch-Token') ?? '',
    env.JWT_SECRET,
    {throwError: false},
  );

  if (!valid) {
    return json(
      {error: 'Invalid token'},
      {status: 401, headers: DEFAULT_HEADERS},
    );
  }

  let email: Email;

  try {
    const json = await request.json();
    email = EmailSchema.parse(json) as Email;
  } catch {
    return json(
      {error: 'Invalid email'},
      {status: 422, headers: DEFAULT_HEADERS},
    );
  }

  const {type, props} = email;

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
    return json(
      {error: 'Invalid email'},
      {status: 500, headers: DEFAULT_HEADERS},
    );
  }

  // eslint-disable-next-line no-console
  console.log(`Sending ${type} email:`);
  // eslint-disable-next-line no-console
  console.log({sender, subject, to, cc, bcc});

  const content = [{type: 'text/html', value: html}];

  if (plainText != null) {
    content.unshift({type: 'text/plain', value: plainText});
  }

  try {
    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${env.SENDGRID_API_KEY}`,
      },
      body: JSON.stringify({
        from: sender,
        subject,
        content,
        personalizations: [
          {
            to: to.map((email) => ({email})),
            cc: cc?.map((email) => ({email})),
            bcc: bcc?.map((email) => ({email})),
          },
        ],
      }),
      // @see https://github.com/nodejs/node/issues/46221
      ...{duplex: 'half'},
    });

    if (!response.ok) {
      // eslint-disable-next-line no-console
      console.log('Sendgrid returned error:');
      // eslint-disable-next-line no-console
      console.log(await response.json());

      throw new Error();
    }
  } catch {
    return json(
      {error: 'Failed to send email'},
      {status: 500, headers: DEFAULT_HEADERS},
    );
  }

  return json({success: true}, {headers: DEFAULT_HEADERS});
}

export default {fetch: handleRequest};
