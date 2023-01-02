import {usePerformanceNavigation} from '@quilted/quilt';
import {Poster, Pressable} from '@lemon/zest';

import {Page} from '~/shared/page';
import {MediaGrid} from '~/shared/media';
import {useQuery} from '~/shared/graphql';

import subscriptionsQuery from './graphql/SubscriptionsQuery.graphql';

export function Subscriptions() {
  const {data, isLoading} = useQuery(subscriptionsQuery);

  usePerformanceNavigation({state: isLoading ? 'loading' : 'complete'});

  if (data == null) {
    return null;
  }

  return (
    <Page heading="Subscriptions">
      <MediaGrid>
        {data.subscriptions.map(({id, series}) => (
          <Pressable key={id} to={`/app/series/${series.handle}`}>
            <Poster
              label={series.name}
              source={
                series.poster?.source.replace('/original/', '/w342/') ?? ''
              }
            />
          </Pressable>
        ))}
      </MediaGrid>
    </Page>
  );
}
