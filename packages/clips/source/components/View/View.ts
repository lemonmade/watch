import {
  createRemoteElement,
  type RemoteElementPropertiesDefinition,
} from '@lemonmade/remote-ui/elements';

import {RemoteElementSpacingValue} from '../shared.ts';
import {type SpacingKeyword} from '../../styles.ts';

export interface ViewProperties {
  padding?: boolean | SpacingKeyword;
  paddingInlineStart?: boolean | SpacingKeyword;
  paddingInlineEnd?: boolean | SpacingKeyword;
  paddingBlockStart?: boolean | SpacingKeyword;
  paddingBlockEnd?: boolean | SpacingKeyword;
}

export const View = 'ui-view';

export const VIEW_PROPERTIES: RemoteElementPropertiesDefinition<ViewProperties> =
  {
    padding: {type: RemoteElementSpacingValue},
    paddingInlineStart: {type: RemoteElementSpacingValue},
    paddingInlineEnd: {type: RemoteElementSpacingValue},
    paddingBlockStart: {type: RemoteElementSpacingValue},
    paddingBlockEnd: {type: RemoteElementSpacingValue},
  };

/**
 * A View is a generic container component. Its contents will always be their
 * “natural” size, so this component can be useful in layout components (like `Layout`, `Tiles`,
 * `BlockStack`, `InlineStack`) that would otherwise stretch their children to fit.
 */
export const ViewElement = createRemoteElement<ViewProperties>({
  properties: VIEW_PROPERTIES,
});

customElements.define(View, ViewElement);

declare global {
  interface HTMLElementTagNameMap {
    [View]: InstanceType<typeof ViewElement>;
  }
}
