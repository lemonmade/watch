import {Modal as UiModal} from '@lemon/zest';
import {type ReactComponentPropsForClipsElement} from './shared.ts';

export function Modal({
  children,
  padding,
}: ReactComponentPropsForClipsElement<'ui-modal'>) {
  return <UiModal padding={padding}>{children}</UiModal>;
}
