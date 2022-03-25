import type {PropsWithChildren, ReactElement} from 'react';
import {createPortal} from 'react-dom';

import {useUniqueId} from '../../utilities/id';
import {usePortalContainer} from '../../utilities/portals';

interface Props {}

export function Portal({children}: PropsWithChildren<Props>): ReactElement | null {
  const id = useUniqueId('Portal');
  const container = usePortalContainer();
  return container
    ? createPortal(<div id={id}>{children}</div>, container)
    : null;
}
