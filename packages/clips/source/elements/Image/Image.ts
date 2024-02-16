import {createRemoteElement} from '@remote-dom/core/elements';

import {
  type CornerRadiusValue,
  type ViewportSizeKeyword,
} from '../../styles.ts';
import {RemoteElementCornerRadiusValue} from '../shared.ts';

export type ImageFit = 'stretch' | 'cover' | 'contain';
export type ImageLoading = 'immediate' | 'in-viewport';
export type ViewportResolution = 1 | 1.3 | 1.5 | 2 | 2.6 | 3 | 3.5 | 4;

export interface ImageProperties {
  /**
   * The main source file for this image. When multiple images are provided with
   * the `sources` prop, the image provided here will be used as the fallback when
   * no other source matches the current viewport.
   */
  source: string;

  /**
   * Additional image sources to use for specific viewport conditions. Each of these
   * records will contain the `source` image URL to use, and viewport size or resolution
   * conditions to restrict the image to.
   */
  sources?: ImageSource[];

  /**
   * Accessible content describing the image. This content will be used as `altText` for
   * the image on the web, which means it will be available to users of assistive technologies
   * like screen readers. If this image is purely decorative, you can omit this prop and set
   * the `accessibilityRole` prop to `decorative`. One common signal that the image is purely
   * decorative is that the description content you would use is already present in your UI,
   * often quite close to the image.
   */
  description?: string;

  /**
   * Customizes the role of the image, which affect how it will be presented to assistive
   * technologies. Currently, you can only set this property to `decorative`, which signals
   * that the image should not be presented to assistive technologies at all. This is useful
   * for content like icons, where a name describing the icon is typically already on the page.
   */
  accessibilityRole?: 'decorative';

  /**
   * How the image should load. By default, all images will load `immediate`ly when they are rendered.
   * You can set this prop to `in-viewport` to defer loading the image until it is scrolled into view.
   *
   * @default 'immediate'
   */
  loading?: ImageLoading;

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
   * @see https://developer.mozilla.org/en-US/docs/Web/CSS/object-fit
   */
  fit?: ImageFit;

  /**
   * The radius of the corners of the image.
   *
   * @default 'none'
   */
  cornerRadius?: CornerRadiusValue;
}

export interface ImageSource {
  /**
   * The source URL to use.
   */
  source: string;

  /**
   * The minimum viewport size at which this condition applies. The condition will also apply at larger viewport sizes,
   * if no other conditions are present for those larger sizes.
   */
  viewport?: ViewportSizeKeyword;

  /**
   * The viewport resolution that this image targets.
   */
  resolution?: ViewportResolution;
}

/**
 * Image is used to visually style and provide semantic value for a small piece of image
 * content.
 */
export const Image = createRemoteElement<ImageProperties>({
  properties: {
    source: {type: String},
    sources: {type: Array},
    description: {type: String},
    accessibilityRole: {type: String},
    loading: {type: String},
    fit: {type: String},
    aspectRatio: {type: Number},
    cornerRadius: {type: RemoteElementCornerRadiusValue, default: false},
  },
});

customElements.define('ui-image', Image);

declare global {
  interface HTMLElementTagNameMap {
    'ui-image': InstanceType<typeof Image>;
  }
}
