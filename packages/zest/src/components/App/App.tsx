import {useMemo} from 'react';
import type {PropsWithChildren} from 'react';
import {UniqueIdContext, UniqueIdFactory} from '../../utilities/id';

import './App.css';

interface Props {}

export function App({children}: PropsWithChildren<Props>) {
  const {idFactory} = useMemo(() => ({idFactory: new UniqueIdFactory()}), []);

  return (
    <UniqueIdContext.Provider value={idFactory}>
      {children}
    </UniqueIdContext.Provider>
  );
}
