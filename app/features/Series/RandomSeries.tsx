import {Redirect} from '@quilted/quilt/navigation';
import {
  useGraphQLQuery,
  useGraphQLQueryData,
  parseGid,
} from '~/shared/graphql.ts';

import randomSeriesQuery from './graphql/RandomSeriesQuery.graphql';

export default function RandomSeries() {
  const query = useGraphQLQuery(randomSeriesQuery);
  const {randomSeries} = useGraphQLQueryData(query);

  if (randomSeries == null) return <Redirect to="/app" />;

  const {id, handle} = randomSeries;

  return <Redirect to={`/app/series/${handle ?? parseGid(id).id}`} />;
}
