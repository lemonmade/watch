import {Redirect} from '@quilted/quilt/navigation';

import {
  useGraphQLQuery,
  useGraphQLQueryData,
  useGraphQLQueryRefetchOnMount,
} from '~/shared/graphql.ts';

import randomWatchThroughQuery from './graphql/RandomWatchThroughQuery.graphql';

export default function RandomWatchThrough() {
  const query = useGraphQLQuery(randomWatchThroughQuery);
  useGraphQLQueryRefetchOnMount(query);

  const {randomWatchThrough} = useGraphQLQueryData(query);

  if (randomWatchThrough == null) {
    return <Redirect to="/app" />;
  }

  const {url} = randomWatchThrough;

  return <Redirect to={url} />;
}
