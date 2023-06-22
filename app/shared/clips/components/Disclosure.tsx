import {Disclosure as UiDisclosure} from '@lemon/zest';
import {createClipsComponent} from './shared.ts';

export const Disclosure = createClipsComponent(
  'ui-disclosure',
  function Disclosure({children, label}) {
    return <UiDisclosure label={label}>{children}</UiDisclosure>;
  },
);
