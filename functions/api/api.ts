import {graphql} from 'graphql';
import {makeExecutableSchema} from 'graphql-tools';
import {createApp, json, noContent} from '@lemon/tiny-server';
import {
  captureException,
  init as sentryInit,
  flush as flushSentry,
} from '@sentry/node';

import {getUserIdFromRequest} from 'shared/utilities/auth';
import {createDatabaseConnection} from 'shared/utilities/database';

import typeDefs from './graph/schema';

import {resolvers, createContext} from './graph';

sentryInit({
  dsn: 'https://d6cff1e3f8c34a44a22253995b47ccfb@sentry.io/1849967',
  enabled: process.env.NODE_ENV !== 'development',
});

const schema = makeExecutableSchema({
  typeDefs,
  resolvers,
});

const app = createApp();

app.options(() =>
  noContent({
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Method': 'POST',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  }),
);

const db = createDatabaseConnection();

app.post(async (request) => {
  const {operationName, query, variables} = JSON.parse(String(request.body!));

  /* eslint-disable no-console */
  console.log(`Performing operation: ${operationName}`);
  console.log(`Variables:\n${JSON.stringify(variables ?? {}, null, 2)}`);
  console.log(`Document:\n${query}`);
  /* eslint-enable no-console */

  const response = json(
    {},
    {
      status: 200,
      headers: {'Access-Control-Allow-Origin': '*'},
    },
  );

  const userId = getUserIdFromRequest(request);

  try {
    const result = await graphql(
      schema,
      query,
      {},
      createContext(db, userId ? {id: userId} : undefined, request, response),
      variables,
      operationName,
    );

    return json(result, {
      status: 200,
      headers: response.headers,
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
