import {type PropsWithChildren} from 'react';
import {useViewProps, resolveViewProps, type ViewProps} from '../View';

interface HeaderProps extends ViewProps {}

export function Header({
  children,
  ...viewProps
}: PropsWithChildren<HeaderProps>) {
  const view = useViewProps(viewProps);
  return <header {...resolveViewProps(view)}>{children}</header>;
}
