import {Popover as UiPopover} from '@lemon/zest';
import {createClipsComponent} from './shared.ts';

export const Popover = createClipsComponent(
  'ui-popover',
  function Popover({children, blockAttachment, inlineAttachment}) {
    return (
      <UiPopover
        blockAttachment={blockAttachment}
        inlineAttachment={inlineAttachment}
      >
        {children}
      </UiPopover>
    );
  },
);
