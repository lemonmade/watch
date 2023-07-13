import type {EpisodeSelector, SeasonSelector} from '@watching/api';
import {Text, type TextProps} from '@lemon/zest';

export interface MediaSelectorTextProps extends TextProps {
  children: EpisodeSelector | SeasonSelector;
}

export function MediaSelectorText({children, ...rest}: MediaSelectorTextProps) {
  return (
    <Text transform="uppercase" numericVariant="tabular-numbers" {...rest}>
      {children}
    </Text>
  );
}
