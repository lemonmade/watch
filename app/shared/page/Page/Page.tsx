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
  PopoverSheet,
} from '@lemon/zest';

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
  const headingContent = detail ? (
    <BlockStack spacing="small">
      <Heading>{heading}</Heading>
      <Text>{detail}</Text>
    </BlockStack>
  ) : (
    <Heading>{heading}</Heading>
  );

  const headerContent = menu ? (
    <InlineStack spacing>
      {headingContent}

      <Popover>
        <Action>More…</Action>
        <PopoverSheet>
          <Menu>{menu}</Menu>
        </PopoverSheet>
      </Popover>
    </InlineStack>
  ) : (
    headingContent
  );

  return (
    <>
      <Section padding="base" content="header">
        {headerContent}
      </Section>
      <Section padding="base">{children}</Section>
    </>
  );
}
