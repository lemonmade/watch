import {type ComponentProps} from 'react';
import {
  raw,
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
  Item,
  Popover,
  Label,
  Select,
  Layout,
  Spacer,
  Modal,
  Icon,
  Tag,
} from '@lemon/zest';
import {useSignal} from '@watching/react-signals';

import {ResourceAction} from './ResourceAction/ResourceAction';

export default function ComponentLibrary() {
  return (
    <BlockStack spacing padding="base">
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
      <DisplayComponents />
    </BlockStack>
  );
}

function ActionComponents() {
  return (
    <Section>
      <BlockStack spacing>
        <Heading>Actions</Heading>

        <InlineStack spacing="small">
          <Action>Action (button)</Action>
          <Action to="#">Action (link)</Action>
          <Action disabled>Action (disabled)</Action>

          <Action emphasis>Action (emphasized)</Action>
          <Action emphasis disabled icon="arrowEnd">
            Action (emphasized disabled)
          </Action>

          <Action emphasis="subdued">Action (subdued)</Action>
          <Action emphasis="subdued" disabled icon="arrowEnd">
            Action (subdued disabled)
          </Action>

          <Action role="destructive" icon="delete">
            Action (destructive)
          </Action>
          <Action role="destructive" disabled icon="delete">
            Action (destructive disabled)
          </Action>

          <Action modal={<ActionExampleModal />}>Action (modal)</Action>
          <Action size="small">Action (small)</Action>
          <Action detail={<Icon source="arrowEnd" />}>Action (detail)</Action>
          <Pressable>Pressable</Pressable>
          <Pressable to="#">Pressable (link)</Pressable>
        </InlineStack>

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
          <ResourceAction>My action</ResourceAction>
          <ResourceAction>
            My long action that might have quite a long title
          </ResourceAction>
          <HeadingAction
            popover={<ActionExamplePopoverMenu inlineAttachment="start" />}
          >
            My heading action
          </HeadingAction>
          <HeadingAction
            popover={<ActionExamplePopoverMenu inlineAttachment="start" />}
          >
            My heading action that is quite long and will likely wrap
          </HeadingAction>
          <HeadingAction
            level={3}
            popover={<ActionExamplePopoverMenu inlineAttachment="start" />}
          >
            My heading action (level 3)
          </HeadingAction>
          <HeadingAction
            level={6}
            popover={<ActionExamplePopoverMenu inlineAttachment="start" />}
          >
            My heading action (level 6)
          </HeadingAction>
        </BlockStack>

        <Divider emphasis="subdued" />

        <Menu>
          <Action>Menu button</Action>
          <Action to="#">Menu link</Action>
          <Action emphasis="subdued">Menu button (subdued)</Action>
          <Action loading icon="arrowEnd">
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
        <Action emphasis="subdued" loading={loading} icon="arrowEnd">
          Action (subdued loading)
        </Action>
        <Action emphasis loading={loading} icon="arrowEnd">
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
        <Action icon="arrowEnd" to="#">
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
      popover={<ActionExamplePopoverMenu inlineAttachment="end" />}
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
                popover={
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
      popover={
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
        <Banner status="error">Hello world</Banner>
        <Banner padding={false} status="information">
          <Header>
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
        <TextField label="Text field (multiline)" multiline />
        <TextField
          label="Text field (multiline, lines)"
          multiline={5}
          blockSize="fitContent"
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

        <InlineStack spacing>
          <View cornerRadius background={raw`#333`} padding="base">
            Inline
          </View>
          <View cornerRadius background={raw`#333`} padding="base">
            Stack
          </View>
        </InlineStack>
        <BlockStack spacing>
          <View cornerRadius background={raw`darkred`} padding="base">
            Block
          </View>
          <View cornerRadius background={raw`darkred`} padding="base">
            Stack
          </View>
        </BlockStack>
        <Layout spacing columns={['auto', 'fill']}>
          <View cornerRadius background={raw`blue`} padding="base">
            Fancy
          </View>
          <View cornerRadius background={raw`blue`} padding="base">
            Layout
          </View>
          <View cornerRadius background={raw`blue`} padding="base">
            Fancy
          </View>
          <View cornerRadius background={raw`blue`} padding="base">
            Layout
          </View>
        </Layout>

        <InlineStack>
          <View cornerRadius background={raw`purple`} padding="base">
            Inline
          </View>
          <Spacer />
          <View cornerRadius background={raw`purple`} padding="base">
            Spacer
          </View>
        </InlineStack>

        <InlineStack spacing>
          <View cornerRadius background={raw`indigo`} padding="base">
            Inline
          </View>
          <Divider emphasis="subdued" padding="small" />
          <View cornerRadius background={raw`indigo`} padding="base">
            Divider
          </View>
        </InlineStack>

        <BlockStack>
          <View cornerRadius background={raw`darkgreen`} padding="base">
            Block
          </View>
          <Spacer />
          <View cornerRadius background={raw`darkgreen`} padding="base">
            Spacer
          </View>
        </BlockStack>

        <BlockStack spacing>
          <View cornerRadius background={raw`green`} padding="base">
            Block
          </View>
          <Divider />
          <View cornerRadius background={raw`green`} padding="base">
            Divider
          </View>
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
          <Item>List item 1</Item>
          <Item>List item 2</Item>
          <Item>List item 3</Item>
        </List>
        <InlineStack>
          <Tag>Tag</Tag>
        </InlineStack>
      </BlockStack>
    </Section>
  );
}

// eslint-disable-next-line @typescript-eslint/no-empty-function
function noop() {}
