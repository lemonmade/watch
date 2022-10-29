import {TextField as UiTextField} from '@lemon/zest';
import {usePossibleThreadSignals, type PropsForClipsComponent} from './shared';

export function TextField({label, value}: PropsForClipsComponent<'TextField'>) {
  const signalProps = usePossibleThreadSignals({value});
  return <UiTextField {...signalProps} label={label} />;
}
