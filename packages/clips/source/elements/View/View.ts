import {ClipsElement, restrictToAllowedValues} from '../ClipsElement.ts';

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
      restrictToAllowedValues(this.getAttribute('padding'), SPACING_KEYWORDS) ??
      'none'
    );
  }

  set padding(value: SpacingKeyword | boolean) {
    const resolvedValue = resolvePaddingValue(value);

    if (resolvedValue === 'none') {
      this.removeAttribute('padding');
    } else if (resolvedValue) {
      this.setAttribute('padding', resolvedValue);
    }
  }

  get paddingInlineStart(): SpacingKeyword | undefined {
    return restrictToAllowedValues(
      this.getAttribute('padding-inline-start'),
      SPACING_KEYWORDS,
    );
  }

  set paddingInlineStart(value: SpacingKeyword | boolean | undefined) {
    this.#updatePaddingProperty('padding-inline-start', value);
  }

  get paddingInlineEnd(): SpacingKeyword | undefined {
    return restrictToAllowedValues(
      this.getAttribute('padding-inline-end'),
      SPACING_KEYWORDS,
    );
  }

  set paddingInlineEnd(value: SpacingKeyword | boolean | undefined) {
    this.#updatePaddingProperty('padding-inline-end', value);
  }

  get paddingBlockStart(): SpacingKeyword | undefined {
    return restrictToAllowedValues(
      this.getAttribute('padding-block-start'),
      SPACING_KEYWORDS,
    );
  }

  set paddingBlockStart(value: SpacingKeyword | boolean | undefined) {
    this.#updatePaddingProperty('padding-block-start', value);
  }

  get paddingBlockEnd(): SpacingKeyword | undefined {
    return restrictToAllowedValues(
      this.getAttribute('padding-block-end'),
      SPACING_KEYWORDS,
    );
  }

  set paddingBlockEnd(value: SpacingKeyword | boolean | undefined) {
    this.#updatePaddingProperty('padding-block-end', value);
  }

  #updatePaddingProperty(
    property: Extract<keyof ViewAttributes, `padding-${string}`>,
    value: SpacingKeyword | boolean | undefined,
  ) {
    if (value == null) {
      this.removeAttribute(property);
    } else {
      const resolvedValue = resolvePaddingValue(value);
      if (resolvedValue) this.setAttribute(property, resolvedValue);
    }
  }
}

function resolvePaddingValue(
  value: string | boolean | undefined,
): SpacingKeyword | undefined {
  if (value === true) return 'auto';
  if (value === false || value == null) return 'none';
  return restrictToAllowedValues(value, SPACING_KEYWORDS);
}

customElements.define('ui-view', View);

declare global {
  interface HTMLElementTagNameMap {
    'ui-view': InstanceType<typeof View>;
  }
}
