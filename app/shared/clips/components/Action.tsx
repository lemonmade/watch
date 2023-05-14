import {Action as UiAction} from '@lemon/zest';
import {usePossibleThreadSignals, createClipsComponent} from './shared.ts';

export const Action = createClipsComponent(
  'ui-action',
  function Action({to, disabled, onPress, overlay, children}) {
    const signalProps = usePossibleThreadSignals({disabled});

    return (
      <UiAction {...signalProps} to={to} onPress={onPress} overlay={overlay}>
        {children}
      </UiAction>
    );
  },
);
