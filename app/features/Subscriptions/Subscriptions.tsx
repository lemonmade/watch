import {usePerformanceNavigation} from '@quilted/quilt';
import {Poster} from '@lemon/zest';

import {Page} from '~/shared/page.ts';
import {MediaGrid, MediaGridItem} from '~/shared/media.ts';
import {useQuery} from '~/shared/graphql.ts';

import subscriptionsQuery from './graphql/SubscriptionsQuery.graphql';

export default function Subscriptions() {
  const {data, isLoading} = useQuery(subscriptionsQuery);

  usePerformanceNavigation({state: isLoading ? 'loading' : 'complete'});

  if (data == null) {
    return null;
  }

  return (
    <Page heading="Subscriptions">
      <MediaGrid>
        {data.subscriptions.map(({id, series}) => (
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
