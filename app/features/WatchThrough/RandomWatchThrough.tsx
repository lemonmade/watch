import {Redirect} from '@quilted/quilt';

import {useQuery, parseGid} from '~/shared/graphql.ts';

import randomWatchThroughQuery from './graphql/RandomWatchThroughQuery.graphql';

export default function RandomWatchThrough() {
  const {data} = useQuery(randomWatchThroughQuery);

  if (data?.randomWatchThrough == null) return null;

  const {id} = data.randomWatchThrough;

  return <Redirect to={`/app/watchthrough/${parseGid(id).id}`} />;
}
