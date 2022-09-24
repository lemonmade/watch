import type {PropsWithChildren, ReactElement} from 'react';
import {createPortal} from 'react-dom';

import {useUniqueId} from '../../utilities/id';
import {useCanvas} from '../../utilities/canvas';
import {StackedLayer} from '../../utilities/layers';

interface Props {
  layer?: boolean;
}

export function Portal({
  layer = true,
  children,
}: PropsWithChildren<Props>): ReactElement | null {
  const id = useUniqueId('Portal');
  const {portal} = useCanvas();
  const container = portal.container.value;

  const content = container
    ? createPortal(<div id={id}>{children}</div>, container)
    : null;

  return layer && content ? <StackedLayer>{content}</StackedLayer> : content;
}
