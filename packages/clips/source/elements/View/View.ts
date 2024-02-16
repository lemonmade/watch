import {
  createRemoteElement,
  type RemoteElementPropertiesDefinition,
} from '@remote-dom/core/elements';

import {RemoteElementSpacingValue} from '../shared.ts';
import {type SpacingKeyword} from '../../styles.ts';

export interface ViewProperties {
  padding?: boolean | SpacingKeyword;
  paddingInlineStart?: boolean | SpacingKeyword;
  paddingInlineEnd?: boolean | SpacingKeyword;
  paddingBlockStart?: boolean | SpacingKeyword;
  paddingBlockEnd?: boolean | SpacingKeyword;
}

export const VIEW_PROPERTIES: RemoteElementPropertiesDefinition<ViewProperties> =
  {
    padding: {type: RemoteElementSpacingValue, default: false},
    paddingInlineStart: {type: RemoteElementSpacingValue, default: false},
    paddingInlineEnd: {type: RemoteElementSpacingValue, default: false},
    paddingBlockStart: {type: RemoteElementSpacingValue, default: false},
    paddingBlockEnd: {type: RemoteElementSpacingValue, default: false},
  };

/**
 * A View is a generic container component. Its contents will always be their
 * “natural” size, so this component can be useful in layout components (like `Layout`, `Tiles`,
 * `BlockStack`, `InlineStack`) that would otherwise stretch their children to fit.
 */
export const View = createRemoteElement<ViewProperties>({
  properties: VIEW_PROPERTIES,
});

customElements.define('ui-view', View);

declare global {
  interface HTMLElementTagNameMap {
    'ui-view': InstanceType<typeof View>;
  }
}
