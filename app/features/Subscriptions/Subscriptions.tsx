import {usePerformanceNavigation} from '@quilted/quilt';
import {Poster, Pressable} from '@lemon/zest';

import {Page} from '~/shared/page.ts';
import {MediaGrid} from '~/shared/media.ts';
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
