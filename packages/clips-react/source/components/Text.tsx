import type {PropsWithChildren} from 'react';

import type {TextEmphasis} from '@watching/clips/elements';

export interface TextProps {
  emphasis?: TextEmphasis | boolean;
}

declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      'ui-text': TextProps;
    }
  }
}

export function Text(props: PropsWithChildren<TextProps>) {
  return <ui-text {...props} />;
}
