import {createRemoteComponent} from '@lemonmade/remote-ui-react';
import {Grid as GridName, GridElement} from '@watching/clips';

export const Grid = createRemoteComponent(GridElement, {
  element: GridName,
});
