import {useEffect} from 'preact/hooks';
import {useBrowserRequest} from '@quilted/quilt/browser';

import {type ClipsManager} from './manager.ts';

const LOCAL_STORAGE_KEY = 'localDevelopment';

export function ClipsLocalDevelopment({manager}: {manager: ClipsManager}) {
  useClipsLocalDevelopment(manager);
  return null;
}

function useClipsLocalDevelopment(manager: ClipsManager) {
  const {url} = useBrowserRequest();

  useEffect(() => {
    const localDevelopmentConnectUrl = getDevelopmentServerUrl(url);

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
  }, [manager]);
}

const VALID_PROTOCOLS = new Set(['ws:', 'wss:']);

function getDevelopmentServerUrl(initialUrl: string | URL): URL | undefined {
  const searchParams = new URL(initialUrl).searchParams;
  const connectParam = searchParams?.get('connect');

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
