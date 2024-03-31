import 'dotenv/config';

// console.log(await tmdbSearch('survivor'));
// console.log(await tmdbSeries({id: 213810}));

// Utilities

export function tmdbSeries({id}: {id: number}) {
  return tmdbFetch(`/tv/${id}`);
}

export function tmdbSeasonForSeries({
  id,
  season,
}: {
  id: number;
  season: number;
}) {
  return tmdbFetch(`/tv/${id}/season/${season}`);
}

export function tmdbSearch(query: string) {
  return tmdbFetch<{results: unknown[]}>(
    `/search/tv?query=${encodeURIComponent(query)}`,
  );
}

export async function tmdbFetch<T = unknown>(path: string): Promise<T> {
  const fetched = await fetch(`https://api.themoviedb.org/3${path}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${process.env.TMDB_ACCESS_TOKEN}`,
    },
  });

  return fetched.json();
}
