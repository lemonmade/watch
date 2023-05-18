import {
  createRemoteElement,
  BooleanOrString,
  type RemoteElementPropertyType,
} from '@lemonmade/remote-ui/elements';

export interface TextProperties {
  emphasis?: boolean | 'strong' | 'subdued';
}

/**
 * Text is used to visually style and provide semantic value for a small piece of text
 * content.
 */
export const Text = createRemoteElement<TextProperties>({
  properties: {
    emphasis: {
      type: BooleanOrString as RemoteElementPropertyType<
        TextProperties['emphasis']
      >,
    },
  },
});

customElements.define('ui-text', Text);

declare global {
  interface HTMLElementTagNameMap {
    'ui-text': InstanceType<typeof Text>;
  }
}
