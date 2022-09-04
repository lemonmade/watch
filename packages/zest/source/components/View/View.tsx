import {PropsWithChildren} from 'react';

import {useViewProps, resolveViewProps, type Props} from './props';

export function View({children, ...systemProps}: PropsWithChildren<Props>) {
  const dom = useViewProps(systemProps);
  return <div {...resolveViewProps(dom)}>{children}</div>;
}
