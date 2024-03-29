import {type PropsWithChildren} from 'react';
import {
  useHeadingLevel,
  toHeadingLevel,
  HeadingLevelContext,
  type HeadingLevel,
} from './shared.ts';

export function HeadingLevelReset({
  level = 1,
  children,
}: PropsWithChildren<{level?: HeadingLevel}>) {
  return (
    <HeadingLevelContext.Provider value={level}>
      {children}
    </HeadingLevelContext.Provider>
  );
}

export function NestedHeadingLevel({children}: PropsWithChildren<{}>) {
  return (
    <HeadingLevelContext.Provider value={toHeadingLevel(useHeadingLevel() + 1)}>
      {children}
    </HeadingLevelContext.Provider>
  );
}
