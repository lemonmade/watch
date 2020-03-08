import React from 'react';
import {useQuery} from '@apollo/react-hooks';

import {parseGid} from '../../utilities/graphql';
import {Link, MediaGrid, Stack, Poster, Heading} from '../../components';

import subscriptionsQuery from './graphql/SubscriptionsQuery.graphql';

export function Subscriptions() {
  const {data} = useQuery(subscriptionsQuery);

  if (data == null) {
    return null;
  }

  return (
    <Stack>
      <Heading>Subscriptions</Heading>
      <MediaGrid>
        {data.subscriptions.map(({id, series}) => (
          <Link key={id} to={`/series/${parseGid(series.id).id}`}>
            <Poster source={series.poster?.source ?? ''} />
          </Link>
        ))}
      </MediaGrid>
    </Stack>
  );
}
