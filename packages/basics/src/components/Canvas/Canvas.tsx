import {useMemo, useState} from 'react';
import type {PropsWithChildren, ContextType} from 'react';
// eslint-disable-next-line import/no-extraneous-dependencies
import {AutoHeadingGroup} from '@quilted/react-auto-headings';

import {UniqueIdContext, UniqueIdFactory} from '../../utilities/id';
import {PortalContainerContext} from '../../utilities/portals';

import './Canvas.css';

interface Props {}

export function Canvas({children}: PropsWithChildren<Props>) {
  const {idFactory} = useMemo(() => ({idFactory: new UniqueIdFactory()}), []);

  return (
    <UniqueIdContext.Provider value={idFactory}>
      <PortalContainer>
        <AutoHeadingGroup>{children}</AutoHeadingGroup>
      </PortalContainer>
    </UniqueIdContext.Provider>
  );
}

// eslint-disable-next-line @typescript-eslint/ban-types
function PortalContainer({children}: PropsWithChildren<{}>) {
  const [portalContainer, setPortalContainer] = useState<
    ContextType<typeof PortalContainerContext>
  >(null);

  return (
    <PortalContainerContext.Provider value={portalContainer}>
      {children}
      <div ref={setPortalContainer} />
    </PortalContainerContext.Provider>
  );
}
