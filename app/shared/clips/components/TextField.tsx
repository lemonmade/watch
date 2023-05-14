import {TextField as UiTextField} from '@lemon/zest';
import {usePossibleThreadSignals, createClipsComponent} from './shared.ts';

export const TextField = createClipsComponent(
  'ui-text-field',
  function TextField({label, value, disabled, readonly, ...rest}) {
    const signalProps = usePossibleThreadSignals({value, disabled, readonly});
    return <UiTextField {...signalProps} label={label} {...rest} />;
  },
);
