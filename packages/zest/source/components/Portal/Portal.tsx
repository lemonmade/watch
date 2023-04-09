import type {PropsWithChildren, ReactElement} from 'react';
import {createPortal} from 'react-dom';

import {useUniqueId} from '../../shared/id.ts';
import {useCanvas} from '../../shared/canvas.tsx';
import {StackedLayer} from '../../shared/layers.tsx';

export interface PortalProps {
  layer?: boolean;
}

export function Portal({
  layer = true,
  children,
}: PropsWithChildren<PortalProps>): ReactElement | null {
  const id = useUniqueId('Portal');
  const {portal} = useCanvas();
  const container = portal.container.value;

  const content = container
    ? createPortal(<div id={id}>{children}</div>, container)
    : null;

  return layer && content ? <StackedLayer>{content}</StackedLayer> : content;
}
