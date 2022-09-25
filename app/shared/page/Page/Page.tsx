import type {PropsWithChildren, ReactNode} from 'react';

import {
  Text,
  Section,
  BlockStack,
  InlineStack,
  Heading,
  Action,
  Menu,
  Popover,
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

      <Action
        size="small"
        icon="more"
        accessibilityLabel="More…"
        popover={
          <Popover>
            <Menu>{menu}</Menu>
          </Popover>
        }
      />
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
      <Section content="header" className={styles.Header}>
        {headerContent}
      </Section>
      <Section className={styles.Content}>{children}</Section>
    </>
  );
}
