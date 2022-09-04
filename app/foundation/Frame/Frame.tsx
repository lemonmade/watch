import {useMemo, useState} from 'react';
import type {PropsWithChildren, ReactNode} from 'react';

import {
  Action,
  Menu,
  Layout,
  View,
  Popover,
  PopoverSheet,
  Pressable,
  Heading,
  Sticky,
} from '@lemon/zest';

import {PageDelegateContext} from '~/shared/page';
import type {PageDelegate} from '~/shared/page';

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
              <Pressable alignContent="start">{normalizedHeading}</Pressable>
              <PopoverSheet>{actions}</PopoverSheet>
            </Popover>
          ) : (
            <View>{normalizedHeading}</View>
          )}
          <Popover>
            <Pressable>Mega menu</Pressable>
            <PopoverSheet>
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
        </Layout>
      </View>
    </Sticky>
  );
}
