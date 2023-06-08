import {type ComponentProps} from 'react';
import {usePerformanceNavigation, useSignal} from '@quilted/quilt';
import {
  Style,
  Action,
  ActionList,
  Checkbox,
  BlockStack,
  TextField,
  Heading,
  HeadingAction,
  Section,
  Footer,
  Header,
  Banner,
  ChoiceList,
  Choice,
  Pressable,
  Text,
  TextAction,
  TextLink,
  TextBlock,
  DatePicker,
  Divider,
  InlineStack,
  View,
  Image,
  Rating,
  Menu,
  List,
  ListItem,
  Popover,
  Label,
  Select,
  Grid,
  Spacer,
  Modal,
  Icon,
  Tag,
  Poster,
  IconHighlight,
  ContentAction,
  Stack,
  InlineGrid,
  BlockGrid,
  SkeletonTextBlock,
  SkeletonText,
} from '@lemon/zest';

export default function ComponentLibrary() {
  usePerformanceNavigation({state: 'complete'});

  return (
    <BlockStack spacing padding>
      <ActionComponents />
      <Divider />
      <PopoverComponents />
      <Divider />
      <LayoutComponents />
      <Divider />
      <FormComponents />
      <Divider />
      <TextComponents />
      <Divider />
      <SkeletonComponents />
      <Divider />
      <DisplayComponents />
    </BlockStack>
  );
}

function ActionComponents() {
  return (
    <Section>
      <BlockStack spacing>
        <Heading>Actions</Heading>

        <Stack direction="inline" spacing="small">
          <Action>Action (button)</Action>
          <Action to="#">Action (link)</Action>
          <Action disabled>Action (disabled)</Action>

          <Action emphasis>Action (emphasized)</Action>
          <Action emphasis disabled icon="arrow.end">
            Action (emphasized disabled)
          </Action>

          <Action emphasis="subdued">Action (subdued)</Action>
          <Action emphasis="subdued" disabled icon="arrow.end">
            Action (subdued disabled)
          </Action>

          <Action role="destructive" icon="delete">
            Action (destructive)
          </Action>
          <Action role="destructive" disabled icon="delete">
            Action (destructive disabled)
          </Action>

          <Action overlay={<ActionExampleModal />}>Action (modal)</Action>
          <Action size="small">Action (small)</Action>
          <Action detail={<Icon source="arrow.end" />}>Action (detail)</Action>
          <Pressable>Pressable</Pressable>
          <Pressable to="#">Pressable (link)</Pressable>
        </Stack>

        <Action>Action that fills</Action>
        <Action icon="delete">Action that fills</Action>
        <Action icon="delete" inlineAlignment="start">
          Action that fills that is really really really really really really
          really really really really long
        </Action>

        <LoadingActionExample />

        <Divider emphasis="subdued" />

        <InlineStack spacing="small">
          <Action accessory={<ActionAccessoryExampleMenu />}>Accessory</Action>
          <Action emphasis accessory={<ActionAccessoryExampleMenu />}>
            Accessory (emphasized)
          </Action>
          <Action emphasis="subdued" accessory={<ActionAccessoryExampleMenu />}>
            Accessory (subdued)
          </Action>
          <Action role="destructive" accessory={<ActionAccessoryExampleMenu />}>
            Accessory (destructive)
          </Action>
          <Action disabled accessory={<ActionAccessoryExampleMenu />}>
            Accessory (disabled)
          </Action>
          <Action accessory={<ActionAccessoryExampleMenu disabled />}>
            Accessory (accessory disabled)
          </Action>
          <Action emphasis disabled accessory={<ActionAccessoryExampleMenu />}>
            Accessory (emphasized disabled)
          </Action>
        </InlineStack>

        <Divider emphasis="subdued" />

        <BlockStack spacing inlineAlignment="start">
          <TextAction
            overlay={<ActionExamplePopoverMenu inlineAttachment="start" />}
          >
            My action
          </TextAction>
          <TextAction
            emphasis
            overlay={<ActionExamplePopoverMenu inlineAttachment="start" />}
          >
            My action (emphasized)
          </TextAction>
          <TextAction
            overlay={<ActionExamplePopoverMenu inlineAttachment="start" />}
          >
            My long action that might have quite a long title
          </TextAction>
          <HeadingAction
            overlay={<ActionExamplePopoverMenu inlineAttachment="start" />}
          >
            My heading action
          </HeadingAction>
          <HeadingAction
            overlay={<ActionExamplePopoverMenu inlineAttachment="start" />}
          >
            My heading action that is quite long and will likely wrap
          </HeadingAction>
          <HeadingAction
            level={3}
            overlay={<ActionExamplePopoverMenu inlineAttachment="start" />}
          >
            My heading action (level 3)
          </HeadingAction>
          <HeadingAction
            level={6}
            overlay={<ActionExamplePopoverMenu inlineAttachment="start" />}
          >
            My heading action (level 6)
          </HeadingAction>
          <HeadingAction
            level={6}
            overlay={<ActionExamplePopoverMenu inlineAttachment="start" />}
          >
            My heading action (level 6 that is quite long and will likely wrap)
          </HeadingAction>

          <ContentAction
            overlay={<ActionExamplePopoverMenu inlineAttachment="start" />}
          >
            <InlineGrid sizes={['auto', 'fill']} spacing="small">
              <IconHighlight>
                <Icon source="watch" />
              </IconHighlight>

              <BlockStack>
                <Text emphasis>Season 10</Text>
                <Text emphasis="subdued">20 episodes</Text>
              </BlockStack>
            </InlineGrid>
          </ContentAction>

          <ContentAction
            overlay={<ActionExamplePopoverMenu inlineAttachment="start" />}
          >
            <InlineGrid sizes={['auto', 'fill']} spacing="small">
              <IconHighlight>
                <Icon source="watch" />
              </IconHighlight>

              <BlockStack>
                <Text emphasis>Season 10</Text>
                <Text emphasis="subdued">
                  An extremely long content action that might wrap
                </Text>
              </BlockStack>
            </InlineGrid>
          </ContentAction>
        </BlockStack>

        <Divider emphasis="subdued" />

        <Menu>
          <Action>Menu button</Action>
          <Action to="#">Menu link</Action>
          <Action emphasis="subdued">Menu button (subdued)</Action>
          <Action loading icon="arrow.end">
            Menu button (loading)
          </Action>
          <Action emphasis>Menu button (emphasized)</Action>
          <Action icon="delete" role="destructive">
            Menu button (destructive)
          </Action>
        </Menu>

        <Menu label="Important actions…">
          <Action icon="delete">Delete</Action>
        </Menu>

        <ActionList>
          <Action icon="watch">Item one</Action>
          <Action icon="skip">Item two</Action>
          <Action icon="stop">Item three</Action>
          <Action icon="go" loading>
            Item four (loading)
          </Action>
          <Action icon="delete" role="destructive">
            Item (destructive)
          </Action>
        </ActionList>
      </BlockStack>
    </Section>
  );
}

function LoadingActionExample() {
  const loading = useSignal(false);

  return (
    <BlockStack spacing>
      <Checkbox checked={loading}>Loading buttons</Checkbox>

      <InlineStack spacing>
        <Action loading={loading}>Action (loading)</Action>
        <Action
          icon="close"
          accessory={<ActionAccessoryExampleMenu />}
          loading={loading}
        >
          Action (accessory loading)
        </Action>
        <Action emphasis="subdued" loading={loading} icon="arrow.end">
          Action (subdued loading)
        </Action>
        <Action emphasis loading={loading} icon="arrow.end">
          Action (emphasized loading)
        </Action>
        <Action role="destructive" loading={loading} icon="delete">
          Action (destructive loading)
        </Action>
      </InlineStack>
    </BlockStack>
  );
}

function ActionExamplePopoverMenu(props: ComponentProps<typeof Popover>) {
  return (
    <Popover {...props}>
      <Menu>
        <Action icon="watchlist">Menu button</Action>
        <Action icon="arrow.end" to="#">
          Menu link
        </Action>
        <Action icon="delete" role="destructive">
          Menu destructive
        </Action>
      </Menu>
    </Popover>
  );
}

function ActionAccessoryExampleMenu({disabled = false} = {}) {
  return (
    <Action
      disabled={disabled}
      accessibilityLabel="More actions"
      icon="more"
      overlay={<ActionExamplePopoverMenu inlineAttachment="end" />}
    />
  );
}

function ActionExampleModal() {
  return (
    <Modal padding>
      <BlockStack spacing>
        <Heading>Modal content</Heading>
        <TextBlock>
          Lorem ipsum dolor sit amet consectetur, adipisicing elit. Nisi
          blanditiis laborum dolor velit mollitia, distinctio fugit possimus
          illum, nulla enim ab! Ipsa reiciendis, earum accusantium quibusdam
          nemo porro aspernatur itaque.
        </TextBlock>
        <InlineStack alignment="end" spacing="small">
          <Action
            accessory={
              <Action
                icon="more"
                accessibilityLabel="More actions"
                overlay={
                  <Popover>
                    <Menu>
                      <Action>Nice!</Action>
                    </Menu>
                  </Popover>
                }
              />
            }
          >
            Dismiss
          </Action>
          <Action emphasis>Save</Action>
        </InlineStack>
      </BlockStack>
    </Modal>
  );
}

function PopoverComponents() {
  return (
    <Section>
      <BlockStack spacing>
        <Heading>Popovers</Heading>
        <Section>
          <BlockStack spacing>
            <Heading>inlineAttachment=center</Heading>

            <InlineStack spacing alignment="spaceBetween">
              <Spacer size="none" />
              <PopoverExample inlineAttachment="center" />
              <PopoverExample inlineAttachment="center" />
              <PopoverExample inlineAttachment="center" />
              <PopoverExample inlineAttachment="center" />
            </InlineStack>

            <Heading>inlineAttachment=start</Heading>

            <InlineStack spacing alignment="spaceBetween">
              <PopoverExample inlineAttachment="start" />
              <PopoverExample inlineAttachment="start" />
              <PopoverExample inlineAttachment="start" />
              <PopoverExample inlineAttachment="start" />
              <Spacer size="none" />
            </InlineStack>

            <Heading>inlineAttachment=end</Heading>

            <InlineStack spacing alignment="spaceBetween">
              <PopoverExample inlineAttachment="end" />
              <PopoverExample inlineAttachment="end" />
              <PopoverExample inlineAttachment="end" />
              <PopoverExample inlineAttachment="end" />
            </InlineStack>
          </BlockStack>
        </Section>
      </BlockStack>
    </Section>
  );
}

function PopoverExample({
  inlineAttachment,
  blockAttachment,
}: ComponentProps<typeof Popover>) {
  return (
    <Action
      overlay={
        <Popover
          inlineAttachment={inlineAttachment}
          blockAttachment={blockAttachment}
        >
          <Menu>
            <Action>Nice!</Action>
          </Menu>
        </Popover>
      }
    >
      Popover
    </Action>
  );
}

function DisplayComponents() {
  return (
    <Section>
      <BlockStack spacing>
        <Heading>Display</Heading>
        <Banner>Hello world</Banner>
        <Banner tone="critical">Hello world</Banner>
        <Banner tone="positive">Hello world</Banner>
        <Banner padding={false}>
          <Header padding>
            <Heading>Banner heading</Heading>
          </Header>

          <Divider />

          <Section padding>
            <BlockStack spacing>
              <Heading>Banner section</Heading>
              <TextBlock>Banner section content</TextBlock>
            </BlockStack>
          </Section>

          <Divider padding />

          <Section padding>
            <BlockStack spacing>
              <Heading>Banner section</Heading>
              <TextBlock>Banner section content</TextBlock>
            </BlockStack>
          </Section>

          <Divider />

          <Footer padding>
            <InlineStack spacing="small">
              <Action>Banner button</Action>
              <Action>Banner button</Action>
            </InlineStack>
          </Footer>
        </Banner>

        <Grid spacing inlineSizes={['fill', 'fill']}>
          <Poster source="https://image.tmdb.org/t/p/original/oXJ1fGDAIE7NVLlrjktKWzfvlrg.jpg" />
          <Poster />
          <Poster label="RuPaul’s Drag Race" />
        </Grid>

        <Image aspectRatio={1} source="https://placekitten.com/200/200" />
      </BlockStack>
    </Section>
  );
}

function FormComponents() {
  return (
    <Section>
      <BlockStack spacing>
        <Heading>Forms</Heading>

        <TextField label="Text field" />
        <TextField
          label="Text field (multiline)"
          minimumLines={3}
          maximumLines={6}
        />
        <TextField
          label="Text field (multiline, unbounded)"
          minimumLines={5}
          maximumLines={false}
        />
        <TextFieldExample label="Controlled text field" />
        <TextFieldExample
          label="Controlled text field (change on input)"
          changeTiming="input"
        />

        <Select
          label="Select"
          options={[
            {value: 'option-one', label: 'Option One'},
            {value: 'option-two', label: 'Option Two'},
          ]}
        ></Select>

        <CheckboxExample>A basic checkbox</CheckboxExample>
        <CheckboxExample disabled>A disabled checkbox</CheckboxExample>
        <CheckboxExample readonly>A readonly checkbox</CheckboxExample>

        <ChoiceList onChange={noop}>
          <Choice value="hello">Hello</Choice>
          <Choice value="world">World</Choice>
          <Choice
            value="helpText"
            helpText="Here’s a helpful hint about this option!"
          >
            With help text
          </Choice>
          <Choice value="disabled" disabled>
            Disabled
          </Choice>
          <Choice value="readonly" readonly>
            Readonly
          </Choice>
        </ChoiceList>

        <InlineStack spacing>
          <Rating readonly />
          <Rating />
          <Rating size="large" />
          <DatePickerExample />
        </InlineStack>
      </BlockStack>
    </Section>
  );
}

function TextFieldExample(
  props: Omit<ComponentProps<typeof TextField>, 'value'>,
) {
  const value = useSignal('');
  return (
    <BlockStack spacing>
      <TextField {...(props as any)} value={value} />
      <TextBlock>Value: {value.value}</TextBlock>
    </BlockStack>
  );
}

function CheckboxExample(
  props: Omit<ComponentProps<typeof Checkbox>, 'checked'>,
) {
  const checked = useSignal(false);

  return <Checkbox {...(props as any)} checked={checked} />;
}

function DatePickerExample() {
  const date = useSignal<Date | undefined>(new Date());

  return (
    <DatePicker label={date.value ? 'Watched' : 'Watched on…'} value={date} />
  );
}

function LayoutComponents() {
  return (
    <Section>
      <BlockStack spacing>
        <Heading>Layout</Heading>
        <BlockStack spacing="large">
          <Section>
            <BlockStack spacing>
              <Heading>Inline</Heading>

              <InlineStack spacing>
                <View cornerRadius background={Style.css`darkred`} padding>
                  Inline
                </View>
                <View cornerRadius background={Style.css`darkred`} padding>
                  Stack
                </View>
              </InlineStack>

              <InlineGrid spacing sizes={['auto', 'fill']}>
                <View cornerRadius background={Style.css`blue`} padding>
                  Inline
                </View>
                <View cornerRadius background={Style.css`blue`} padding>
                  Grid
                </View>
                <View cornerRadius background={Style.css`blue`} padding>
                  Inline
                </View>
                <View cornerRadius background={Style.css`blue`} padding>
                  Grid
                </View>
              </InlineGrid>

              <InlineStack>
                <View cornerRadius background={Style.css`purple`} padding>
                  Inline
                </View>
                <Spacer />
                <View cornerRadius background={Style.css`purple`} padding>
                  Spacer
                </View>
              </InlineStack>

              <InlineStack>
                <View cornerRadius background={Style.css`blueviolet`} padding>
                  Inline
                </View>
                <Spacer stretch />
                <View cornerRadius background={Style.css`blueviolet`} padding>
                  Stretch
                </View>
                <Spacer stretch />
                <View cornerRadius background={Style.css`blueviolet`} padding>
                  Spacer
                </View>
              </InlineStack>

              <InlineStack spacing>
                <View cornerRadius background={Style.css`indigo`} padding>
                  Inline
                </View>
                <Divider emphasis="subdued" padding="small" />
                <View cornerRadius background={Style.css`indigo`} padding>
                  Divider
                </View>
              </InlineStack>
            </BlockStack>
          </Section>

          <Section>
            <BlockStack spacing>
              <Heading>Block</Heading>

              <BlockStack spacing>
                <View cornerRadius background={Style.css`darkred`} padding>
                  Block
                </View>
                <View cornerRadius background={Style.css`darkred`} padding>
                  Stack
                </View>
              </BlockStack>

              <BlockGrid
                spacing
                sizes={['auto', 'fill']}
                blockSize={Style.css`10rem`}
              >
                <View cornerRadius background={Style.css`blue`} padding>
                  Block
                </View>
                <View cornerRadius background={Style.css`blue`} padding>
                  Grid
                </View>
                <View cornerRadius background={Style.css`blue`} padding>
                  Block
                </View>
                <View cornerRadius background={Style.css`blue`} padding>
                  Grid
                </View>
              </BlockGrid>

              <BlockStack>
                <View cornerRadius background={Style.css`purple`} padding>
                  Block
                </View>
                <Spacer />
                <View cornerRadius background={Style.css`purple`} padding>
                  Spacer
                </View>
              </BlockStack>

              <BlockStack blockSize={Style.css`16rem`}>
                <View cornerRadius background={Style.css`blueviolet`} padding>
                  Block
                </View>
                <Spacer stretch />
                <View cornerRadius background={Style.css`blueviolet`} padding>
                  Stretch
                </View>
                <Spacer stretch />
                <View cornerRadius background={Style.css`blueviolet`} padding>
                  Spacer
                </View>
              </BlockStack>

              <BlockStack spacing>
                <View cornerRadius background={Style.css`indigo`} padding>
                  Block
                </View>
                <Divider emphasis="subdued" padding="small" />
                <View cornerRadius background={Style.css`indigo`} padding>
                  Divider
                </View>
              </BlockStack>
            </BlockStack>
          </Section>
        </BlockStack>
      </BlockStack>
    </Section>
  );
}

function TextComponents() {
  return (
    <Section>
      <BlockStack spacing>
        <Heading>Typography</Heading>

        <Heading level={1} accessibilityRole="presentation">
          Heading (one)
        </Heading>
        <Heading level={2} accessibilityRole="presentation">
          Heading (two)
        </Heading>
        <Heading level={3} accessibilityRole="presentation">
          Heading (three)
        </Heading>
        <Heading level={4} accessibilityRole="presentation">
          Heading (four)
        </Heading>
        <Heading level={5} accessibilityRole="presentation">
          Heading (five)
        </Heading>
        <Heading level={6} accessibilityRole="presentation">
          Heading (six)
        </Heading>

        <Heading divider level={3} accessibilityRole="presentation">
          Heading (divider)
        </Heading>
        <Heading divider level={6} accessibilityRole="presentation">
          Heading (divider, six)
        </Heading>

        <Text>Text</Text>
        <Text emphasis="strong">Text (emphasis)</Text>
        <Text emphasis="subdued">Text (subdued)</Text>
        <TextLink to="#">Text link</TextLink>
        <TextLink to="#" emphasis="strong">
          Text link (emphasis)
        </TextLink>
        <TextLink to="#" emphasis="subdued">
          Text link (subdued)
        </TextLink>
        <TextBlock>
          Lorem ipsum dolor sit amet consectetur adipisicing elit. Sequi
          suscipit est dolorum molestiae id facere magni aperiam officiis odit
          eius, ipsum non vitae tempora neque? Dicta inventore ducimus
          voluptates quia!
        </TextBlock>
        <Label target="SomeId">Label text</Label>
        <List>
          <ListItem>List item 1</ListItem>
          <ListItem>List item 2</ListItem>
          <ListItem>List item 3</ListItem>
        </List>
        <InlineStack spacing blockAlignment="center">
          <Tag>Tag</Tag>
          <Tag size="large">Tag (large)</Tag>
        </InlineStack>
      </BlockStack>
    </Section>
  );
}

function SkeletonComponents() {
  return (
    <Section>
      <BlockStack spacing>
        <Heading>Skeleton</Heading>

        <TextBlock>Skeleton text</TextBlock>
        <SkeletonText />
        <SkeletonText size="medium" />
        <SkeletonText size="large" />

        <InlineGrid sizes={['fill', 'fill']}>
          <TextBlock>
            Skeleton text block with the default number of lines, which is 3.
            That feels like an appropriate default length for a paragraph to me.
          </TextBlock>
          <SkeletonTextBlock lines={3} />
        </InlineGrid>

        <InlineGrid sizes={['fill', 'fill']}>
          <TextBlock>
            Skeleton text block with 2 lines, this content attempts to match.
          </TextBlock>
          <SkeletonTextBlock lines={2} />
        </InlineGrid>
      </BlockStack>
    </Section>
  );
}

// eslint-disable-next-line @typescript-eslint/no-empty-function
function noop() {}
