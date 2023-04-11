import {createRemoteComponent} from '@remote-ui/core';
import {type SpacingKeyword} from '../shared';

export interface ViewProps {
  padding?: boolean | SpacingKeyword;
  paddingInlineStart?: boolean | SpacingKeyword;
  paddingInlineEnd?: boolean | SpacingKeyword;
  paddingBlockStart?: boolean | SpacingKeyword;
  paddingBlockEnd?: boolean | SpacingKeyword;
}

/**
 * A View is a generic container component. Its contents will always be their
 * “natural” size, so this component can be useful in layout components (like `Layout`, `Tiles`,
 * `BlockStack`, `InlineStack`) that would otherwise stretch their children to fit.
 */
export const View = createRemoteComponent<'View', ViewProps>('View');
