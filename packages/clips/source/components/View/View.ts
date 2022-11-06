import {createRemoteComponent} from '@remote-ui/core';
import {type SpacingValue} from '../shared';

export interface ViewProps {
  padding?: boolean | SpacingValue;
  paddingInlineStart?: boolean | SpacingValue;
  paddingInlineEnd?: boolean | SpacingValue;
  paddingBlockStart?: boolean | SpacingValue;
  paddingBlockEnd?: boolean | SpacingValue;
}

/**
 * A View is a generic container component. Its contents will always be their
 * “natural” size, so this component can be useful in layout components (like `Layout`, `Tiles`,
 * `BlockStack`, `InlineStack`) that would otherwise stretch their children to fit.
 */
export const View = createRemoteComponent<'View', ViewProps>('View');
