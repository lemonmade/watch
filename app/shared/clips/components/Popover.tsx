import {Popover as UiPopover} from '@lemon/zest';
import {type PropsForClipsComponent} from './shared.ts';

export function Popover({
  children,
  blockAttachment,
  inlineAttachment,
}: PropsForClipsComponent<'Popover'>) {
  return (
    <UiPopover
      blockAttachment={blockAttachment}
      inlineAttachment={inlineAttachment}
    >
      {children}
    </UiPopover>
  );
}
