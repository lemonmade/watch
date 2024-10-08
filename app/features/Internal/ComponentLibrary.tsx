import type {ComponentProps, RenderableProps} from 'preact';
import {useSignal} from '@quilted/quilt/signals';
import {usePerformanceNavigation} from '@quilted/quilt/performance';
import {
  Style,
  Button,
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
  SkeletonButton,
  Disclosure,
} from '@lemon/zest';

export default function ComponentLibrary() {
  usePerformanceNavigation();

  return (
    <BlockStack spacing padding>
      <ActionComponents />
      <Divider />
      <DisclosureComponents />
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
          <Button>Action (button)</Button>
          <Button to="#">Action (link)</Button>
          <Button disabled>Action (disabled)</Button>

          <Button emphasis>Action (emphasized)</Button>
          <Button emphasis disabled icon="arrow.end">
            Action (emphasized disabled)
          </Button>

          <Button emphasis="subdued">Action (subdued)</Button>
          <Button emphasis="subdued" disabled icon="arrow.end">
            Action (subdued disabled)
          </Button>

          <Button role="destructive" icon="delete">
            Action (destructive)
          </Button>
          <Button role="destructive" disabled icon="delete">
            Action (destructive disabled)
          </Button>

          <Button overlay={<ActionExampleModal />}>Action (modal)</Button>
          <Button size="small">Action (small)</Button>
          <Button size="large">Action (large)</Button>
          <Button detail={<Icon source="arrow.end" />}>Action (detail)</Button>
          <Pressable>Pressable</Pressable>
          <Pressable to="#">Pressable (link)</Pressable>
        </Stack>

        <Button>Action that fills</Button>
        <Button icon="delete">Action that fills</Button>
        <Button icon="delete" inlineAlignment="start">
          Action that fills that is really really really really really really
          really really really really long
        </Button>

        <LoadingActionExample />

        <Divider emphasis="subdued" />

        <InlineStack spacing="small">
          <Button accessory={<ActionAccessoryExampleMenu />}>Accessory</Button>
          <Button emphasis accessory={<ActionAccessoryExampleMenu />}>
            Accessory (emphasized)
          </Button>
          <Button emphasis="subdued" accessory={<ActionAccessoryExampleMenu />}>
            Accessory (subdued)
          </Button>
          <Button role="destructive" accessory={<ActionAccessoryExampleMenu />}>
            Accessory (destructive)
          </Button>
          <Button disabled accessory={<ActionAccessoryExampleMenu />}>
            Accessory (disabled)
          </Button>
          <Button accessory={<ActionAccessoryExampleMenu disabled />}>
            Accessory (accessory disabled)
          </Button>
          <Button emphasis disabled accessory={<ActionAccessoryExampleMenu />}>
            Accessory (emphasized disabled)
          </Button>
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
          <Button>Menu button</Button>
          <Button to="#">Menu link</Button>
          <Button emphasis="subdued">Menu button (subdued)</Button>
          <Button loading icon="arrow.end">
            Menu button (loading)
          </Button>
          <Button emphasis>Menu button (emphasized)</Button>
          <Button icon="delete" role="destructive">
            Menu button (destructive)
          </Button>
        </Menu>

        <Menu label="Important actions…">
          <Button icon="delete">Delete</Button>
        </Menu>

        <ActionList>
          <Button icon="watch">Item one</Button>
          <Button icon="skip">Item two</Button>
          <Button icon="stop">Item three</Button>
          <Button icon="go" loading>
            Item four (loading)
          </Button>
          <Button icon="delete" role="destructive">
            Item (destructive)
          </Button>
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
        <Button loading={loading}>Action (loading)</Button>
        <Button
          icon="close"
          accessory={<ActionAccessoryExampleMenu />}
          loading={loading}
        >
          Action (accessory loading)
        </Button>
        <Button emphasis="subdued" loading={loading} icon="arrow.end">
          Action (subdued loading)
        </Button>
        <Button emphasis loading={loading} icon="arrow.end">
          Action (emphasized loading)
        </Button>
        <Button role="destructive" loading={loading} icon="delete">
          Action (destructive loading)
        </Button>
      </InlineStack>
    </BlockStack>
  );
}

function ActionExamplePopoverMenu(props: ComponentProps<typeof Popover>) {
  return (
    <Popover {...props}>
      <Menu>
        <Button icon="watchlist">Menu button</Button>
        <Button icon="arrow.end" to="#">
          Menu link
        </Button>
        <Button icon="delete" role="destructive">
          Menu destructive
        </Button>
      </Menu>
    </Popover>
  );
}

function ActionAccessoryExampleMenu({disabled = false} = {}) {
  return (
    <Button
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
          <Button
            accessory={
              <Button
                icon="more"
                accessibilityLabel="More actions"
                overlay={
                  <Popover>
                    <Menu>
                      <Button>Nice!</Button>
                    </Menu>
                  </Popover>
                }
              />
            }
          >
            Dismiss
          </Button>
          <Button emphasis>Save</Button>
        </InlineStack>
      </BlockStack>
    </Modal>
  );
}

function DisclosureComponents() {
  return (
    <Section>
      <BlockStack spacing>
        <Heading>Disclosure</Heading>

        <Disclosure label="Disclosure label">Disclosure content</Disclosure>
      </BlockStack>
    </Section>
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

            <InlineStack spacing alignment="space-between">
              <Spacer size="none" />
              <PopoverExample inlineAttachment="center" />
              <PopoverExample inlineAttachment="center" />
              <PopoverExample inlineAttachment="center" />
              <PopoverExample inlineAttachment="center" />
            </InlineStack>

            <Heading>inlineAttachment=start</Heading>

            <InlineStack spacing alignment="space-between">
              <PopoverExample inlineAttachment="start" />
              <PopoverExample inlineAttachment="start" />
              <PopoverExample inlineAttachment="start" />
              <PopoverExample inlineAttachment="start" />
              <Spacer size="none" />
            </InlineStack>

            <Heading>inlineAttachment=end</Heading>

            <InlineStack spacing alignment="space-between">
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
    <Button
      overlay={
        <Popover
          inlineAttachment={inlineAttachment}
          blockAttachment={blockAttachment}
        >
          <Menu>
            <Button>Nice!</Button>
          </Menu>
        </Popover>
      }
    >
      Popover
    </Button>
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
              <Button>Banner button</Button>
              <Button>Banner button</Button>
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
  props: RenderableProps<Omit<ComponentProps<typeof Checkbox>, 'checked'>>,
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

        <TextBlock>Skeleton action</TextBlock>
        <InlineStack spacing>
          <SkeletonButton />
          <SkeletonButton size="small" />
          <SkeletonButton size="auto" />
          <SkeletonButton size="large" />
          <SkeletonButton size={Style.css`2rem`} />
        </InlineStack>

        <TextBlock>Skeleton text</TextBlock>
        <SkeletonText />
        <SkeletonText size="small" />
        <SkeletonText size="auto" />
        <SkeletonText size="large" />

        <InlineGrid sizes={['fill', 'fill']} spacing>
          <TextBlock>
            Skeleton text block with the default number of lines, which is 3.
            That feels like an appropriate default length for a paragraph to me.
          </TextBlock>
          <SkeletonTextBlock lines={3} />
        </InlineGrid>

        <InlineGrid sizes={['fill', 'fill']} spacing>
          <TextBlock>
            Skeleton text block with 2 lines, this content attempts to match.
          </TextBlock>
          <SkeletonTextBlock lines={2} />
        </InlineGrid>
      </BlockStack>
    </Section>
  );
}

function noop() {}
