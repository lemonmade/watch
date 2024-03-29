import {parse} from 'graphql';
import {NestedAbortController} from '@quilted/quilt/events';
import {signal, type Signal} from '@quilted/quilt/signals';
import {type ExtensionPoint} from '@watching/clips';
import {run, createQueryResolver} from '@lemonmade/graphql-live';

import {type ExtensionPointDefinitionContext} from './extension-points.ts';

export interface LiveQueryRunner<_Point extends ExtensionPoint> {
  readonly query: Signal<string | undefined>;
  readonly result: Signal<Record<string, unknown>>;
  update(query: string | undefined): Promise<void>;
  run(): Promise<void>;
}

export function createLiveQueryRunner<Point extends ExtensionPoint>(
  initialQuery: string | undefined,
  resolver: (helpers: any) => any,
  {
    context,
    signal: abortSignal,
  }: {signal: AbortSignal; context: ExtensionPointDefinitionContext},
): LiveQueryRunner<Point> {
  const result = signal<any>({});
  const query = signal(initialQuery);

  const queryResolver = createQueryResolver(resolver);
  let runPromise: Promise<void> | undefined;
  let runAbortController: AbortController | undefined;

  const runner: LiveQueryRunner<Point> = {
    result,
    query,
    update(newQuery) {
      runPromise = undefined;
      runAbortController?.abort();
      query.value = newQuery;
      result.value = {};
      return runner.run();
    },
    run() {
      if (runPromise != null) return runPromise;

      runAbortController = new AbortController();
      const {signal} = new NestedAbortController(
        runAbortController.signal,
        abortSignal,
      );

      const currentQuery = query.peek() ?? '';

      if (currentQuery.trim().length === 0) {
        return Promise.resolve();
      }

      const runner = run(parse(currentQuery) as any, queryResolver, {
        signal,
        // @ts-expect-error can’t make the types work here...
        context,
      });

      runPromise = new Promise(async (resolve) => {
        let resolved = false;

        // TODO: handle errors
        for await (const {data} of runner) {
          result.value = {...data};

          if (!resolved) {
            resolved = true;
            resolve();
          }
        }

        if (!resolved) {
          resolved = true;
          resolve();
        }
      });

      return runPromise;
    },
  };

  return runner;
}
