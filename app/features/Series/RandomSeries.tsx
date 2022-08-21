import {Redirect} from '@quilted/quilt';
import {useQuery, parseGid} from '~/shared/graphql';

import randomSeriesQuery from './graphql/RandomSeriesQuery.graphql';

export default function RandomSeries() {
  const {data} = useQuery(randomSeriesQuery);

  if (data?.randomSeries == null) return null;

  const {id, handle} = data.randomSeries;

  return <Redirect to={`/app/series/${handle ?? parseGid(id).id}`} />;
}
