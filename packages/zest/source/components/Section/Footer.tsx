import type {RenderableProps} from 'preact';
import {useViewProps, resolveViewProps, type ViewProps} from '../View/View.tsx';

export interface FooterProps extends ViewProps {}

export function Footer({children, ...viewProps}: RenderableProps<FooterProps>) {
  const view = useViewProps(viewProps);
  return <footer {...resolveViewProps(view)}>{children}</footer>;
}
