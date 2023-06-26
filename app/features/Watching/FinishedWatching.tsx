import {usePerformanceNavigation, useLocalizedFormatting} from '@quilted/quilt';
import {Poster} from '@lemon/zest';

import {Page} from '~/shared/page.ts';
import {MediaGrid, MediaGridItem} from '~/shared/media.ts';
import {useQuery} from '~/shared/graphql.ts';

import finishedWatchingQuery from './graphql/FinishedWatchingQuery.graphql';

export default function FinishedWatching() {
  const {data, isLoading} = useQuery(finishedWatchingQuery);
  const {formatDate} = useLocalizedFormatting();

  usePerformanceNavigation({state: isLoading ? 'loading' : 'complete'});

  return (
    <Page heading="Finished watching">
      <MediaGrid>
        {data?.watchThroughs.map(({id, url, finishedAt, series}) => (
          <MediaGridItem
            key={id}
            to={url}
            image={<Poster source={series.poster?.source} />}
            title={series.name}
            subtitle={
              finishedAt
                ? formatDate(new Date(finishedAt), {
                    dateStyle: 'long',
                  })
                : undefined
            }
          />
        ))}
      </MediaGrid>
    </Page>
  );
}
