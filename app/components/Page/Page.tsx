import {useContext} from 'react';
import type {PropsWithChildren, ReactNode} from 'react';

import {
  Link,
  Menu,
  Pressable,
  Layout,
  View,
  Popover,
  PopoverSheet,
} from '@lemon/zest';

interface Props {
  header: ReactNode;
  actions?: ReactNode;
}

export function Page({children, actions, header}: PropsWithChildren<Props>) {
  return (
    <View padding={16}>
      <Layout sizes={['fill', 'auto']}>
        {actions ? (
          <Popover>
            <Pressable alignContent="start" blockSize="fill">
              {header}
            </Pressable>
            <PopoverSheet>{actions}</PopoverSheet>
          </Popover>
        ) : (
          <View>{header}</View>
        )}
        <Popover>
          <Pressable>Mega menu</Pressable>
          <PopoverSheet>
            <Menu>
              <Link to="/">Watching</Link>
              <Link to="/subscriptions">Subscriptions</Link>
              <Link to="/search">Search</Link>
              <Link to="/settings">Settings</Link>
            </Menu>
          </PopoverSheet>
        </Popover>
      </Layout>
      <View>{children}</View>
    </View>
  );
}
