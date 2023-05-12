import {Action as UiAction} from '@lemon/zest';
import {
  usePossibleThreadSignals,
  createRemoteComponentRenderer,
  type ReactComponentPropsForClipsElement,
} from './shared.ts';

export const Action = createRemoteComponentRenderer(function Action({
  to,
  disabled,
  onPress,
  overlay,
  children,
}: ReactComponentPropsForClipsElement<'ui-action'>) {
  const signalProps = usePossibleThreadSignals({disabled});

  return (
    <UiAction {...signalProps} to={to} onPress={onPress} overlay={overlay}>
      {children}
    </UiAction>
  );
});
