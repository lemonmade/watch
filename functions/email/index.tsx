import type {Sender} from '@quilted/react-email';
import type {
  Queue,
  ExportedHandlerQueueHandler,
} from '@cloudflare/workers-types';
import {json, noContent} from '@quilted/request-router';
import jwt from '@tsndr/cloudflare-worker-jwt';

import type {EmailType, PropsForEmail} from './Email.tsx';

export type {EmailType, PropsForEmail};

export interface Message<Type extends EmailType = EmailType> {
  readonly type: Type;
  readonly props: PropsForEmail<Type>;
}

export interface EmailQueue extends Queue<Message> {
  send<Type extends EmailType>(message: Message<Type>): Promise<void>;
}

interface Environment {
  JWT_SECRET: string;
  SENDGRID_API_KEY: string;
}

interface FetchEnvironment extends Environment {
  EMAIL_QUEUE: Queue<Message>;
}

const DEFAULT_HEADERS = {
  Allow: 'PUT',
  'Cache-Control': 'no-store',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'PUT',
  'Timing-Allow-Origin': '*',
};

async function handleRequest(request: Request, env: FetchEnvironment) {
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
    {throwError: true},
  );

  if (!valid) {
    return json(
      {error: 'Invalid token'},
      {status: 401, headers: DEFAULT_HEADERS},
    );
  }

  try {
    const message = await request.json<Message>();

    await env.EMAIL_QUEUE.send(message);

    return json({success: true}, {headers: DEFAULT_HEADERS});
  } catch {
    return json(
      {error: 'Invalid queue message'},
      {status: 422, headers: DEFAULT_HEADERS},
    );
  }
}

const DEFAULT_SENDER: Sender = {
  email: 'no-reply@lemon.tools',
};

const handleQueue: ExportedHandlerQueueHandler<Environment, Message> =
  async function handleQueue({messages}, env) {
    const [{renderEmail}, {Email}] = await Promise.all([
      import('@quilted/react-email/server'),
      import('./Email'),
    ]);

    await Promise.all(
      messages.map(async (message) => {
        // eslint-disable-next-line no-console
        console.log(message);

        const {
          body: {type, props},
        } = message;

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
            Authorization: `Bearer ${env.SENDGRID_API_KEY}`,
          },
          body: JSON.stringify({
            personalizations: [
              {
                from: sender,
                to: to.map((email) => ({email})),
                cc: cc?.map((email) => ({email})),
                bcc: bcc?.map((email) => ({email})),
                subject,
                content,
              },
            ],
          }),
          // @see https://github.com/nodejs/node/issues/46221
          ...{duplex: 'half'},
        });

        if (!response.ok) {
          // eslint-disable-next-line no-console
          console.log(await response.json());
          throw new Error('Sendgrid error');
        }
      }),
    );
  };

export default {queue: handleQueue, fetch: handleRequest};
