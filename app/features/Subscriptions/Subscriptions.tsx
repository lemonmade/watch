import {usePerformanceNavigation} from '@quilted/quilt/performance';
import {Poster} from '@lemon/zest';

import {Page} from '~/shared/page.ts';
import {MediaGrid, MediaGridItem} from '~/shared/media.ts';
import {
  useGraphQLQuery,
  useGraphQLQueryData,
  useGraphQLQueryRefetchOnMount,
} from '~/shared/graphql.ts';

import subscriptionsQuery from './graphql/SubscriptionsQuery.graphql';

export default function Subscriptions() {
  const query = useGraphQLQuery(subscriptionsQuery);
  useGraphQLQueryRefetchOnMount(query);

  const {subscriptions} = useGraphQLQueryData(query);

  usePerformanceNavigation();

  return (
    <Page heading="Subscriptions">
      <MediaGrid>
        {subscriptions.map(({id, series}) => (
          <MediaGridItem
            key={id}
            to={`/app/series/${series.handle}`}
            image={
              <Poster label={series.name} source={series.poster?.source} />
            }
          />
        ))}
      </MediaGrid>
    </Page>
  );
}
