import {useEffect, useRef} from 'react';
import type {GithubOAuthPopoverMessage} from 'global/utilities/auth';

export function openGithubOAuthPopover(targetUrl: URL) {
  const height = 600;
  const width = 600;

  const options = {
    width,
    height,
    top: window.top.outerHeight / 2 + window.top.screenY - height / 2,
    left: window.top.outerWidth / 2 + window.top.screenX - width / 2,
  };

  window.open(
    targetUrl.href,
    'GithubOAuthModal',
    Object.entries(options)
      .map(([key, value]) => `${key}=${value}`)
      .join(','),
  );
}

export function useGithubOAuthPopoverEvents(
  handleEvent: (
    event: GithubOAuthPopoverMessage,
    popover: {close(): void},
  ) => void,
) {
  const handleEventRef = useRef(handleEvent);
  handleEventRef.current = handleEvent;

  useEffect(() => {
    function handler({data, origin, source}: MessageEvent) {
      if (origin !== window.location.origin) return;

      let parsed: any;

      try {
        parsed = JSON.parse(data);
        if (parsed.topic !== 'github:oauth') {
          return;
        }

        handleEventRef.current(parsed, {
          close() {
            (source as Window)?.close?.();
          },
        });
      } catch {
        // Intentional no-op
      }
    }

    window.addEventListener('message', handler);

    return () => {
      window.removeEventListener('message', handler);
    };
  }, []);
}
