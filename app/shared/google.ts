import {useCallback, useEffect, useRef} from 'preact';
import {useRouter} from '@quilted/quilt/navigate';

import {
  GoogleOAuthFlow,
  GOOGLE_OAUTH_MESSAGE_TOPIC,
  SearchParam,
  type GoogleOAuthMessage,
} from '~/global/auth';

export {GoogleOAuthFlow};

const HEIGHT = 600;
const WIDTH = 600;

const FLOW_PATH_MAP = new Map([
  [GoogleOAuthFlow.SignIn, 'sign-in'],
  [GoogleOAuthFlow.CreateAccount, 'create-account'],
  [GoogleOAuthFlow.Connect, 'connect'],
]);

export function useGoogleOAuthModal<Flow extends GoogleOAuthFlow>(
  flow: Flow,
  onEvent: (event: Extract<GoogleOAuthMessage, {flow: Flow}>) => void,
) {
  const router = useRouter();

  const handleEventRef = useRef(onEvent);
  handleEventRef.current = onEvent;

  const eventHandlerRef = useRef<(...args: any[]) => any>();

  const open = useCallback(
    ({
      redirectTo,
      resolveUrl,
    }: {redirectTo?: string; resolveUrl?(url: URL): URL | void} = {}) => {
      const options = {
        height: HEIGHT,
        width: WIDTH,
        top: window.top!.outerHeight / 2 + window.top!.screenY - HEIGHT / 2,
        left: window.top!.outerWidth / 2 + window.top!.screenX - WIDTH / 2,
      };

      const {url: oauthUrl} = router.resolve(
        `/internal/auth/google/${FLOW_PATH_MAP.get(flow)}`,
      );

      if (redirectTo) {
        oauthUrl.searchParams.set(SearchParam.RedirectTo, redirectTo);
      }

      const finalOAuthUrl = resolveUrl?.(oauthUrl) ?? oauthUrl;

      const opened = window.open(
        finalOAuthUrl.href,
        'GoogleOAuthModal',
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
              parsed.topic !== GOOGLE_OAUTH_MESSAGE_TOPIC ||
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
