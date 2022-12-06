import {Header as BaseHeader} from '@watching/clips';
import {
  createRemoteDOMComponent,
  type HTMLElementForRemoteComponent,
} from './shared';
import {VIEW_PROPERTIES} from './View';

export const Header = 'ui-header';

export const HeaderComponent = createRemoteDOMComponent(BaseHeader, {
  properties: VIEW_PROPERTIES,
});

export type UIHeaderElement = HTMLElementForRemoteComponent<typeof BaseHeader>;
