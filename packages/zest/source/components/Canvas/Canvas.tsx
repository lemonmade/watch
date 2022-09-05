import {useMemo, useState} from 'react';
import type {PropsWithChildren, ContextType} from 'react';

import {UniqueIdContext, UniqueIdFactory} from '../../utilities/id';
import {PortalContainerContext} from '../../utilities/portals';
import {AutoHeadingContext} from '../../utilities/headings';

import './Canvas.module.css';
interface Props {}

export function Canvas({children}: PropsWithChildren<Props>) {
  const {idFactory} = useMemo(() => ({idFactory: new UniqueIdFactory()}), []);

  return (
    <UniqueIdContext.Provider value={idFactory}>
      <AutoHeadingContext.Provider value={1}>
        <PortalContainer>{children}</PortalContainer>
      </AutoHeadingContext.Provider>
    </UniqueIdContext.Provider>
  );
}

// eslint-disable-next-line @typescript-eslint/ban-types
function PortalContainer({children}: PropsWithChildren<{}>) {
  const [portalContainer, setPortalContainer] =
    useState<ContextType<typeof PortalContainerContext>>(null);

  return (
    <PortalContainerContext.Provider value={portalContainer}>
      {children}
      <div ref={setPortalContainer} />
    </PortalContainerContext.Provider>
  );
}
