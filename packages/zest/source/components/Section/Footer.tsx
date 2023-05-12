import {type ReactComponentPropsForClipsElement} from '../../shared/clips.ts';
import {useViewProps, resolveViewProps, type ViewProps} from '../View.tsx';

export type FooterProps = ReactComponentPropsForClipsElement<'ui-footer'> &
  ViewProps;

export function Footer({children, ...viewProps}: FooterProps) {
  const view = useViewProps(viewProps);
  return <footer {...resolveViewProps(view)}>{children}</footer>;
}
