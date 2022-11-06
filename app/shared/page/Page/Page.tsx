import type {PropsWithChildren, ReactNode} from 'react';

import {
  Text,
  Section,
  Header,
  BlockStack,
  Heading,
  HeadingAction,
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
    <HeadingAction overlay={<Popover inlineAttachment="start">{menu}</Popover>}>
      {heading}
    </HeadingAction>
  ) : (
    <Heading>{heading}</Heading>
  );

  const headerContent = detail ? (
    <BlockStack spacing="tiny" inlineAlignment="start">
      {headingContent}
      <Text emphasis="subdued">{detail}</Text>
    </BlockStack>
  ) : (
    headingContent
  );

  return (
    <>
      <Header className={styles.Header}>{headerContent}</Header>
      <Section className={styles.Content}>{children}</Section>
    </>
  );
}
