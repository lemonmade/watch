import {useMemo, useState} from 'react';
import type {PropsWithChildren, ReactNode} from 'react';

import {
  Link,
  Menu,
  Layout,
  View,
  Popover,
  PopoverSheet,
  Pressable,
  Heading,
  Sticky,
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
      <Layout
        sizes={[
          {value: [false, 'fill']},
          {value: ['auto', 'fill'], viewport: {min: 'medium'}},
        ]}
      >
        <View>
          <Sticky>
            <Menu>
              <Link to="/app">Watching</Link>
              <Link to="/app/subscriptions">Subscriptions</Link>
              <Link to="/app/search">Search</Link>
              <Link to="/app/apps">Apps</Link>
              <Link to="/app/settings">Settings</Link>
              <Link to="/app/developer">Developer</Link>
              <Link to="/app/me">Me</Link>
            </Menu>
          </Sticky>
        </View>
        <View>
          <Header actions={actions}>{heading}</Header>
          <View>{children}</View>
        </View>
      </Layout>
    </PageDelegateContext>
  );
}

function Header({actions, children}: PropsWithChildren<{actions?: ReactNode}>) {
  const normalizedHeading =
    typeof children === 'string' ? <Heading>{children}</Heading> : children;

  return (
    <Sticky>
      <View padding={16} background="black">
        <Layout sizes={['fill', 'auto']}>
          {actions ? (
            <Popover>
              <Pressable align="start">{normalizedHeading}</Pressable>
              <PopoverSheet>{actions}</PopoverSheet>
            </Popover>
          ) : (
            <View>{normalizedHeading}</View>
          )}
          <Popover>
            <Pressable>Mega menu</Pressable>
            <PopoverSheet>
              <Menu>
                <Link to="/app">Watching</Link>
                <Link to="/app/subscriptions">Subscriptions</Link>
                <Link to="/app/search">Search</Link>
                <Link to="/app/apps">Apps</Link>
                <Link to="/app/settings">Settings</Link>
                <Link to="/app/developer">Developer</Link>
                <Link to="/app/me">Me</Link>
              </Menu>
            </PopoverSheet>
          </Popover>
        </Layout>
      </View>
    </Sticky>
  );
}
