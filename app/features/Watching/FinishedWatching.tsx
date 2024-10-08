import {usePerformanceNavigation} from '@quilted/quilt/performance';
import {useLocalizedFormatting} from '@quilted/quilt/localize';
import {Poster} from '@lemon/zest';

import {Page} from '~/shared/page.ts';
import {MediaGrid, MediaGridItem} from '~/shared/media.ts';
import {
  useGraphQLQuery,
  useGraphQLQueryData,
  useGraphQLQueryRefetchOnMount,
} from '~/shared/graphql.ts';

import finishedWatchingQuery from './graphql/FinishedWatchingQuery.graphql';

export default function FinishedWatching() {
  const query = useGraphQLQuery(finishedWatchingQuery);
  useGraphQLQueryRefetchOnMount(query);

  const {watchThroughs} = useGraphQLQueryData(query);

  usePerformanceNavigation();

  const {formatDate} = useLocalizedFormatting();

  return (
    <Page heading="Finished watching">
      <MediaGrid>
        {watchThroughs.map(({id, url, finishedAt, series}) => (
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
