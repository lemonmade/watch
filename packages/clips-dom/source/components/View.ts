import {
  RemoteElement,
  type RemoteElementProperties,
} from '@lemonmade/remote-ui';
import {type SpacingKeyword} from '@watching/clips';

export interface ViewProps {
  padding?: boolean | SpacingKeyword;
  paddingInlineStart?: boolean | SpacingKeyword;
  paddingInlineEnd?: boolean | SpacingKeyword;
  paddingBlockStart?: boolean | SpacingKeyword;
  paddingBlockEnd?: boolean | SpacingKeyword;
}

export const VIEW_PROPERTIES: RemoteElementProperties = {
  padding: {attribute: true},
  paddingBlockStart: {attribute: true},
  paddingBlockEnd: {attribute: true},
  paddingInlineEnd: {attribute: true},
  paddingInlineStart: {attribute: true},
};

export const View = 'ui-view';

export class ViewElement extends RemoteElement {
  static readonly properties = VIEW_PROPERTIES;
}

declare global {
  interface HTMLElementTagNameMap {
    [View]: ViewElement;
  }
}

customElements.define(View, ViewElement);
