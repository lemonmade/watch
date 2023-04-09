import {
  createOptionalContext,
  createUseContextHook,
  createUseOptionalValueHook,
  type GraphQLFetch,
} from '@quilted/quilt';
import {type QueryClient} from '@tanstack/react-query';

export interface AppContext {
  readonly queryClient: QueryClient;
  readonly fetchGraphQL: GraphQLFetch;
}

export const AppContextReact = createOptionalContext<AppContext>();
export const useAppContext = createUseContextHook(AppContextReact);

export function createUseAppContextHook<T>(hook: (context: AppContext) => T) {
  return createUseOptionalValueHook<T>(() => hook(useAppContext()));
}
