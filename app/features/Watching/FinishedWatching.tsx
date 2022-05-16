import {MediaGrid} from '@lemon/zest';

import {Page} from 'components';
import {parseGid, useQuery} from 'utilities/graphql';

import finishedWatchingQuery from './graphql/FinishedWatchingQuery.graphql';

import {WatchThroughItem} from './components';

export function FinishedWatching() {
  const {data} = useQuery(finishedWatchingQuery);

  return (
    <Page heading="Finished watching">
      <MediaGrid>
        {data?.watchThroughs.map(({id, series}) => (
          <WatchThroughItem
            key={id}
            series={{poster: series.poster?.source}}
            to={`/app/watchthrough/${parseGid(id).id}`}
          />
        ))}
      </MediaGrid>
    </Page>
  );
}
