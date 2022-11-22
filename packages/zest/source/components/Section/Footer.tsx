import {type PropsForClipsComponent} from '../../utilities/clips';
import {useViewProps, resolveViewProps, type ViewProps} from '../View';

export type FooterProps = PropsForClipsComponent<'Footer'> & ViewProps;

export function Footer({children, ...viewProps}: FooterProps) {
  const view = useViewProps(viewProps);
  return <footer {...resolveViewProps(view)}>{children}</footer>;
}
