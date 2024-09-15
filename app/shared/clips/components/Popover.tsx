import {Popover as UIPopover} from '@lemon/zest';
import {POPOVER_ATTACHMENT_KEYWORDS} from '@watching/design';
import {
  createClipsComponentRenderer,
  useRenderedChildren,
  restrictToAllowedValues,
} from './shared.ts';

export const Popover = createClipsComponentRenderer(
  'ui-popover',
  function Popover(props) {
    const {children} = useRenderedChildren(props);

    const attributes = props.element.attributes.value;

    return (
      <UIPopover
        blockAttachment={restrictToAllowedValues(
          attributes['block-attachment'],
          POPOVER_ATTACHMENT_KEYWORDS,
        )}
        inlineAttachment={restrictToAllowedValues(
          attributes['inline-attachment'],
          POPOVER_ATTACHMENT_KEYWORDS,
        )}
      >
        {children}
      </UIPopover>
    );
  },
);
