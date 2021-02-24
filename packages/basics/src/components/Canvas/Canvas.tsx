import {useMemo} from 'react';
import type {PropsWithChildren} from 'react';
// eslint-disable-next-line import/no-extraneous-dependencies
import {AutoHeadingGroup} from '@quilted/react-auto-headings';
import {UniqueIdContext, UniqueIdFactory} from '../../utilities/id';

import './Canvas.css';

interface Props {}

export function Canvas({children}: PropsWithChildren<Props>) {
  const {idFactory} = useMemo(() => ({idFactory: new UniqueIdFactory()}), []);

  return (
    <UniqueIdContext.Provider value={idFactory}>
      <AutoHeadingGroup>{children}</AutoHeadingGroup>
    </UniqueIdContext.Provider>
  );
}
