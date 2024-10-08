import {useState, useRef, useEffect, useCallback} from 'preact/hooks';

import {useCurrentURL, useNavigate} from '@quilted/quilt/navigation';
import {usePerformanceNavigation} from '@quilted/quilt/performance';
import {BlockStack, TextField, Poster} from '@lemon/zest';

import {Page} from '~/shared/page.ts';
import {useGraphQLQuery} from '~/shared/graphql.ts';
import {MediaGrid, MediaGridItem} from '~/shared/media.ts';

import searchQuery from './graphql/SearchQuery.graphql';

const QUERY_PARAM = 'query';

export default function Search() {
  const navigate = useNavigate();
  const committedSearch = useCurrentURL().searchParams.get(QUERY_PARAM) ?? '';
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

  const {value, isRunning} = useGraphQLQuery(searchQuery, {
    suspend: false,
    active: committedSearch.length > 0,
    variables: {query: committedSearch},
  });

  usePerformanceNavigation({state: isRunning ? 'loading' : 'complete'});

  const series = value?.data?.search.series ?? [];

  return (
    <Page heading="Search">
      <BlockStack spacing>
        <TextField
          label="Find a TV show"
          labelStyle="placeholder"
          value={search}
          onChange={(value) => {
            setSearch(value);
            updateCommittedSearch(value);
          }}
          onInput={handleSearchInput}
        />
        {series.length > 0 ? (
          <MediaGrid>
            {series.map((series) => (
              <MediaGridItem
                key={series.id}
                to={`/app/series/${series.handle}`}
                image={
                  <Poster source={series.poster?.source} label={series.name} />
                }
              />
            ))}
          </MediaGrid>
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
