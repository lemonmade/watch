import type {APIGatewayProxyHandlerV2} from 'aws-lambda';
import {graphql} from 'graphql';
import {makeExecutableSchema} from 'graphql-tools';
import knex from 'knex';
import {
  captureException,
  init as sentryInit,
  flush as flushSentry,
} from '@sentry/node';

// eslint-disable-next-line import/no-webpack-loader-syntax
import typeDefs from 'raw-loader!./graph/schema.graphql';

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

export const watchApi: APIGatewayProxyHandlerV2 = async (event) => {
  const {operationName, query, variables} = JSON.parse(event.body!);

  /* eslint-disable no-console */
  console.log(`Performing operation: ${operationName}`);
  console.log(`Variables:\n${JSON.stringify(variables ?? {}, null, 2)}`);
  console.log(`Document:\n${query}`);
  /* eslint-enable no-console */

  try {
    const result = await graphql(
      schema,
      query,
      {},
      createContext(db),
      variables,
      operationName,
    );

    return {
      statusCode: 200,
      body: JSON.stringify(result),
      headers: {
        'Access-Control-Allow-Origin': '*',
      },
    };
  } catch (error) {
    // eslint-disable-next-line no-console
    console.log(error);
    captureException(error);
    await flushSentry(2000);
    return {
      statusCode: error.statusCode ?? 500,
      body: JSON.stringify({message: error.message}),
      headers: {
        'Access-Control-Allow-Origin': '*',
      },
    };
  }
};
