import {Action as UIButton} from '@lemon/zest';
import {
  createClipsComponentRenderer,
  useRenderedChildren,
  wrapEventListenerForCallback,
} from './shared.ts';

export const Button = createClipsComponentRenderer(
  'ui-button',
  function Button(props) {
    const {overlay, children} = useRenderedChildren(props, {
      slotProps: ['overlay'],
    });

    const attributes = props.element.attributes.value;
    const events = props.element.eventListeners.value;

    return (
      <UIButton
        to={attributes.to}
        disabled={attributes.disabled != null}
        onPress={
          events.press ? wrapEventListenerForCallback(events.press) : undefined
        }
        overlay={overlay}
      >
        {children}
      </UIButton>
    );
  },
);
