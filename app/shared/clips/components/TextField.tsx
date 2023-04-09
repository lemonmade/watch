import {TextField as UiTextField} from '@lemon/zest';
import {
  usePossibleThreadSignals,
  type PropsForClipsComponent,
} from './shared.ts';

export function TextField({
  label,
  value,
  disabled,
  readonly,
  ...rest
}: PropsForClipsComponent<'TextField'>) {
  const signalProps = usePossibleThreadSignals({value, disabled, readonly});
  return <UiTextField {...signalProps} label={label} {...rest} />;
}
