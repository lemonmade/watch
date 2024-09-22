import {
  ClipsElement,
  backedByAttribute,
  formatAutoOrNoneAttributeValue,
  attributeRestrictedToAllowedValues,
  type AttributeValueAsPropertySetter,
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
  /**
   * The main source file for this image. When multiple images are provided with
   * the `sources` prop, the image provided here will be used as the fallback when
   * no other source matches the current viewport.
   */
  source?: string;

  /**
   * Accessible content describing the image. This content will be used as `altText` for
   * the image on the web, which means it will be available to users of assistive technologies
   * like screen readers. If this image is purely decorative, you can omit this prop and set
   * the `accessibilityRole` prop to `decorative`. One common signal that the image is purely
   * decorative is that the description content you would use is already present in your UI,
   * often quite close to the image.
   *
   * @default ''
   */
  description: string;

  /**
   * Customizes the role of the image, which affect how it will be presented to assistive
   * technologies. Currently, you can only set this property to `decorative`, which signals
   * that the image should not be presented to assistive technologies at all. This is useful
   * for content like icons, where a name describing the icon is typically already on the page.
   *
   * @default 'image'
   */
  accessibilityRole: ImageAccessibilityRoleKeyword;

  /**
   * How the image should load. By default, all images will load `immediate`ly when they are rendered.
   * You can set this prop to `in-viewport` to defer loading the image until it is scrolled into view.
   *
   * @default 'immediate'
   */
  loading: ImageLoadingKeyword;

  /**
   * The relative size of the image, expressed as its with over its height. You should provide an aspect
   * ratio unless it is prohibitively expensive to calculate; without an aspect ratio, the image will change
   * its size once the file has loaded, which leads to major layout shifts.
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/CSS/aspect-ratio
   */
  aspectRatio?: number;

  /**
   * How the image should be resized to fit its container, if the two have different aspect ratios. By default,
   * the image will be stretched to fit the container. You can change this behavior by passing one of these values:
   *
   * - `cover`, which will cause the image to get as large as it needs to be to fill the container, while preserving
   *    its original aspect ratio,or to `contain`. This often results in parts of the image being cut off.
   * - `contain`, which will cause the image to scale to fit the container while preserving its original aspect ratio.
   *   This often results in "leftover" space around the image in the container.
   *
   * @default 'auto'
   * @see https://developer.mozilla.org/en-US/docs/Web/CSS/object-fit
   */
  fit: ImageFitKeyword;

  /**
   * The radius of the corners of the image.
   *
   * @default 'none'
   */
  get cornerRadius(): CornerRadiusKeyword;
  set cornerRadius(value: CornerRadiusKeyword | boolean | undefined);
}

export interface ImageEvents {}

const DEFAULT_CORNER_RADIUS_VALUE = 'none';

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
    if (value == null) {
      this.removeAttribute('aspect-ratio');
    } else if (typeof value === 'number') {
      this.setAttribute('aspect-ratio', value.toString());
    }
  }

  @backedByAttribute({
    ...attributeRestrictedToAllowedValues(IMAGE_FIT_KEYWORDS),
  })
  accessor fit: ImageFitKeyword = 'auto';

  get cornerRadius(): CornerRadiusKeyword {
    return (
      formatAutoOrNoneAttributeValue(this.getAttribute('corner-radius'), {
        allowed: CORNER_RADIUS_KEYWORDS,
      }) ?? DEFAULT_CORNER_RADIUS_VALUE
    );
  }

  set cornerRadius(value: AttributeValueAsPropertySetter<CornerRadiusKeyword>) {
    const resolvedValue =
      formatAutoOrNoneAttributeValue(value, {
        allowed: CORNER_RADIUS_KEYWORDS,
      }) ?? DEFAULT_CORNER_RADIUS_VALUE;

    if (resolvedValue === 'none') {
      this.removeAttribute('corner-radius');
    } else if (resolvedValue) {
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
