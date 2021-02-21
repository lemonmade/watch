import type {GraphQL} from '@quilted/graphql';
import findAppMatchingLocalDevelopmentQuery from './graphql/FindAppMatchingLocalDevelopmentQuery.graphql';
import type {FindAppMatchingLocalDevelopmentQueryData} from './graphql/FindAppMatchingLocalDevelopmentQuery.graphql';

export type ProductionApp = FindAppMatchingLocalDevelopmentQueryData.App;
export type ProductionExtension = FindAppMatchingLocalDevelopmentQueryData.App.Extensions;
export type ProductionClipsExtension = FindAppMatchingLocalDevelopmentQueryData.App.Extensions_ClipsExtension;

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

  if (error || data?.app == null) {
    throw error ?? new Error();
  }

  return data.app;
}
