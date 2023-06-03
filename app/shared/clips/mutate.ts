import {parse} from 'graphql';
import {type Api} from '@watching/clips';
import {run, createMutationResolver} from '@lemonmade/graphql-live';

import {type ExtensionPointDefinitionContext} from './extension-points.ts';

export function createMutateRunner(
  resolver: (helpers: any) => any,
  {context}: {context: ExtensionPointDefinitionContext},
): Api<any, any>['mutate'] {
  const mutationResolver = createMutationResolver(resolver);

  return async function mutate(operation, options) {
    const runner = run(
      parse(
        typeof operation === 'string' ? operation : operation.source,
      ) as any,
      mutationResolver,
      {
        // @ts-expect-error can’t make the types work here...
        context,
        ...options,
      },
    );

    const result = await runner.untilDone();

    return result.data as any;
  };
}
