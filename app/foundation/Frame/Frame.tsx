import {type PropsWithChildren} from 'react';

import {Action, Menu, View, Modal} from '@lemon/zest';

import {Navigation, NavigationItem} from './components/Navigation';

import styles from './Frame.module.css';

interface Props {}

const ROOT_NAVIGATION_ITEM_MATCHES = [
  /[/]app[/]?($|finished[/]?$|watchthrough[/])/,
];

export function Frame({children}: PropsWithChildren<Props>) {
  return (
    <>
      <View display="grid" className={styles.Frame}>
        <View className={styles.Navigation}>
          <View className={styles.NavigationContent}>
            <NavigationMenu />
          </View>
        </View>
        <View className={styles.Content}>{children}</View>
      </View>

      <View className={styles.GoMenu}>
        <Action emphasis secondaryIcon="go" modal={<GoModal />}>
          Go
        </Action>
      </View>
    </>
  );
}

function NavigationMenu() {
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
    </Navigation>
  );
}

function GoModal() {
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
      </Menu>
    </Modal>
  );
}
