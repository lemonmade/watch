import type {RenderableProps, ComponentChild} from 'preact';

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
  heading: ComponentChild;
  detail?: ComponentChild;
  menu?: ComponentChild;
}

export function Page({
  children,
  menu,
  heading,
  detail,
}: RenderableProps<Props>) {
  const headingContent = menu ? (
    <HeadingAction overlay={<Popover inlineAttachment="start">{menu}</Popover>}>
      {heading}
    </HeadingAction>
  ) : (
    <Heading>{heading}</Heading>
  );

  const headerContent = detail ? (
    <BlockStack spacing="small.2" inlineAlignment="start">
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
