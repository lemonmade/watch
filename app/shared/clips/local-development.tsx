import {useEffect} from 'react';
import {useInitialUrl} from '@quilted/quilt';

import {type ClipsManager} from './manager.ts';

const LOCAL_STORAGE_KEY = 'localDevelopment';

export function ClipsLocalDevelopment({manager}: {manager: ClipsManager}) {
  useClipsLocalDevelopment(manager);
  return null;
}

function useClipsLocalDevelopment(manager: ClipsManager) {
  const initialUrl = useInitialUrl();

  useEffect(() => {
    const localDevelopmentConnectUrl = getDevelopmentServerUrl(initialUrl);

    const abort = new AbortController();

    manager.localDevelopment.on(
      'connect:end',
      () => {
        persistLocalDevelopmentServerUrl(manager.localDevelopment.url.value);
      },
      {signal: abort.signal},
    );

    if (localDevelopmentConnectUrl) {
      manager.localDevelopment.connect(localDevelopmentConnectUrl);
    }

    return () => {
      abort.abort();
    };
  }, [initialUrl, manager]);
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
