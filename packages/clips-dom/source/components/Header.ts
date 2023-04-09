import {Header as BaseHeader} from '@watching/clips';

import {
  createRemoteDOMComponent,
  type HTMLElementForRemoteComponent,
} from './shared.ts';
import {VIEW_PROPERTIES} from './View.ts';

export const Header = 'ui-header';

export const HeaderComponent = createRemoteDOMComponent(BaseHeader, {
  properties: VIEW_PROPERTIES,
});

export type UIHeaderElement = HTMLElementForRemoteComponent<typeof BaseHeader>;
