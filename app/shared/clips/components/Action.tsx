import {Action as UiAction} from '@lemon/zest';
import {usePossibleThreadSignals, type PropsForClipsComponent} from './shared';

export function Action({
  to,
  disabled,
  onPress,
  children,
}: PropsForClipsComponent<'Action'>) {
  const signalProps = usePossibleThreadSignals({disabled});

  return (
    <UiAction {...signalProps} to={to} onPress={onPress}>
      {children}
    </UiAction>
  );
}
