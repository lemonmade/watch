import {graphql} from 'graphql';
import {makeExecutableSchema} from 'graphql-tools';
import knex from 'knex';
import {createApp, json} from '@lemon/tiny-server';
import {
  captureException,
  init as sentryInit,
  flush as flushSentry,
} from '@sentry/node';

import typeDefs from './graph/schema.graphql';

import {resolvers, createContext} from './graph';

sentryInit({
  dsn: 'https://d6cff1e3f8c34a44a22253995b47ccfb@sentry.io/1849967',
  enabled: process.env.NODE_ENV !== 'development',
});

const db = knex({
  client: 'pg',
  connection: {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : undefined,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
  },
});

const schema = makeExecutableSchema({
  typeDefs,
  resolvers,
});

const app = createApp();

app.post(async (request) => {
  const {operationName, query, variables} = JSON.parse(String(request.body!));

  /* eslint-disable no-console */
  console.log(`Performing operation: ${operationName}`);
  console.log(`Variables:\n${JSON.stringify(variables ?? {}, null, 2)}`);
  console.log(`Document:\n${query}`);
  /* eslint-enable no-console */

  // const request = new Request(
  //   `${event.headers.origin}${event.rawPath}${
  //     event.rawQueryString ? `?${event.rawQueryString}` : ''
  //   }`,
  //   {
  //     method: event.requestContext.http.method,
  //     body: event.body,
  //     headers: event.headers as Record<string, string>,
  //   },
  // );

  const [user] = await db.select('*').from('Users').limit(1);

  try {
    const result = await graphql(
      schema,
      query,
      {},
      createContext(db, user),
      variables,
      operationName,
    );

    return json(result, {
      status: 200,
      headers: {'Access-Control-Allow-Origin': '*'},
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.log(error);
    captureException(error);
    await flushSentry(2000);

    return json(
      {message: error.message},
      {
        status: error.statusCode ?? 500,
        headers: {'Access-Control-Allow-Origin': '*'},
      },
    );
  }
});

export default app;
