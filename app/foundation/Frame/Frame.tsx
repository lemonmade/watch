import {useMemo, useState} from 'react';
import type {PropsWithChildren, ReactNode} from 'react';

import {
  Canvas,
  Link,
  Menu,
  Layout,
  View,
  Popover,
  PopoverSheet,
  Pressable,
  Heading,
} from '@lemon/zest';

import {PageDelegateContext} from 'utilities/page';
import type {PageDelegate} from 'utilities/page';

interface Props {}

let frameHeadingClaimedCount = 0;

export function Frame({children}: PropsWithChildren<Props>) {
  const [{heading, actions}, setPageContext] = useState<{
    heading?: ReactNode;
    actions?: ReactNode;
    id: number;
  }>({
    id: 0,
  });

  const pageDelegate = useMemo<PageDelegate>(() => {
    return {
      claim({heading, actions}) {
        frameHeadingClaimedCount += 1;
        const id = frameHeadingClaimedCount;

        setPageContext({heading, actions, id});

        return () => {
          setPageContext((currentContext) =>
            currentContext.id === id ? {id} : currentContext,
          );
        };
      },
    };
  }, []);

  return (
    <PageDelegateContext delegate={pageDelegate}>
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
            <Header actions={actions}>{heading}</Header>
            <View>{children}</View>
          </View>
        </Layout>
      </Canvas>
    </PageDelegateContext>
  );
}

function Header({actions, children}: PropsWithChildren<{actions?: ReactNode}>) {
  const normalizedHeading =
    typeof children === 'string' ? <Heading>{children}</Heading> : children;

  return (
    <Layout sizes={['fill', 'auto']}>
      {actions ? (
        <Popover>
          <Pressable alignContent="start" blockSize="fill">
            {normalizedHeading}
          </Pressable>
          <PopoverSheet>{actions}</PopoverSheet>
        </Popover>
      ) : (
        <View>{normalizedHeading}</View>
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
  );
}
