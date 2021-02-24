import type {PropsWithChildren} from 'react';

import {
  Canvas,
  Link,
  Menu,
  Pressable,
  Layout,
  View,
  Popover,
  PopoverSheet,
} from '@lemon/zest';

interface Props {}

export function Frame({children}: PropsWithChildren<Props>) {
  return (
    <Canvas>
      <Layout
        sizes={[
          {value: [false, 'fill']},
          {value: ['auto', 'fill'], viewport: {min: 'medium'}},
        ]}
      >
        <Menu>
          <Link to="/">Watching</Link>
          <Link to="/subscriptions">Subscriptions</Link>
          <Link to="/search">Search</Link>
          <Link to="/settings">Settings</Link>
        </Menu>
        <View>
          <View>
            <Popover>
              <Pressable>Super menu</Pressable>
              <PopoverSheet>
                <Menu>
                  <Link to="/">Watching</Link>
                  <Link to="/subscriptions">Subscriptions</Link>
                  <Link to="/search">Search</Link>
                  <Link to="/settings">Settings</Link>
                </Menu>
              </PopoverSheet>
            </Popover>
          </View>
          <View>{children}</View>
        </View>
      </Layout>
    </Canvas>
  );
}
