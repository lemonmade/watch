import {View as BaseView, type ViewProps} from '@watching/clips';
import {
  createRemoteDOMComponent,
  type HTMLElementForRemoteComponent,
} from './shared';

export const VIEW_PROPERTIES: (keyof ViewProps)[] = [
  'padding',
  'paddingBlockEnd',
  'paddingBlockStart',
  'paddingInlineEnd',
  'paddingInlineStart',
];

export const View = 'ui-view';

export const ViewComponent = createRemoteDOMComponent(BaseView, {
  properties: VIEW_PROPERTIES,
});

export type UIViewElement = HTMLElementForRemoteComponent<typeof BaseView>;
