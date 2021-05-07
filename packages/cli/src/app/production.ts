import type {GraphQL} from '@quilted/graphql';
import findAppMatchingLocalDevelopmentQuery from './graphql/FindAppMatchingLocalDevelopmentQuery.graphql';
import type {FindAppMatchingLocalDevelopmentQueryData} from './graphql/FindAppMatchingLocalDevelopmentQuery.graphql';

export type ProductionApp = FindAppMatchingLocalDevelopmentQueryData.Me.App;
export type ProductionExtension = FindAppMatchingLocalDevelopmentQueryData.Me.App.Extensions;
export type ProductionClipsExtension = FindAppMatchingLocalDevelopmentQueryData.Me.App.Extensions_ClipsExtension;

export async function loadProductionApp(
  id: string,
  {graphql}: {graphql: GraphQL},
) {
  const {data, error} = await graphql.query(
    findAppMatchingLocalDevelopmentQuery,
    {
      cache: false,
      variables: {id},
    },
  );

  if (error || data?.me.app == null) {
    throw error ?? new Error(`No app found for id ${id}`);
  }

  return data.me.app;
}
