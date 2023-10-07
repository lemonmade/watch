import {RequestRouter, NoContentResponse} from '@quilted/request-router';
import type {
  Queue,
  KVNamespace,
  ExportedHandlerQueueHandler,
} from '@cloudflare/workers-types';

import type {} from '@quilted/cloudflare';
import {createFetchHandler} from '@quilted/cloudflare/request-router';

import {ulid} from './ulid.ts';

export interface MetricMap {
  navigation: {id: string; target: string};
}

export type Metric = keyof MetricMap;

export interface MetricMessage<Type extends Metric = Metric> {
  readonly type: Type;
  readonly data: MetricMap[Type];
}

export interface MetricsQueue extends Queue<MetricMessage> {
  send<Type extends Metric = Metric>(
    message: MetricMessage<Type>,
  ): Promise<void>;
}

interface Environment {
  METRICS_QUEUE: MetricsQueue;
  PERFORMANCE_NAVIGATIONS: KVNamespace;
}

interface Navigation {
  id: string;
  target: string;
}

declare module '@quilted/cloudflare' {
  interface CloudflareRequestEnvironment extends Environment {}
}

const handleMessage: ExportedHandlerQueueHandler<
  Environment,
  MetricMessage
> = async ({messages}, env) => {
  await Promise.all(
    messages.map(async ({body}) => {
      switch (body.type) {
        case 'navigation': {
          await env.PERFORMANCE_NAVIGATIONS.put(
            ulid(),
            JSON.stringify(body.data),
          );
          break;
        }
      }
    }),
  );
};

const router = new RequestRouter();

router.post('internal/metrics/navigation', async (request, {env}) => {
  const {navigations} = (await request.json()) as {navigations: Navigation[]};

  await Promise.all(
    navigations.map(async (navigation) => {
      await env.METRICS_QUEUE.send({
        type: 'navigation',
        data: navigation,
      });
    }),
  );

  return new NoContentResponse();
});

const handleRequest = createFetchHandler(router);

export default {fetch: handleRequest, queue: handleMessage};
