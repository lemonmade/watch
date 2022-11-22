import {type PropsForClipsComponent} from '../../utilities/clips';
import {useViewProps, resolveViewProps, type ViewProps} from '../View';

export type HeaderProps = PropsForClipsComponent<'Header'> & ViewProps;

export function Header({children, ...viewProps}: HeaderProps) {
  const view = useViewProps(viewProps);
  return <header {...resolveViewProps(view)}>{children}</header>;
}
