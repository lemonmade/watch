import {Action as UiAction} from '@lemon/zest';
import {
  usePossibleThreadSignals,
  type PropsForClipsComponent,
} from './shared.ts';

export function Action({
  to,
  disabled,
  onPress,
  overlay,
  children,
}: PropsForClipsComponent<'Action'>) {
  const signalProps = usePossibleThreadSignals({disabled});

  return (
    <UiAction {...signalProps} to={to} onPress={onPress} overlay={overlay}>
      {children}
    </UiAction>
  );
}
