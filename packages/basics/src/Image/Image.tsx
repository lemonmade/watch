/* eslint react/jsx-no-useless-fragment: off */

import {PropsWithChildren, ImgHTMLAttributes} from 'react';
import {classes, variation} from '@lemon/css';

import {View} from '../View';
import styles from './Image.css';

type ViewportSize = 'small' | 'medium' | 'large';
type Fit = 'cover' | 'contain';
type Resolution = 1 | 1.3 | 1.5 | 2 | 2.6 | 3 | 3.5 | 4;
type Loading = 'immediate' | 'in-viewport';

interface Props {
  source: string;
  sources?: Source[];
  description?: string;
  loading?: Loading;
  bordered?: boolean;
  aspectRatio?: number;
  fit?: Fit;
  decorative?: boolean;
}

interface Source {
  source: string;
  viewportSize?: ViewportSize;
  resolution?: Resolution;
}

interface SourceProps {
  media?: string;
  srcSet: string;
}

export enum Media {
  Small = '(max-width: 600px)',
  Medium = '(max-width: 1200px)',
  Large = '(min-width: 1201px)',
}

const MEDIA_MAP = {
  small: Media.Small,
  medium: Media.Medium,
  large: Media.Large,
};

export function Image({
  source,
  sources,
  description = '',
  fit,
  bordered,
  loading,
  aspectRatio,
  decorative,
}: Props) {
  const initialValue: SourceProps[] = [];

  const sourcesMarkup =
    sources &&
    sources
      .reduce((sourcesProps, {source, viewportSize, resolution}) => {
        const media = viewportSize && MEDIA_MAP[viewportSize];
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
      }, initialValue)
      // eslint-disable-next-line react/jsx-key
      .map((props) => <source {...props} />);

  const className = classes(
    styles.Image,
    bordered && styles.bordered,
    fit && styles[variation('fit', fit)],
  );

  return (
    <MaybeHiddenForA11y condition={decorative === true}>
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

type MaybeProps<T = {}> = PropsWithChildren<T & {condition: boolean}>;

function MaybeHiddenForA11y({children, condition}: MaybeProps) {
  return condition ? (
    <View accessibility="hidden">{children}</View>
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
      className={styles.aspectRatio}
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
