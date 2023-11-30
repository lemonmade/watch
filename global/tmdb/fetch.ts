/// <reference types="@quilted/quilt/modules" />

import Env from 'quilt:module/env';

declare module '@quilted/quilt/env' {
  interface EnvironmentVariables {
    TMDB_ACCESS_TOKEN: string;
  }
}

export async function tmdbFetch(
  path: string,
  {accessToken = Env.TMDB_ACCESS_TOKEN}: {accessToken?: string} = {},
) {
  const fetched = await fetch(`https://api.themoviedb.org/3${path}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  return fetched.json();
}
