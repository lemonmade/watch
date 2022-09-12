import type {PropsWithChildren, ReactNode} from 'react';

import {
  Icon,
  Text,
  Section,
  BlockStack,
  InlineStack,
  Heading,
  Action,
  Menu,
  Popover,
  PopoverSheet,
} from '@lemon/zest';

import styles from './Page.module.css';

interface Props {
  heading: ReactNode;
  detail?: ReactNode;
  menu?: ReactNode;
}

export function Page({
  children,
  menu,
  heading,
  detail,
}: PropsWithChildren<Props>) {
  const headingContent = menu ? (
    <InlineStack spacing="small">
      <Heading>{heading}</Heading>

      <Popover>
        <Action
          size="small"
          icon={<Icon source="more" />}
          accessibilityLabel="More…"
        />
        <PopoverSheet>
          <Menu>{menu}</Menu>
        </PopoverSheet>
      </Popover>
    </InlineStack>
  ) : (
    <Heading>{heading}</Heading>
  );

  const headerContent = detail ? (
    <BlockStack spacing="tiny">
      {headingContent}
      <Text emphasis="subdued">{detail}</Text>
    </BlockStack>
  ) : (
    headingContent
  );

  return (
    <>
      <Section padding="base" content="header">
        {headerContent}
      </Section>
      <Section padding="base" className={styles.Content}>
        {children}
      </Section>
    </>
  );
}
