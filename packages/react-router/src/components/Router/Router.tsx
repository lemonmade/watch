import React, {ReactNode, useState, useEffect, useMemo} from 'react';

import {CurrentUrlContext, RouterContext} from '../../context';
import {
  Router as RouterControl,
  RemoteRouter as RemoteRouterControl,
  LISTEN,
} from '../../router';

interface Props {
  router: RemoteRouterControl;
  children?: ReactNode;
}

export function RemoteRouter({children, router: remoteRouter}: Props) {
  const router = useMemo(() => new RouterControl(remoteRouter), [remoteRouter]);
  const [url, setUrl] = useState(() => router.currentUrl);

  useEffect(() => router[LISTEN]((newUrl) => setUrl(newUrl)), [router]);

  return (
    <>
      <RouterContext.Provider value={router}>
        <CurrentUrlContext.Provider value={url}>
          {children}
        </CurrentUrlContext.Provider>
      </RouterContext.Provider>
    </>
  );
}
