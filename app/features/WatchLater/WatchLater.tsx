import {Poster, Pressable} from '@lemon/zest';

import {Page} from '~/shared/page';
import {useQuery} from '~/shared/graphql';
import {MediaGrid} from '~/shared/media';

import watchLaterQuery from './graphql/WatchLaterQuery.graphql';

export function WatchLater() {
  const {data} = useQuery(watchLaterQuery);

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
