import {createOptionalContext} from '@quilted/quilt/context';
import {type GraphQLFetch} from '@quilted/quilt/graphql';
import {type QueryClient} from '@tanstack/react-query';

export interface AppContext {
  readonly queryClient: QueryClient;
  readonly fetchGraphQL: GraphQLFetch;
}

export const AppContextReact = createOptionalContext<AppContext>();
export const useAppContext = AppContextReact.use;
