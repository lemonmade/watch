import {Popover as UiPopover} from '@lemon/zest';
import {type ReactComponentPropsForClipsElement} from './shared.ts';

export function Popover({
  children,
  blockAttachment,
  inlineAttachment,
}: ReactComponentPropsForClipsElement<'ui-popover'>) {
  return (
    <UiPopover
      blockAttachment={blockAttachment}
      inlineAttachment={inlineAttachment}
    >
      {children}
    </UiPopover>
  );
}
