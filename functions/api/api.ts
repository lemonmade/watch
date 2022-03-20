import {graphql} from 'graphql';
import {makeExecutableSchema} from '@graphql-tools/schema';
import Env from '@quilted/quilt/env';
import {createHttpHandler, json, noContent} from '@quilted/quilt/http-handlers';
import type {Request} from '@quilted/quilt/http-handlers';
import {
  captureException,
  init as sentryInit,
  flush as flushSentry,
} from '@sentry/node';

import {createPrisma} from 'shared/utilities/database';
import type {Prisma} from 'shared/utilities/database';
import {getUserIdFromRequest} from 'shared/utilities/auth';

import {resolvers, createContext, schemaSource} from './graphql';
import type {Authentication} from './graphql';

declare module '@quilted/quilt/env' {
  interface EnvironmentVariables {
    NODE_ENV: string;
  }
}

const ACCESS_TOKEN_HEADER = 'X-Access-Token';

sentryInit({
  dsn: 'https://d6cff1e3f8c34a44a22253995b47ccfb@sentry.io/1849967',
  enabled: Env.NODE_ENV !== 'development',
});

const schema = makeExecutableSchema({
  resolvers,
  typeDefs: schemaSource,
});

const app = createHttpHandler();

app.options(() =>
  noContent({
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Method': 'POST',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  }),
);

app.post(async (request) => {
  const {operationName, query, variables} = JSON.parse(String(request.body!));

  /* eslint-disable no-console */
  console.log(`Performing operation: ${operationName}`);
  console.log(`Variables:\n${JSON.stringify(variables ?? {}, null, 2)}`);
  console.log(`Document:\n${query}`);
  /* eslint-enable no-console */

  const {headers, cookies} = json(
    {},
    {
      status: 200,
      headers: {'Access-Control-Allow-Origin': '*'},
    },
  );

  const response = {
    status: 200,
    headers,
    cookies,
  };

  const prisma = await createPrisma();
  const auth = await authenticate(request, prisma);

  try {
    const result = await graphql(
      schema,
      query,
      {},
      createContext(auth, prisma, request, response),
      variables,
      operationName,
    );

    return json(result, {
      status: response.status,
      headers: response.headers,
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.log(error);
    captureException(error);
    await flushSentry(2000);

    return json(
      {message: (error as any).message},
      {
        status: (error as any).statusCode ?? 500,
        headers: {'Access-Control-Allow-Origin': '*'},
      },
    );
  }
});

async function authenticate(
  request: Request,
  prisma: Prisma,
): Promise<Authentication> {
  const cookieAuthUserId = getUserIdFromRequest(request);

  if (cookieAuthUserId) {
    return {type: 'cookie', userId: cookieAuthUserId};
  }

  const accessToken = request.headers.get(ACCESS_TOKEN_HEADER);

  if (accessToken == null) {
    return {type: 'unauthenticated'};
  }

  const token = await prisma.personalAccessToken.findFirst({
    where: {token: accessToken},
  });

  if (token == null) {
    throw new Error('Invalid token');
  }

  await prisma.personalAccessToken.update({
    where: {id: token.id},
    data: {lastUsedAt: new Date()},
  });

  return {type: 'accessToken', userId: token.userId};
}

export default app;
