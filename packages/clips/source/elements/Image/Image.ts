import {
  ClipsElement,
  backedByAttribute,
  attributeRestrictedToAllowedValues,
  restrictToAllowedValues,
} from '../ClipsElement.ts';
import {
  CORNER_RADIUS_KEYWORDS,
  type CornerRadiusKeyword,
  IMAGE_FIT_KEYWORDS,
  type ImageFitKeyword,
  IMAGE_LOADING_KEYWORDS,
  type ImageLoadingKeyword,
  IMAGE_ACCESSIBILITY_ROLE_KEYWORDS,
  type ImageAccessibilityRoleKeyword,
} from '@watching/design';

export interface ImageAttributes {
  source?: string;
  description?: string;
  'accessibility-role'?: ImageAccessibilityRoleKeyword;
  loading?: ImageLoadingKeyword;
  'aspect-ratio'?: string;
  fit?: ImageFitKeyword;
  'corner-radius'?: string;
}

export interface ImageProperties {
  source?: string;
  description: string;
  accessibilityRole: ImageAccessibilityRoleKeyword;
  loading: ImageLoadingKeyword;
  aspectRatio?: number;
  fit: ImageFitKeyword;
  get cornerRadius(): CornerRadiusKeyword;
  set cornerRadius(value: CornerRadiusKeyword | boolean);
}

export interface ImageEvents {}

/**
 * Image is used to visually style and provide semantic value for a small piece of image
 * content.
 */
export class Image
  extends ClipsElement<ImageAttributes, ImageEvents>
  implements ImageProperties
{
  static get remoteAttributes() {
    return [
      'source',
      'description',
      'accessibility-role',
      'loading',
      'aspect-ratio',
      'fit',
      'corner-radius',
    ] satisfies (keyof ImageAttributes)[];
  }

  @backedByAttribute()
  accessor source: string | undefined;

  @backedByAttribute()
  accessor description: string = '';

  @backedByAttribute({
    name: 'accessibility-role',
    ...attributeRestrictedToAllowedValues(IMAGE_ACCESSIBILITY_ROLE_KEYWORDS),
  })
  accessor accessibilityRole: ImageAccessibilityRoleKeyword = 'image';

  @backedByAttribute({
    ...attributeRestrictedToAllowedValues(IMAGE_LOADING_KEYWORDS),
  })
  accessor loading: ImageLoadingKeyword = 'immediate';

  get aspectRatio() {
    return this.getAttribute('aspect-ratio')
      ? Number(this.getAttribute('aspect-ratio'))
      : undefined;
  }

  set aspectRatio(value: number | undefined) {
    if (typeof value === 'number') {
      this.setAttribute('aspect-ratio', value.toString());
    }
  }

  @backedByAttribute({
    ...attributeRestrictedToAllowedValues(IMAGE_FIT_KEYWORDS),
  })
  accessor fit: ImageFitKeyword = 'auto';

  get cornerRadius(): CornerRadiusKeyword {
    return (
      restrictToAllowedValues(
        this.getAttribute('corner-radius'),
        CORNER_RADIUS_KEYWORDS,
      ) ?? 'none'
    );
  }

  set cornerRadius(value: CornerRadiusKeyword | boolean) {
    const resolvedValue =
      value === true
        ? 'auto'
        : value === false
          ? 'none'
          : restrictToAllowedValues(value, CORNER_RADIUS_KEYWORDS);

    if (resolvedValue == null) return;

    if (resolvedValue === 'none') {
      this.removeAttribute('corner-radius');
    } else {
      this.setAttribute('corner-radius', resolvedValue);
    }
  }
}

customElements.define('ui-image', Image);

declare global {
  interface HTMLElementTagNameMap {
    'ui-image': InstanceType<typeof Image>;
  }
}
