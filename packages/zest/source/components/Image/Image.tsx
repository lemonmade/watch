/* eslint react/jsx-no-useless-fragment: off */

import {ImgHTMLAttributes} from 'react';
import {classes, variation} from '@lemon/css';

import systemStyles from '../../system.module.css';
import {type ReactComponentPropsForClipsElement} from '../../shared/clips.ts';

import styles from './Image.module.css';

export type ImageProps = ReactComponentPropsForClipsElement<'ui-image'>;

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
  ['base', systemStyles.cornerRadiusBase],
  [true, systemStyles.cornerRadiusBase],
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
        // eslint-disable-next-line react/no-array-index-key
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
): ImgHTMLAttributes<HTMLImageElement>['loading'] {
  switch (loading) {
    case 'immediate':
      return 'eager';
    case 'in-viewport':
      return 'lazy';
  }
}
