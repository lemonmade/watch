import type {RenderableProps} from 'preact';

import type {
  Action as ActionElement,
  ActionProperties,
  ActionEvents,
} from '@watching/clips/elements';

export interface ActionProps extends Partial<ActionProperties> {
  onPress?(): void | Promise<void>;
}

declare module 'preact' {
  namespace JSX {
    interface IntrinsicElements {
      'ui-action': RenderableProps<
        Omit<ActionProps, 'onPress'> & {
          onpress?: (event: ActionEvents['press']) => void;
        },
        ActionElement
      >;
    }
  }
}

export function Action({
  onPress,
  ...props
}: RenderableProps<ActionProps, ActionElement>) {
  return (
    <ui-action {...props} onpress={onPress ? () => onPress() : undefined} />
  );
}
