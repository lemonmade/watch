import {Poster, Action} from '@lemon/zest';

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
            <Action key={id} to={`/app/series/${media.handle}`}>
              {media.poster && (
                <Poster
                  source={media.poster.source.replace('/original/', '/w342/')}
                />
              )}
            </Action>
          ) : null,
        )}
      </MediaGrid>
    </Page>
  );
}
