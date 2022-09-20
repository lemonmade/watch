import type {PropsWithChildren, ReactElement} from 'react';
import {createPortal} from 'react-dom';

import {useUniqueId} from '../../utilities/id';
import {useCanvas} from '../../utilities/canvas';

interface Props {}

export function Portal({
  children,
}: PropsWithChildren<Props>): ReactElement | null {
  const id = useUniqueId('Portal');
  const {portal} = useCanvas();
  const container = portal.container.value;

  return container
    ? createPortal(<div id={id}>{children}</div>, container)
    : null;
}
