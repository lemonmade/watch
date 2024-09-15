import type {RenderableProps} from 'preact';

import type {
  Popover as PopoverElement,
  PopoverProperties,
} from '@watching/clips/elements';

export interface PopoverProps extends Partial<PopoverProperties> {}

declare module 'preact' {
  namespace JSX {
    interface IntrinsicElements {
      'ui-popover': RenderableProps<PopoverProps, PopoverElement>;
    }
  }
}

export function Popover(props: RenderableProps<PopoverProps, PopoverElement>) {
  return <ui-popover {...props} />;
}
