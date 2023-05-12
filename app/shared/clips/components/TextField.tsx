import {TextField as UiTextField} from '@lemon/zest';
import {
  usePossibleThreadSignals,
  type ReactComponentPropsForClipsElement,
} from './shared.ts';

export function TextField({
  label,
  value,
  disabled,
  readonly,
  ...rest
}: ReactComponentPropsForClipsElement<'ui-text-field'>) {
  const signalProps = usePossibleThreadSignals({value, disabled, readonly});
  return <UiTextField {...signalProps} label={label} {...rest} />;
}
