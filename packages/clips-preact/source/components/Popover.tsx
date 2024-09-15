import type {RenderableProps} from 'preact';

import type {
  Popover as PopoverElement,
  PopoverProperties,
} from '@watching/clips/elements';

export interface PopoverProps
  extends RenderableProps<PopoverProperties, PopoverElement> {}

declare module 'preact' {
  namespace JSX {
    interface IntrinsicElements {
      'ui-popover': PopoverProps;
    }
  }
}

export function Popover(props: PopoverProps) {
  return <ui-popover {...props} />;
}
