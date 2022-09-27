import {
  raw,
  Action,
  ActionList,
  BlockStack,
  TextField,
  Heading,
  Section,
  Banner,
  ChoiceList,
  Choice,
  Pressable,
  Text,
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

export default function ComponentLibrary() {
  return (
    <BlockStack spacing padding="base">
      <ActionComponents />
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
          <Action loading>Action (loading)</Action>
          <Action emphasis>Action (emphasized)</Action>
          <Action emphasis disabled icon="arrowEnd">
            Action (emphasized disabled)
          </Action>
          <Action emphasis loading icon="arrowEnd">
            Action (emphasized loading)
          </Action>
          <Action emphasis="subdued">Action (subdued)</Action>
          <Action emphasis="subdued" disabled icon="arrowEnd">
            Action (subdued disabled)
          </Action>
          <Action emphasis="subdued" loading icon="arrowEnd">
            Action (subdued loading)
          </Action>
          <Action role="destructive" icon="delete">
            Action (destructive)
          </Action>
          <Action role="destructive" disabled icon="delete">
            Action (destructive disabled)
          </Action>
          <Action role="destructive" loading icon="delete">
            Action (destructive loading)
          </Action>
          <Action modal={<ActionExampleModal />}>Action (modal)</Action>
          <Action size="small">Action (small)</Action>
          <Action detail={<Icon source="arrowEnd" />}>Action (detail)</Action>
          <Pressable>Pressable</Pressable>
          <Pressable to="#">Pressable (link)</Pressable>
        </InlineStack>

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

        <Menu>
          <Action>Menu button</Action>
          <Action to="#">Menu link</Action>
          <Action emphasis="subdued">Menu button (subdued)</Action>
          <Action emphasis>Menu button (emphasized)</Action>
          <Action icon="delete" role="destructive">
            Menu button (destructive)
          </Action>
        </Menu>

        <ActionList>
          <Action icon="watch">Item one</Action>
          <Action icon="skip">Item two</Action>
          <Action icon="stop">Item three</Action>
          <Action icon="delete" role="destructive">
            Item (destructive)
          </Action>
        </ActionList>
      </BlockStack>
    </Section>
  );
}

function ActionAccessoryExampleMenu({disabled = false} = {}) {
  return (
    <Action
      disabled={disabled}
      accessibilityLabel="More actions"
      icon="more"
      popover={
        <Popover>
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
      }
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

function DisplayComponents() {
  return (
    <Section>
      <BlockStack spacing>
        <Heading>Display</Heading>
        <Banner>Hello world</Banner>
        <Banner status="error">Hello world</Banner>
        <Banner padding={false} status="information">
          <Section content="header" padding>
            <Heading>Banner heading</Heading>
          </Section>

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

          <Section content="footer" padding>
            <InlineStack spacing="small">
              <Action>Banner button</Action>
              <Action>Banner button</Action>
            </InlineStack>
          </Section>
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

        <Select
          label="Select"
          options={[
            {value: 'option-one', label: 'Option One'},
            {value: 'option-two', label: 'Option Two'},
          ]}
        ></Select>

        <ChoiceList onChange={noop}>
          <Choice value="hello">Hello</Choice>
          <Choice value="world">World</Choice>
        </ChoiceList>

        <InlineStack spacing>
          <Rating />
          <DatePickerExample />
        </InlineStack>
      </BlockStack>
    </Section>
  );
}

function DatePickerExample() {
  const date = useSignal<Date | undefined>(new Date());
  return (
    <DatePicker
      label={date.value ? 'Watched' : 'Watched on…'}
      value={date.value}
      onChange={(newDate) => {
        date.value = newDate;
      }}
    />
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

        <Text>Hello world</Text>
        <Text emphasis="strong">Hello world</Text>
        <Text emphasis="subdued">Hello world</Text>
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
