import {type PropsWithChildren} from 'react';
import {
  useHeadingLevel,
  toHeadingLevel,
  HeadingLevelContext,
  type HeadingLevel,
} from './shared';

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

// eslint-disable-next-line @typescript-eslint/ban-types
export function NestedHeadingLevel({children}: PropsWithChildren<{}>) {
  return (
    <HeadingLevelContext.Provider value={toHeadingLevel(useHeadingLevel() + 1)}>
      {children}
    </HeadingLevelContext.Provider>
  );
}
