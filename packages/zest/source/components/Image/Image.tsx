import type {JSX} from 'preact';
import {classes, variation} from '@lemon/css';
import type {CornerRadiusKeyword, ViewportResolution} from '@watching/design';
import type {ImageProperties, ViewportSizeKeyword} from '@watching/clips';

import systemStyles from '../../system.module.css';

import styles from './Image.module.css';

export interface ImageProps
  extends Omit<Partial<ImageProperties>, 'cornerRadius'> {
  cornerRadius?: CornerRadiusKeyword | boolean;

  /**
   * Additional image sources to use for specific viewport conditions. Each of these
   * records will contain the `source` image URL to use, and viewport size or resolution
   * conditions to restrict the image to.
   */
  sources?: readonly ImageSource[];
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

export enum Media {
  Medium = '(min-width: 601px)',
  Large = '(min-width: 1201px)',
}

const MEDIA_MAP = {
  small: undefined,
  medium: Media.Medium,
  large: Media.Large,
};

const CORNER_RADIUS_CLASS_MAP = new Map<string | boolean, string | undefined>([
  [false, systemStyles.cornerRadiusNone],
  ['none', systemStyles.cornerRadiusNone],
  ['small.1', systemStyles.cornerRadiusSmall1],
  ['small', systemStyles.cornerRadiusSmall1],
  ['auto', systemStyles.cornerRadiusAuto],
  [true, systemStyles.cornerRadiusAuto],
  ['large', systemStyles.cornerRadiusLarge1],
  ['large', systemStyles.cornerRadiusLarge1],
]);

export function Image({
  source,
  sources,
  description = '',
  accessibilityRole,
  fit,
  loading,
  aspectRatio,
  cornerRadius,
}: ImageProps) {
  const sourcesMarkup =
    sources &&
    sources
      .reduce<{srcSet: string; media?: string}[]>(
        (sourcesProps, {source, viewport, resolution}) => {
          const media = viewport && MEDIA_MAP[viewport];
          const maybeSourceProps = sourcesProps.find(
            ({media: mediaValue}) => media === mediaValue,
          );
          const srcSet = [source, resolution && `${resolution}x`]
            .join(' ')
            .trim();

          if (maybeSourceProps) {
            maybeSourceProps.srcSet += `, ${srcSet}`;
            return sourcesProps;
          } else {
            return [...sourcesProps, {media, srcSet}];
          }
        },
        [],
      )

      .map((props, index) => (
        <source key={`${props.srcSet}${index}`} {...props} />
      ));

  const className = classes(
    styles.Image,
    fit && styles[variation('fit', fit)],
    cornerRadius != null && CORNER_RADIUS_CLASS_MAP.get(cornerRadius),
  );

  const imageMarkup = (
    <img
      src={source}
      alt={description}
      className={className}
      loading={loading && normalizeLoading(loading)}
      aria-hidden={!aspectRatio && accessibilityRole === 'decorative'}
    />
  );

  let content = sourcesMarkup ? (
    <picture>
      {sourcesMarkup}
      {imageMarkup}
    </picture>
  ) : (
    imageMarkup
  );

  content = aspectRatio ? (
    <div
      className={styles.AspectRatio}
      style={{paddingBottom: `calc(100% / ${aspectRatio})`}}
      aria-hidden={accessibilityRole === 'decorative'}
    >
      {content}
    </div>
  ) : (
    content
  );

  return content;
}

function normalizeLoading(
  loading: NonNullable<ImageProps['loading']>,
): JSX.ImgHTMLAttributes['loading'] {
  switch (loading) {
    case 'immediate':
      return 'eager';
    case 'in-viewport':
      return 'lazy';
  }
}
