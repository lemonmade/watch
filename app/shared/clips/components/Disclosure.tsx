import {Disclosure as UIDisclosure} from '@lemon/zest';

import {createClipsComponentRenderer, useRenderedChildren} from './shared.ts';

export const Disclosure = createClipsComponentRenderer(
  'ui-disclosure',
  function Disclosure(props) {
    const {label, children} = useRenderedChildren(props, {
      slotProps: ['label'],
    });

    const attributes = props.element.attributes.value;

    return (
      <UIDisclosure label={label ?? attributes.label}>{children}</UIDisclosure>
    );
  },
);
