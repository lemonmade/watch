import type {RenderableProps} from 'preact';

import type {
  Action as ActionElement,
  ActionProperties,
  ActionEvents,
} from '@watching/clips/elements';

export interface ActionProps
  extends RenderableProps<Partial<ActionProperties>, ActionElement> {
  onPress?(): void | Promise<void>;
  onpress?(event: ActionEvents['press']): void;
}

declare module 'preact' {
  namespace JSX {
    interface IntrinsicElements {
      'ui-action': Omit<ActionProps, 'onPress'>;
    }
  }
}

export function Action({onPress, ...props}: ActionProps) {
  return (
    <ui-action
      {...props}
      onpress={onPress ? (event) => event.respondWith(onPress()) : undefined}
    />
  );
}
