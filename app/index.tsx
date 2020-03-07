import React, {useMemo, ComponentProps} from 'react';
import {render} from 'react-dom';
import {
  createWorkerComponent,
  Router,
  AutoHeadingGroup,
  useRouter,
} from '@quilted/quilt';

import * as components from './ui';

import '@lemon/zest/core.css';
import './App.css';

const App = createWorkerComponent(() => import('./App'), {
  components,
});

render(
  <Router>
    <AutoHeadingGroup>
      <WrappedApp />
    </AutoHeadingGroup>
  </Router>,
  document.querySelector('#app'),
);

function WrappedApp() {
  const router = useRouter();

  const remoteRouter: ComponentProps<typeof App>['router'] = useMemo(() => {
    const listeners = new Map();
    const blockers = new Map();

    return {
      initialUrl: toRemoteUrl(router.currentUrl),
      navigate(url, options = {}) {
        router.navigate(new URL(url.href), {...options, state: url.state});
      },
      go: router.go.bind(router),
      listen(listener) {
        listeners.set(
          listener,
          router.listen((url) => {
            listener(toRemoteUrl(url));
          }),
        );
      },
      unlisten(listener) {
        listeners.get(listener)?.();
        listeners.delete(listener);
      },
      block(blocker) {
        blockers.set(
          blocker,
          router.block((url, redo) => blocker(toRemoteUrl(url), redo) as any),
        );
      },
      unblock(blocker) {
        blockers.get(blocker)?.();
        blockers.delete(blocker);
      },
    };
  }, [router]);

  return <App router={remoteRouter} />;
}

function toRemoteUrl(url: ReturnType<typeof useRouter>['currentUrl']) {
  return {
    href: url.href,
    state: url.state,
  };
}
