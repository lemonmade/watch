import {
  BlockStack,
  Button,
  TextField,
  Heading,
  Section,
  Banner,
  ChoiceList,
  Choice,
  Link,
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
      <Section>
        <BlockStack>
          <Heading>Actions</Heading>

          <Button>Button</Button>
          <Link to="#">Link</Link>
          <Pressable>Pressable</Pressable>

          <Menu>
            <Button>Menu button</Button>
            <Link to="#">Menu link</Link>
            <Pressable>Menu pressable</Pressable>
          </Menu>

          <Popover>
            <Button>Popover button</Button>
            <PopoverSheet>This is a popover</PopoverSheet>
          </Popover>
        </BlockStack>
      </Section>

      <Divider />

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

      <Divider />

      <Section>
        <BlockStack>
          <Heading>Forms</Heading>

          <TextField label="Hello world!" />
          <DateField
            label="Hello world!"
            value={new Date()}
            onChange={() => {}}
          />

          <Select
            label="Select"
            options={[
              {value: 'option-one', label: 'Option One'},
              {value: 'option-two', label: 'Option Two'},
            ]}
          ></Select>

          <ChoiceList onChange={() => {}}>
            <Choice value="hello">Hello</Choice>
            <Choice value="world">World</Choice>
          </ChoiceList>

          <Rating />
        </BlockStack>
      </Section>

      <Divider />

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
          <Label>Label text</Label>
          <List>
            <Item>List item 1</Item>
            <Item>List item 2</Item>
            <Item>List item 3</Item>
          </List>
        </BlockStack>
      </Section>

      <Divider />

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
                <Button>Banner button</Button>
                <Button>Banner button</Button>
              </InlineStack>
            </Section>
          </Banner>

          <Image aspectRatio={1} source="https://placekitten.com/200/200" />
        </BlockStack>
      </Section>
    </BlockStack>
  );
}
