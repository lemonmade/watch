import {usePerformanceNavigation} from '@quilted/quilt/performance';
import {Poster} from '@lemon/zest';

import {Page} from '~/shared/page.ts';
import {
  useGraphQLQuery,
  useGraphQLQueryData,
  useGraphQLQueryRefetchOnMount,
} from '~/shared/graphql.ts';
import {MediaGrid, MediaGridItem} from '~/shared/media.ts';

import watchLaterQuery from './graphql/WatchLaterQuery.graphql';

export default function WatchLater() {
  const query = useGraphQLQuery(watchLaterQuery);
  useGraphQLQueryRefetchOnMount(query);

  const {watchLater} = useGraphQLQueryData(query);

  usePerformanceNavigation();

  return (
    <Page heading="Watch later">
      <MediaGrid>
        {watchLater.items.map(({id, media}) =>
          media.__typename === 'Series' ? (
            <MediaGridItem
              key={id}
              to={`/app/series/${media.handle}`}
              image={
                <Poster label={media.name} source={media.poster?.source} />
              }
            />
          ) : null,
        )}
      </MediaGrid>
    </Page>
  );
}
