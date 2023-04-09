import {type PropsForClipsComponent} from '../../shared/clips.ts';
import {useViewProps, resolveViewProps, type ViewProps} from '../View.tsx';

export type HeaderProps = PropsForClipsComponent<'Header'> & ViewProps;

export function Header({children, ...viewProps}: HeaderProps) {
  const view = useViewProps(viewProps);
  return <header {...resolveViewProps(view)}>{children}</header>;
}
