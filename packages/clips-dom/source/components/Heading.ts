import {Heading as BaseHeading} from '@watching/clips';

import {
  createRemoteDOMComponent,
  type HTMLElementForRemoteComponent,
} from './shared.ts';

export const Heading = 'ui-heading';

export const HeadingComponent = createRemoteDOMComponent(BaseHeading, {
  properties: ['accessibilityRole', 'divider', 'level'],
});

export type UIHeadingElement = HTMLElementForRemoteComponent<
  typeof BaseHeading
>;
