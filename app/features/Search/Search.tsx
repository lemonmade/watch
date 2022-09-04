import {useState, useRef, useEffect} from 'react';

import {BlockStack, TextField, Action} from '@lemon/zest';

import {Page} from '~/shared/page';
import {useQuery} from '~/shared/graphql';

import searchQuery from './graphql/SearchQuery.graphql';

export function Search() {
  const [search, setSearch] = useState('');
  const [committedSearch, setCommittedSearch] = useState(search);
  const searchTimeout = useRef<null | number>(null);

  const {data} = useQuery(searchQuery, {
    enabled: committedSearch.length > 0,
    variables: {query: committedSearch},
  });

  useEffect(
    () => () => {
      if (searchTimeout.current != null) {
        clearTimeout(searchTimeout.current);
      }
    },
    [],
  );

  const series = data?.search.series ?? [];

  return (
    <Page heading="Search">
      <BlockStack>
        <TextField
          value={search}
          onChange={(value) => setSearch(value)}
          onInput={(value) => {
            if (searchTimeout.current != null) {
              clearTimeout(searchTimeout.current);
            }

            searchTimeout.current = window.setTimeout(() => {
              setCommittedSearch(value);
            }, 1_000);
          }}
        />
        {series.length > 0 ? (
          <BlockStack spacing="none">
            {series.map((series) => (
              <Action key={series.id} to={`/app/series/${series.handle}`}>
                {series.name}
              </Action>
            ))}
          </BlockStack>
        ) : null}
      </BlockStack>
    </Page>
  );
}
