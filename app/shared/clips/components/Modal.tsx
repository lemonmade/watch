import {Modal as UiModal} from '@lemon/zest';
import {type PropsForClipsComponent} from './shared.ts';

export function Modal({children, padding}: PropsForClipsComponent<'Modal'>) {
  return <UiModal padding={padding}>{children}</UiModal>;
}
