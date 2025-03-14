export async function tmdbFetch<T = unknown>(
  path: string,
  {accessToken}: {accessToken: string},
): Promise<T> {
  const fetched = await fetch(`https://api.themoviedb.org/3${path}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    // @see https://github.com/nodejs/node/issues/46221
    ...{duplex: 'half'},
  });

  return fetched.json();
}
