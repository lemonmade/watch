import {View as UiView} from '@lemon/zest';
import {type PropsForClipsComponent} from './shared';

export function View({children}: PropsForClipsComponent<'View'>) {
  return <UiView>{children}</UiView>;
}
