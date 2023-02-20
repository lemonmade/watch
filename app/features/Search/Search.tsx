import {useState, useRef, useEffect, useCallback} from 'react';
import {
  usePerformanceNavigation,
  useCurrentUrl,
  useNavigate,
} from '@quilted/quilt';

import {BlockStack, TextField, Action} from '@lemon/zest';

import {Page} from '~/shared/page';
import {useQuery} from '~/shared/graphql';

import searchQuery from './graphql/SearchQuery.graphql';

const QUERY_PARAM = 'query';

export default function Search() {
  const navigate = useNavigate();
  const committedSearch = useCurrentUrl().searchParams.get(QUERY_PARAM) ?? '';
  const [search, setSearch] = useState(committedSearch);

  function updateCommittedSearch(search: string) {
    navigate(
      (currentUrl) => {
        const newUrl = new URL(currentUrl);

        if (search.trim().length === 0) {
          newUrl.searchParams.delete(QUERY_PARAM);
        } else {
          newUrl.searchParams.set(QUERY_PARAM, search);
        }
        return newUrl;
      },
      {replace: true},
    );
  }

  const handleSearchInput = useThrottledCallback(updateCommittedSearch, {
    delay: 1_000,
  });

  const {data, isLoading} = useQuery(searchQuery, {
    enabled: committedSearch.length > 0,
    variables: {query: committedSearch},
  });

  usePerformanceNavigation({state: isLoading ? 'loading' : 'complete'});

  const series = data?.search.series ?? [];

  return (
    <Page heading="Search">
      <BlockStack spacing>
        <TextField
          label="Search"
          value={search}
          onChange={(value) => {
            setSearch(value);
            updateCommittedSearch(value);
          }}
          onInput={handleSearchInput}
        />
        {series.length > 0 ? (
          <BlockStack>
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

function useThrottledCallback<T extends (...args: any[]) => any>(
  callback: T,
  {delay}: {delay: number},
): (...args: Parameters<T>) => void {
  const searchTimeout = useRef<null | number>(null);

  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  useEffect(
    () => () => {
      if (searchTimeout.current != null) {
        clearTimeout(searchTimeout.current);
      }
    },
    [],
  );

  return useCallback(
    (...args) => {
      if (searchTimeout.current != null) {
        clearTimeout(searchTimeout.current);
      }

      searchTimeout.current = window.setTimeout(() => {
        searchTimeout.current = null;
        callbackRef.current(...args);
      }, delay);
    },
    [delay],
  );
}
