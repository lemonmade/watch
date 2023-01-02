import {usePerformanceNavigation} from '@quilted/quilt';

import {Page} from '~/shared/page';
import {MediaGrid} from '~/shared/media';
import {parseGid, useQuery} from '~/shared/graphql';

import finishedWatchingQuery from './graphql/FinishedWatchingQuery.graphql';

import {WatchThroughItem} from './components';

export function FinishedWatching() {
  const {data, isLoading} = useQuery(finishedWatchingQuery);

  usePerformanceNavigation({state: isLoading ? 'loading' : 'complete'});

  return (
    <Page heading="Finished watching">
      <MediaGrid>
        {data?.watchThroughs.map(({id, series}) => (
          <WatchThroughItem
            key={id}
            series={{name: series.name, poster: series.poster?.source}}
            to={`/app/watchthrough/${parseGid(id).id}`}
          />
        ))}
      </MediaGrid>
    </Page>
  );
}
