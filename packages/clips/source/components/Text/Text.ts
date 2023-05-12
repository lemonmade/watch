import {
  createRemoteElement,
  BooleanOrString,
  type RemoteElementPropertyType,
} from '@lemonmade/remote-ui/elements';

export interface TextProperties {
  emphasis?: boolean | 'strong' | 'subdued';
}

export const Text = 'ui-text';

/**
 * Text is used to visually style and provide semantic value for a small piece of text
 * content.
 */
export const TextElement = createRemoteElement<TextProperties>({
  properties: {
    emphasis: {
      type: BooleanOrString as RemoteElementPropertyType<
        TextProperties['emphasis']
      >,
    },
  },
});

customElements.define(Text, TextElement);

declare global {
  interface HTMLElementTagNameMap {
    [Text]: InstanceType<typeof TextElement>;
  }
}
