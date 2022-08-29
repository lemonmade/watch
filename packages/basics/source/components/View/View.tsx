import {PropsWithChildren} from 'react';

import {useDomProps, toProps} from '../../system';
import type {SystemProps} from '../../system';

interface Props extends SystemProps {}

export function View({children, ...systemProps}: PropsWithChildren<Props>) {
  const dom = useDomProps(systemProps);
  return <div {...toProps(dom)}>{children}</div>;
}
