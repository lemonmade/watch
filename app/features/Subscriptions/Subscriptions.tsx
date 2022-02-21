import {useQuery} from '@quilted/quilt';
import {MediaGrid, Poster} from '@lemon/zest';

import {Link, Page} from 'components';
import {parseGid} from 'utilities/graphql';

import subscriptionsQuery from './graphql/SubscriptionsQuery.graphql';

export function Subscriptions() {
  const {data} = useQuery(subscriptionsQuery);

  if (data == null) {
    return null;
  }

  return (
    <Page heading="Subscriptions">
      <MediaGrid>
        {data.subscriptions.map(({id, series}) => (
          <Link key={id} to={`/app/subscriptions/${parseGid(id).id}`}>
            {series.poster?.source && (
              <Poster
                source={
                  series.poster.source.replace('/original/', '/w342/') ?? ''
                }
              />
            )}
          </Link>
        ))}
      </MediaGrid>
    </Page>
  );
}
