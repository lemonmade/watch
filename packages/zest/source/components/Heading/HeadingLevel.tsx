import type {RenderableProps} from 'preact';
import {
  useHeadingLevel,
  toHeadingLevel,
  HeadingLevelContext,
  type HeadingLevel,
} from './shared.ts';

export function HeadingLevelReset({
  level = 1,
  children,
}: RenderableProps<{level?: HeadingLevel}>) {
  return (
    <HeadingLevelContext.Provider value={level}>
      {children}
    </HeadingLevelContext.Provider>
  );
}

export function NestedHeadingLevel({children}: RenderableProps<{}>) {
  return (
    <HeadingLevelContext.Provider value={toHeadingLevel(useHeadingLevel() + 1)}>
      {children}
    </HeadingLevelContext.Provider>
  );
}
