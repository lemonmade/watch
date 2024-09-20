import type {RenderableProps} from 'preact';

import {Button, Menu, View, Modal, Icon} from '@lemon/zest';

import {Navigation, NavigationItem} from './components/Navigation.ts';

import styles from './Frame.module.css';
import {useUser} from '~/shared/user.ts';

export interface Props {}

const ROOT_NAVIGATION_ITEM_MATCHES = [
  /[/]app[/]?($|finished[/]?$|watch-?through[/]|watching[/])/,
];

export default function Frame({children}: RenderableProps<Props>) {
  return (
    <View display="grid" className={styles.Frame}>
      <View className={styles.GoMenu}>
        <Button emphasis detail={<Icon source="go" />} overlay={<GoModal />}>
          Go
        </Button>
      </View>
      <View className={styles.Navigation}>
        <NavigationMenu />
      </View>
      <View className={styles.Content}>{children}</View>
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
        <Button to="/app" icon="watching">
          Watching
        </Button>
        <Button to="/app/watch-later" icon="watchlist">
          Watch later
        </Button>
        <Button to="/app/subscriptions" icon="subscription">
          Subscriptions
        </Button>
        <Button to="/app/search" icon="search">
          Search
        </Button>
        <Button to="/app/apps" icon="app">
          Apps
        </Button>
        <Button to="/app/developer" icon="developer">
          Developer
        </Button>
        <Button to="/app/me" icon="user">
          Me
        </Button>
        {user.role === 'ADMIN' && (
          <Button to="/app/admin" icon="developer">
            Admin
          </Button>
        )}
      </Menu>
    </Modal>
  );
}
