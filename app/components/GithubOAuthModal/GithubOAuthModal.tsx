import {useEffect, useRef} from 'react';
import type {GithubOAuthMessage} from 'global/utilities/auth';

const HEIGHT = 600;
const WIDTH = 600;

interface ModalController {
  close(): void;
}

interface Props<Type extends GithubOAuthMessage['type']> {
  open: false | URL;
  type: Type;
  onEvent(
    event: Extract<GithubOAuthMessage, {type: Type}>,
    controller: ModalController,
  ): void;
}

export function GithubOAuthModal<Type extends GithubOAuthMessage['type']>({
  open,
  type,
  onEvent,
}: Props<Type>) {
  const handleEventRef = useRef(onEvent);
  handleEventRef.current = onEvent;

  useEffect(() => {
    if (open === false) return;

    const options = {
      height: HEIGHT,
      width: WIDTH,
      top: window.top.outerHeight / 2 + window.top.screenY - HEIGHT / 2,
      left: window.top.outerWidth / 2 + window.top.screenX - WIDTH / 2,
    };

    const opened = window.open(
      open.href,
      'GithubOAuthModal',
      Object.entries(options)
        .map(([key, value]) => `${key}=${value}`)
        .join(','),
    );

    function handler({data, source}: MessageEvent) {
      if (source !== opened) return;

      try {
        const parsed = JSON.parse(data);

        if (parsed.topic !== 'github:oauth' || parsed.type !== type) return;

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
  }, [open, type]);

  return null;
}
