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
  set padding(value: SpacingKeyword | boolean);
  get paddingInlineStart(): SpacingKeyword | undefined;
  set paddingInlineStart(value: SpacingKeyword | boolean);
  get paddingInlineEnd(): SpacingKeyword | undefined;
  set paddingInlineEnd(value: SpacingKeyword | boolean);
  get paddingBlockStart(): SpacingKeyword | undefined;
  set paddingBlockStart(value: SpacingKeyword | boolean);
  get paddingBlockEnd(): SpacingKeyword | undefined;
  set paddingBlockEnd(value: SpacingKeyword | boolean);
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
    const resolvedValue =
      value === true ? 'auto' : value === false ? 'none' : value;

    if (resolvedValue === 'none') {
      this.removeAttribute('padding');
    } else {
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
    if (value == null) {
      this.removeAttribute('padding-inline-start');
    } else {
      this.setAttribute(
        'padding',
        value === true ? 'auto' : value === false ? 'none' : value,
      );
    }
  }

  get paddingInlineEnd(): SpacingKeyword | undefined {
    return restrictToAllowedValues(
      this.getAttribute('padding-inline-end'),
      SPACING_KEYWORDS,
    );
  }

  set paddingInlineEnd(value: SpacingKeyword | boolean | undefined) {
    if (value == null) {
      this.removeAttribute('padding-inline-end');
    } else {
      this.setAttribute(
        'padding',
        value === true ? 'auto' : value === false ? 'none' : value,
      );
    }
  }

  get paddingBlockStart(): SpacingKeyword | undefined {
    return restrictToAllowedValues(
      this.getAttribute('padding-block-start'),
      SPACING_KEYWORDS,
    );
  }

  set paddingBlockStart(value: SpacingKeyword | boolean | undefined) {
    if (value == null) {
      this.removeAttribute('padding-block-start');
    } else {
      this.setAttribute(
        'padding',
        value === true ? 'auto' : value === false ? 'none' : value,
      );
    }
  }

  get paddingBlockEnd(): SpacingKeyword | undefined {
    return restrictToAllowedValues(
      this.getAttribute('padding-block-end'),
      SPACING_KEYWORDS,
    );
  }

  set paddingBlockEnd(value: SpacingKeyword | boolean | undefined) {
    if (value == null) {
      this.removeAttribute('padding-block-end');
    } else {
      this.setAttribute(
        'padding',
        value === true ? 'auto' : value === false ? 'none' : value,
      );
    }
  }
}

customElements.define('ui-view', View);

declare global {
  interface HTMLElementTagNameMap {
    'ui-view': InstanceType<typeof View>;
  }
}
