import {Action as UIAction} from '@lemon/zest';
import {
  createClipsComponentRenderer,
  useRenderedChildren,
  wrapEventListenerForCallback,
} from './shared.ts';

export const Action = createClipsComponentRenderer(
  'ui-action',
  function Action(props) {
    const {children} = useRenderedChildren(props);

    const attributes = props.element.attributes.value;
    const events = props.element.eventListeners.value;

    return (
      <UIAction
        to={attributes.to}
        disabled={attributes.disabled != null}
        onPress={
          events.press ? wrapEventListenerForCallback(events.press) : undefined
        }
      >
        {children}
      </UIAction>
    );
  },
);
