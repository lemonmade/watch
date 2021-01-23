import type {PropsWithChildren} from 'react';

import {AutoHeadingGroup} from '@quilted/quilt';
import {
  Frame as FrameUi,
  NavigationList,
  NavigationListItem,
} from '@lemon/zest';

// eslint-disable-next-line @typescript-eslint/ban-types
export function Frame({children}: PropsWithChildren<{}>) {
  return (
    <AutoHeadingGroup>
      <FrameUi
        renderNavigation={() => (
          <NavigationList>
            <NavigationListItem to="/">Watching</NavigationListItem>
            <NavigationListItem to="/subscriptions">
              Subscriptions
            </NavigationListItem>
            <NavigationListItem to="/search">Search</NavigationListItem>
            <NavigationListItem to="/settings">Settings</NavigationListItem>
          </NavigationList>
        )}
      >
        {children}
      </FrameUi>
    </AutoHeadingGroup>
  );
}
