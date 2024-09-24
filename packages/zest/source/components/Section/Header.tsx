import type {RenderableProps} from 'preact';
import {useViewProps, resolveViewProps, type ViewProps} from '../View/View.tsx';

export interface HeaderProps extends ViewProps {}

export function Header({children, ...viewProps}: RenderableProps<HeaderProps>) {
  const view = useViewProps(viewProps);
  return <header {...resolveViewProps(view)}>{children}</header>;
}
