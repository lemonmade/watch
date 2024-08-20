import {Redirect} from '@quilted/quilt/navigation';

import {useQuery} from '~/shared/graphql.ts';

import randomWatchThroughQuery from './graphql/RandomWatchThroughQuery.graphql';

export default function RandomWatchThrough() {
  const {data} = useQuery(randomWatchThroughQuery);

  if (data?.randomWatchThrough == null) {
    return <Redirect to="/app" />;
  }

  const {url} = data.randomWatchThrough;

  return <Redirect to={url} />;
}
