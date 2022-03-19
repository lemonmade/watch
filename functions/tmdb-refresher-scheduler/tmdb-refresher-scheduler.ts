/* eslint no-console: off */

import {SQS} from 'aws-sdk';
import type {EventBridgeHandler} from 'aws-lambda';

import {createPrisma} from 'shared/utilities/database';

const sqs = new SQS({apiVersion: '2012-11-05'});
const prismaPromise = createPrisma();

export const handler: EventBridgeHandler<
  string,
  unknown,
  unknown
> = async () => {
  const prisma = await prismaPromise;
  const series = await prisma.series.findMany({
    where: {status: 'RETURNING'},
  });

  console.log(series);

  await Promise.all(
    series.map((series) => {
      return new Promise((resolve, reject) => {
        sqs.sendMessage(
          {
            MessageBody: JSON.stringify({}),
            QueueUrl: process.env.TMDB_REFRESHER_QUEUE_URL!,
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
