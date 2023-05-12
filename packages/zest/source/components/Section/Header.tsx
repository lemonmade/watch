import {type ReactComponentPropsForClipsElement} from '../../shared/clips.ts';
import {useViewProps, resolveViewProps, type ViewProps} from '../View.tsx';

export type HeaderProps = ReactComponentPropsForClipsElement<'ui-header'> &
  ViewProps;

export function Header({children, ...viewProps}: HeaderProps) {
  const view = useViewProps(viewProps);
  return <header {...resolveViewProps(view)}>{children}</header>;
}
