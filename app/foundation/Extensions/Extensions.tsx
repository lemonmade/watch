import {useMemo, useEffect} from 'react';
import {useInitialUrl, type PropsWithChildren} from '@quilted/quilt';
import {createClipsManager, ClipsManagerContext} from '~/shared/clips';

const LOCAL_STORAGE_KEY = 'localDevelopment';

export function Extensions({children}: PropsWithChildren) {
  const manager = useMemo(() => createClipsManager(), []);
  const initialUrl = useInitialUrl();

  useEffect(() => {
    const localDevelopmentConnectUrl = getDevelopmentServerUrl(initialUrl);

    if (localDevelopmentConnectUrl == null) return;

    const abort = new AbortController();

    manager.localDevelopment.on(
      'connect:end',
      () => {
        persistLocalDevelopmentServerUrl(manager.localDevelopment.url.value);
      },
      {signal: abort.signal},
    );

    manager.localDevelopment.connect(localDevelopmentConnectUrl);

    return () => {
      abort.abort();
    };
  }, [initialUrl, manager]);

  return (
    <ClipsManagerContext manager={manager}>{children}</ClipsManagerContext>
  );
}

const VALID_PROTOCOLS = new Set(['ws:', 'wss:']);

function getDevelopmentServerUrl(initialUrl?: URL): URL | undefined {
  const connectParam = initialUrl?.searchParams.get('connect');

  if (connectParam == null) return getPersistedLocalDevelopmentServerUrl();

  try {
    // TODO handle errors in parsing/ connecting
    const localDevelopmentConnectUrl = new URL(connectParam);

    if (!VALID_PROTOCOLS.has(localDevelopmentConnectUrl.protocol)) {
      return undefined;
    }

    return localDevelopmentConnectUrl;
  } catch (error) {
    return undefined;
  }
}

function persistLocalDevelopmentServerUrl(url: URL | undefined) {
  if (url) {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify({url: url.href}));
  } else {
    localStorage.removeItem(LOCAL_STORAGE_KEY);
  }
}

function getPersistedLocalDevelopmentServerUrl() {
  try {
    const {url} = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) ?? '{}');
    return url && new URL(url);
  } catch {
    return undefined;
  }
}
