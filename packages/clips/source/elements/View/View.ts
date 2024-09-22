import {
  ClipsElement,
  formatAutoOrNoneAttributeValue,
  type AttributeValueAsPropertySetter,
} from '../ClipsElement.ts';

import {type SpacingKeyword, SPACING_KEYWORDS} from '@watching/design';

export interface ViewAttributes {
  padding?: SpacingKeyword;
  'padding-inline-start'?: SpacingKeyword;
  'padding-inline-end'?: SpacingKeyword;
  'padding-block-start'?: SpacingKeyword;
  'padding-block-end'?: SpacingKeyword;
}

export interface ViewProperties {
  get padding(): SpacingKeyword;
  set padding(value: SpacingKeyword | boolean | undefined);
  get paddingInlineStart(): SpacingKeyword | undefined;
  set paddingInlineStart(value: SpacingKeyword | boolean | undefined);
  get paddingInlineEnd(): SpacingKeyword | undefined;
  set paddingInlineEnd(value: SpacingKeyword | boolean | undefined);
  get paddingBlockStart(): SpacingKeyword | undefined;
  set paddingBlockStart(value: SpacingKeyword | boolean | undefined);
  get paddingBlockEnd(): SpacingKeyword | undefined;
  set paddingBlockEnd(value: SpacingKeyword | boolean | undefined);
}

export interface ViewEvents {}

const DEFAULT_PADDING_VALUE = 'none';

/**
 * A View is a generic container component. Its contents will always be their
 * “natural” size, so this component can be useful in layout components (like `Layout`, `Tiles`,
 * `BlockStack`, `InlineStack`) that would otherwise stretch their children to fit.
 */
export class View<
    Attributes extends ViewAttributes = ViewAttributes,
    Events extends ViewEvents = ViewEvents,
  >
  extends ClipsElement<Attributes, Events>
  implements ViewProperties
{
  static get remoteAttributes(): string[] {
    return [
      'padding',
      'padding-inline-start',
      'padding-inline-end',
      'padding-block-start',
      'padding-block-end',
    ] satisfies (keyof ViewAttributes)[];
  }

  get padding(): SpacingKeyword {
    return (
      formatAutoOrNoneAttributeValue(this.getAttribute('padding'), {
        allowed: SPACING_KEYWORDS,
      }) ?? DEFAULT_PADDING_VALUE
    );
  }

  set padding(value: AttributeValueAsPropertySetter<SpacingKeyword>) {
    const resolvedValue =
      formatAutoOrNoneAttributeValue(value, {
        allowed: SPACING_KEYWORDS,
      }) ?? DEFAULT_PADDING_VALUE;

    if (resolvedValue === 'none') {
      this.removeAttribute('padding');
    } else if (resolvedValue) {
      this.setAttribute('padding', resolvedValue);
    }
  }

  get paddingInlineStart(): SpacingKeyword | undefined {
    return formatAutoOrNoneAttributeValue(
      this.getAttribute('padding-inline-start'),
      {
        allowed: SPACING_KEYWORDS,
      },
    );
  }

  set paddingInlineStart(
    value: AttributeValueAsPropertySetter<SpacingKeyword>,
  ) {
    this.#updatePaddingProperty('padding-inline-start', value);
  }

  get paddingInlineEnd(): SpacingKeyword | undefined {
    return formatAutoOrNoneAttributeValue(
      this.getAttribute('padding-inline-end'),
      {
        allowed: SPACING_KEYWORDS,
      },
    );
  }

  set paddingInlineEnd(value: AttributeValueAsPropertySetter<SpacingKeyword>) {
    this.#updatePaddingProperty('padding-inline-end', value);
  }

  get paddingBlockStart(): SpacingKeyword | undefined {
    return formatAutoOrNoneAttributeValue(
      this.getAttribute('padding-block-start'),
      {
        allowed: SPACING_KEYWORDS,
      },
    );
  }

  set paddingBlockStart(value: AttributeValueAsPropertySetter<SpacingKeyword>) {
    this.#updatePaddingProperty('padding-block-start', value);
  }

  get paddingBlockEnd(): SpacingKeyword | undefined {
    return formatAutoOrNoneAttributeValue(
      this.getAttribute('padding-block-end'),
      {
        allowed: SPACING_KEYWORDS,
      },
    );
  }

  set paddingBlockEnd(value: AttributeValueAsPropertySetter<SpacingKeyword>) {
    this.#updatePaddingProperty('padding-block-end', value);
  }

  #updatePaddingProperty(
    attribute: Extract<keyof ViewAttributes, `padding-${string}`>,
    value: AttributeValueAsPropertySetter<SpacingKeyword>,
  ) {
    const resolvedValue = formatAutoOrNoneAttributeValue(value, {
      allowed: SPACING_KEYWORDS,
    });

    if (resolvedValue == null) {
      this.removeAttribute(attribute);
    } else {
      this.setAttribute(attribute, resolvedValue);
    }
  }
}

customElements.define('ui-view', View);

declare global {
  interface HTMLElementTagNameMap {
    'ui-view': InstanceType<typeof View>;
  }
}
