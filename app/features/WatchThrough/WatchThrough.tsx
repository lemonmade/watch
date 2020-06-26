import React from 'react';
import {useQuery} from '@apollo/react-hooks';

import {BlockStack, Heading, TextField} from '../../components';

import watchThroughQuery from './graphql/WatchThroughQuery.graphql';

interface Props {
  id: string;
}

export function WatchThrough({id}: Props) {
  const {data} = useQuery(watchThroughQuery, {
    variables: {id},
  });

  if (data == null) return null;

  return (
    <BlockStack>
      <Heading>{data.watchThrough.series.name}</Heading>
      <TextField onChange={() => {}} />
    </BlockStack>
  );
}
