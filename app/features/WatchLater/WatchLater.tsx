import {Link} from '@quilted/quilt';
import {MediaGrid, Poster} from '@lemon/zest';

import {Page} from 'components';
import {parseGid, useQuery} from 'utilities/graphql';

import watchLaterQuery from './graphql/WatchLaterQuery.graphql';

export function WatchLater() {
  const {data} = useQuery(watchLaterQuery);

  const watchLater = data?.watchLater;

  return (
    <Page heading="Watch later">
      <MediaGrid>
        {watchLater?.items.map(({id, media}) =>
          media.__typename === 'Series' ? (
            <Link key={id} to={`/app/series/${parseGid(media.id).id}`}>
              {media.poster && (
                <Poster
                  source={media.poster.source.replace('/original/', '/w342/')}
                />
              )}
            </Link>
          ) : null,
        )}
      </MediaGrid>
    </Page>
  );
}
