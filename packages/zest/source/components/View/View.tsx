import type {RenderableProps} from 'preact';

import {useViewProps, resolveViewProps, type ViewProps} from './props.ts';

export {useViewProps, resolveViewProps, type ViewProps};

export function View({children, ...systemProps}: RenderableProps<ViewProps>) {
  const dom = useViewProps(systemProps);
  return <div {...resolveViewProps(dom)}>{children}</div>;
}
