/* eslint-disable no-console */

import knex from 'knex';
import {SQS} from 'aws-sdk';
import type {EventBridgeHandler} from 'aws-lambda';

const db = knex({
  client: 'pg',
  connection: {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : undefined,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
  },
});

const sqs = new SQS({apiVersion: '2012-11-05'});

export const tmdbRefresherScheduler: EventBridgeHandler<
  string,
  unknown,
  unknown
> = async () => {
  const series = await db
    .select('*')
    .from('Series')
    .where({status: 'RETURNING'});

  console.log(series);

  await Promise.all(
    series.map((series) => {
      return new Promise((resolve, reject) => {
        sqs.sendMessage(
          {
            MessageBody: JSON.stringify({}),
            QueueUrl: process.env.WATCH_REFRESH_QUEUE_URL!,
            MessageAttributes: {
              id: {
                DataType: 'String',
                StringValue: series.id,
              },
              name: {
                DataType: 'String',
                StringValue: series.name,
              },
              tmdbId: {
                DataType: 'String',
                StringValue: series.tmdbId,
              },
            },
          },
          (error, result) => {
            console.log(series.name, error, result);
            if (error) {
              reject(error);
            } else {
              resolve(result);
            }
          },
        );
      });
    }),
  );
};
