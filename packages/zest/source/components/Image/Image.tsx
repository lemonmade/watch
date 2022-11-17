/* eslint react/jsx-no-useless-fragment: off */

import {PropsWithChildren, ImgHTMLAttributes} from 'react';
import {classes, variation} from '@lemon/css';

import {View} from '../View';
import {type PropsForClipsComponent} from '../../utilities/clips';

import styles from './Image.module.css';

type Props = PropsForClipsComponent<'Image'>;

export enum Media {
  Medium = '(min-width: 601px)',
  Large = '(min-width: 1201px)',
}

const MEDIA_MAP = {
  small: undefined,
  medium: Media.Medium,
  large: Media.Large,
};

export function Image({
  source,
  sources,
  description = '',
  accessibilityRole,
  fit,
  loading,
  aspectRatio,
}: Props) {
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

  const className = classes(styles.Image, fit && styles[variation('fit', fit)]);

  return (
    <MaybeHiddenForA11y condition={accessibilityRole === 'decorative'}>
      <MaybeAspectRatio
        condition={aspectRatio != null}
        aspectRatio={aspectRatio}
      >
        <MaybePicture condition={sourcesMarkup != null}>
          {sourcesMarkup}
          <img
            src={source}
            alt={description}
            className={className}
            loading={loading && normalizeLoading(loading)}
          />
        </MaybePicture>
      </MaybeAspectRatio>
    </MaybeHiddenForA11y>
  );
}

function normalizeLoading(
  loading: NonNullable<Props['loading']>,
): ImgHTMLAttributes<HTMLImageElement>['loading'] {
  switch (loading) {
    case 'immediate':
      return 'eager';
    case 'in-viewport':
      return 'lazy';
  }
}

type MaybeProps<T = Record<string, unknown>> = PropsWithChildren<
  T & {condition: boolean}
>;

function MaybeHiddenForA11y({children, condition}: MaybeProps) {
  return condition ? (
    <View accessibilityVisibility="hidden">{children}</View>
  ) : (
    <>{children}</>
  );
}

function MaybeAspectRatio({
  children,
  condition,
  aspectRatio,
}: MaybeProps<{aspectRatio?: number}>) {
  return condition ? (
    <div
      className={styles.AspectRatio}
      style={{paddingBottom: `calc(100% / ${aspectRatio})`}}
    >
      {children}
    </div>
  ) : (
    <>{children}</>
  );
}

function MaybePicture({children, condition}: MaybeProps) {
  return condition ? <picture>{children}</picture> : <>{children}</>;
}
