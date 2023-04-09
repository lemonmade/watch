import {PropsWithChildren} from 'react';

import {useViewProps, resolveViewProps, type ViewProps} from './props.ts';

export {useViewProps, resolveViewProps, type ViewProps};

export function View({children, ...systemProps}: PropsWithChildren<ViewProps>) {
  const dom = useViewProps(systemProps);
  return <div {...resolveViewProps(dom)}>{children}</div>;
}
