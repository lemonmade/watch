import {useCallback, useEffect, useRef} from 'preact/hooks';
import {useRouter} from '@quilted/quilt/navigation';

import {
  GithubOAuthFlow,
  GITHUB_OAUTH_MESSAGE_TOPIC,
  SearchParam,
} from '~/global/auth';
import type {GithubOAuthMessage} from '~/global/auth';

export {GithubOAuthFlow};

const HEIGHT = 600;
const WIDTH = 600;

const FLOW_PATH_MAP = new Map([
  [GithubOAuthFlow.SignIn, 'sign-in'],
  [GithubOAuthFlow.CreateAccount, 'create-account'],
  [GithubOAuthFlow.Connect, 'connect'],
]);

export function useGithubOAuthModal<Flow extends GithubOAuthFlow>(
  flow: Flow,
  onEvent: (event: Extract<GithubOAuthMessage, {flow: Flow}>) => void,
) {
  const router = useRouter();

  const handleEventRef = useRef(onEvent);
  handleEventRef.current = onEvent;

  const eventHandlerRef = useRef<(...args: any[]) => any>();

  const open = useCallback(
    ({
      resolveUrl,
      redirectTo,
    }: {redirectTo?: string; resolveUrl?(url: URL): URL | void} = {}) => {
      const options = {
        height: HEIGHT,
        width: WIDTH,
        top: window.top!.outerHeight / 2 + window.top!.screenY - HEIGHT / 2,
        left: window.top!.outerWidth / 2 + window.top!.screenX - WIDTH / 2,
      };

      const {url: oauthUrl} = router.resolve(
        `/internal/auth/github/${FLOW_PATH_MAP.get(flow)}`,
      );

      if (redirectTo) {
        oauthUrl.searchParams.set(SearchParam.RedirectTo, redirectTo);
      }

      const finalUrl = resolveUrl?.(oauthUrl) ?? oauthUrl;

      const opened = window.open(
        finalUrl.href,
        'GithubOAuthModal',
        Object.entries(options)
          .map(([key, value]) => `${key}=${value}`)
          .join(','),
      );

      if (eventHandlerRef.current == null) {
        const handler = ({data, source}: MessageEvent) => {
          if (source !== opened) return;

          try {
            const parsed = JSON.parse(data);

            if (
              parsed.topic !== GITHUB_OAUTH_MESSAGE_TOPIC ||
              parsed.flow !== flow
            ) {
              return;
            }

            window.removeEventListener('message', handler);
            eventHandlerRef.current = undefined;

            (source as Window)?.close?.();
            handleEventRef.current(parsed);
          } catch {
            // Intentional no-op
          }
        };

        eventHandlerRef.current = handler;

        window.addEventListener('message', handler);
      }
    },
    [flow, router],
  );

  useEffect(() => {
    return () => {
      if (eventHandlerRef.current) {
        window.removeEventListener('message', eventHandlerRef.current);
      }
    };
  });

  return open;
}
