import {type PropsWithChildren} from 'react';

import {
  Text,
  Icon,
  Action,
  Menu,
  View,
  Popover,
  PopoverSheet,
  InlineStack,
} from '@lemon/zest';

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
            <Navigation>
              <NavigationItem
                to="/app"
                icon={<Icon source="watching" />}
                matches={ROOT_NAVIGATION_ITEM_MATCHES}
              >
                Watching
              </NavigationItem>
              <NavigationItem
                to="/app/watch-later"
                icon={<Icon source="watchlist" />}
              >
                Watch later
              </NavigationItem>
              <NavigationItem
                to="/app/subscriptions"
                icon={<Icon source="subscription" />}
              >
                Subscriptions
              </NavigationItem>
              <NavigationItem to="/app/search" icon={<Icon source="search" />}>
                Search
              </NavigationItem>
              <NavigationItem to="/app/apps" icon={<Icon source="app" />}>
                Apps
              </NavigationItem>
              <NavigationItem
                to="/app/developer"
                icon={<Icon source="developer" />}
              >
                Developer
              </NavigationItem>
              <NavigationItem to="/app/me" icon={<Icon source="user" />}>
                Me
              </NavigationItem>
            </Navigation>
          </View>
        </View>
        <View className={styles.Content}>{children}</View>
      </View>
      <View className={styles.GoMenu}>
        <Popover>
          <Action emphasis>
            <InlineStack spacing="small">
              <Text>Go</Text>
              <Icon source="go" />
            </InlineStack>
          </Action>
          <PopoverSheet blockAttachment="start" inlineAttachment="end">
            <Menu>
              <Action to="/app" icon={<Icon source="watching" />}>
                Watching
              </Action>
              <Action to="/app/watch-later" icon={<Icon source="watchlist" />}>
                Watch later
              </Action>
              <Action
                to="/app/subscriptions"
                icon={<Icon source="subscription" />}
              >
                Subscriptions
              </Action>
              <Action to="/app/search" icon={<Icon source="search" />}>
                Search
              </Action>
              <Action to="/app/apps" icon={<Icon source="app" />}>
                Apps
              </Action>
              <Action to="/app/developer" icon={<Icon source="developer" />}>
                Developer
              </Action>
              <Action to="/app/me" icon={<Icon source="user" />}>
                Me
              </Action>
            </Menu>
          </PopoverSheet>
        </Popover>
      </View>
    </>
  );
}
