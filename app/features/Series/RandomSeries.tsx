import {Redirect} from '@quilted/quilt/navigate';
import {useQuery, parseGid} from '~/shared/graphql.ts';

import randomSeriesQuery from './graphql/RandomSeriesQuery.graphql';

export default function RandomSeries() {
  const {data} = useQuery(randomSeriesQuery);

  if (data?.randomSeries == null) return null;

  const {id, handle} = data.randomSeries;

  return <Redirect to={`/app/series/${handle ?? parseGid(id).id}`} />;
}
