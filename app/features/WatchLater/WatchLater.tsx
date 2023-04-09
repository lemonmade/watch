import {usePerformanceNavigation} from '@quilted/quilt';
import {Poster, Pressable} from '@lemon/zest';

import {Page} from '~/shared/page.ts';
import {useQuery} from '~/shared/graphql.ts';
import {MediaGrid} from '~/shared/media.ts';

import watchLaterQuery from './graphql/WatchLaterQuery.graphql';

export default function WatchLater() {
  const {data, isLoading} = useQuery(watchLaterQuery);

  usePerformanceNavigation({state: isLoading ? 'loading' : 'complete'});

  const watchLater = data?.watchLater;

  return (
    <Page heading="Watch later">
      <MediaGrid>
        {watchLater?.items.map(({id, media}) =>
          media.__typename === 'Series' ? (
            <Pressable key={id} to={`/app/series/${media.handle}`}>
              <Poster
                label={media.name}
                source={media.poster?.source.replace('/original/', '/w342/')}
              />
            </Pressable>
          ) : null,
        )}
      </MediaGrid>
    </Page>
  );
}
