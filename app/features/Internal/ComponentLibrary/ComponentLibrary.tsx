import {
  Action,
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
  DateField,
  Divider,
  InlineStack,
  View,
  Image,
  Rating,
  Menu,
  List,
  Item,
  Popover,
  PopoverSheet,
  Label,
  Select,
  Layout,
} from '@lemon/zest';

export default function ComponentLibrary() {
  return (
    <BlockStack padding="base">
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
      <BlockStack>
        <Heading>Actions</Heading>

        <InlineStack>
          <Action>Action (button)</Action>
          <Action to="#">Action (link)</Action>
          <Action disabled>Action (disabled)</Action>
          <Action primary>Action (primary)</Action>
          <Pressable>Pressable</Pressable>
        </InlineStack>

        <Menu>
          <Action>Menu button</Action>
          <Action to="#">Menu link</Action>
        </Menu>

        <Popover>
          <Action>Action with popover</Action>
          <PopoverSheet>This is a popover</PopoverSheet>
        </Popover>
      </BlockStack>
    </Section>
  );
}

function DisplayComponents() {
  return (
    <Section>
      <BlockStack>
        <Heading>Display</Heading>
        <Banner>Hello world</Banner>
        <Banner status="error">Hello world</Banner>
        <Banner padding={false} status="information">
          <Section content="header" padding>
            <Heading>Banner heading</Heading>
          </Section>

          <Divider />

          <Section padding>
            <BlockStack>
              <Heading>Banner section</Heading>
              <TextBlock>Banner section content</TextBlock>
            </BlockStack>
          </Section>

          <Divider padding />

          <Section padding>
            <BlockStack>
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
      <BlockStack>
        <Heading>Forms</Heading>

        <TextField label="Hello world!" />
        <DateField label="Hello world!" value={new Date()} onChange={noop} />

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

        <Rating />
      </BlockStack>
    </Section>
  );
}

function LayoutComponents() {
  return (
    <Section>
      <BlockStack>
        <Heading>Layout</Heading>

        <InlineStack>
          <View background="gray" padding="base">
            Inline
          </View>
          <View background="gray" padding="base">
            Stack
          </View>
        </InlineStack>
        <BlockStack>
          <View background="pink" padding="base">
            Block
          </View>
          <View background="pink" padding="base">
            Stack
          </View>
        </BlockStack>
        <Layout sizes={['auto', 'fill']}>
          <View background="orange" padding="base">
            Inline
          </View>
          <View background="orange" padding="base">
            Layout
          </View>
        </Layout>
      </BlockStack>
    </Section>
  );
}

function TextComponents() {
  return (
    <Section>
      <BlockStack>
        <Heading>Text</Heading>

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
      </BlockStack>
    </Section>
  );
}

// eslint-disable-next-line @typescript-eslint/no-empty-function
function noop() {}
