import {type RenderableProps} from 'preact';
import {Suspense} from 'preact/compat';
import {useUser} from '~/shared/user.ts';

import {Action, Menu, View, Modal, Icon} from '@lemon/zest';

import {Navigation, NavigationItem} from './components/Navigation.ts';

import styles from './Frame.module.css';

export interface Props {}

const ROOT_NAVIGATION_ITEM_MATCHES = [
  /[/]app[/]?($|finished[/]?$|watch-?through[/]|watching[/])/,
];

export default function Frame({children}: RenderableProps<Props>) {
  return (
    <View display="grid" className={styles.Frame}>
      <View className={styles.GoMenu}>
        <Action emphasis detail={<Icon source="go" />} overlay={<GoModal />}>
          Go
        </Action>
      </View>
      <View className={styles.Navigation}>
        <NavigationMenu />
      </View>
      <View className={styles.Content}>
        <Suspense fallback={null}>{children}</Suspense>
      </View>
    </View>
  );
}

function NavigationMenu() {
  const user = useUser();

  return (
    <Navigation>
      <NavigationItem
        to="/app"
        icon="watching"
        matches={ROOT_NAVIGATION_ITEM_MATCHES}
      >
        Watching
      </NavigationItem>
      <NavigationItem to="/app/watch-later" icon="watchlist">
        Watch later
      </NavigationItem>
      <NavigationItem to="/app/subscriptions" icon="subscription">
        Subscriptions
      </NavigationItem>
      <NavigationItem to="/app/search" icon="search">
        Search
      </NavigationItem>
      <NavigationItem to="/app/apps" icon="app">
        Apps
      </NavigationItem>
      <NavigationItem to="/app/developer" icon="developer">
        Developer
      </NavigationItem>
      <NavigationItem to="/app/me" icon="user">
        Me
      </NavigationItem>
      {user.role === 'ADMIN' && (
        <NavigationItem to="/app/admin" icon="developer">
          Admin
        </NavigationItem>
      )}
    </Navigation>
  );
}

function GoModal() {
  const user = useUser();

  return (
    <Modal>
      <Menu>
        <Action to="/app" icon="watching">
          Watching
        </Action>
        <Action to="/app/watch-later" icon="watchlist">
          Watch later
        </Action>
        <Action to="/app/subscriptions" icon="subscription">
          Subscriptions
        </Action>
        <Action to="/app/search" icon="search">
          Search
        </Action>
        <Action to="/app/apps" icon="app">
          Apps
        </Action>
        <Action to="/app/developer" icon="developer">
          Developer
        </Action>
        <Action to="/app/me" icon="user">
          Me
        </Action>
        {user.role === 'ADMIN' && (
          <Action to="/app/admin" icon="developer">
            Admin
          </Action>
        )}
      </Menu>
    </Modal>
  );
}
