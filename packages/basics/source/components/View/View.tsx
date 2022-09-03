import {PropsWithChildren} from 'react';

import {useDomProps, toProps} from '../../system';
import type {SystemProps} from '../../system';

interface Props extends SystemProps {
  className?: string;
}

export function View({
  children,
  className,
  ...systemProps
}: PropsWithChildren<Props>) {
  const dom = useDomProps(systemProps);
  if (className) dom.addClassName(className);
  return <div {...toProps(dom)}>{children}</div>;
}
