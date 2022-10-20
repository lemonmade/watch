import {type PropsWithChildren} from 'react';
import {useViewProps, resolveViewProps, type ViewProps} from '../View';

interface FooterProps extends ViewProps {}

export function Footer({
  children,
  ...viewProps
}: PropsWithChildren<FooterProps>) {
  const view = useViewProps(viewProps);
  return <footer {...resolveViewProps(view)}>{children}</footer>;
}
