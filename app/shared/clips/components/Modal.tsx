import {SPACING_OR_NONE_KEYWORDS} from '@watching/design';
import {Modal as UIModal} from '@lemon/zest';
import {
  createClipsComponentRenderer,
  useRenderedChildren,
  restrictToAllowedValues,
} from './shared.ts';

export const Modal = createClipsComponentRenderer(
  'ui-modal',
  function Modal(props) {
    const {children} = useRenderedChildren(props);

    const attributes = props.element.attributes.value;

    return (
      <UIModal
        padding={restrictToAllowedValues(
          attributes.padding,
          SPACING_OR_NONE_KEYWORDS,
        )}
      >
        {children}
      </UIModal>
    );
  },
);
