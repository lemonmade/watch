import {type PreactComponentPropsForClipsElement} from '../../shared/clips.ts';
import {useViewProps, resolveViewProps, type ViewProps} from '../View.tsx';

export type HeaderProps = PreactComponentPropsForClipsElement<'ui-header'> &
  ViewProps;

export function Header({children, ...viewProps}: HeaderProps) {
  const view = useViewProps(viewProps);
  return <header {...resolveViewProps(view)}>{children}</header>;
}
