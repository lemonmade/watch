import {type PropsWithChildren} from 'react';

import {
  Action,
  Menu,
  Layout,
  View,
  Sticky,
  Popover,
  PopoverSheet,
} from '@lemon/zest';

import styles from './Frame.module.css';

interface Props {}

export function Frame({children}: PropsWithChildren<Props>) {
  return (
    <>
      <Layout
        columns={[
          {value: [false, 'fill']},
          {value: ['auto', 'fill'], viewport: {min: 'medium'}},
        ]}
      >
        <View>
          <Sticky>
            <Menu>
              <Action to="/app">Watching</Action>
              <Action to="/app/watch-later">Watch later</Action>
              <Action to="/app/subscriptions">Subscriptions</Action>
              <Action to="/app/search">Search</Action>
              <Action to="/app/apps">Apps</Action>
              <Action to="/app/developer">Developer</Action>
              <Action to="/app/me">Me</Action>
            </Menu>
          </Sticky>
        </View>
        <View>
          <View>{children}</View>
        </View>
      </Layout>
      <View className={styles.GoMenu}>
        <Popover>
          <Action primary>Go!</Action>
          <PopoverSheet blockAttachment="start" inlineAttachment="end">
            <Menu>
              <Action to="/app">Watching</Action>
              <Action to="/app/watch-later">Watch later</Action>
              <Action to="/app/subscriptions">Subscriptions</Action>
              <Action to="/app/search">Search</Action>
              <Action to="/app/apps">Apps</Action>
              <Action to="/app/developer">Developer</Action>
              <Action to="/app/me">Me</Action>
            </Menu>
          </PopoverSheet>
        </Popover>
      </View>
    </>
  );
}
