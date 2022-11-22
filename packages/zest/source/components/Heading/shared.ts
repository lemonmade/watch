import {createContext, useContext} from 'react';

import type {HeadingLevel, HeadingAccessibilityRole} from '@watching/clips';

export type {HeadingLevel, HeadingAccessibilityRole};

export const HeadingLevelContext = createContext<HeadingLevel>(1);

export function useHeadingLevel() {
  return useContext(HeadingLevelContext);
}

export function toHeadingLevel(level: number) {
  return Math.min(Math.max(level, 1), 6) as HeadingLevel;
}

export function useHeadingDomDetails({
  level: explicitLevel,
  accessibilityRole,
}: {
  level?: HeadingLevel;
  accessibilityRole?: HeadingAccessibilityRole;
}) {
  const level = useHeadingLevel();
  const role =
    accessibilityRole ??
    (explicitLevel == null || explicitLevel === level
      ? 'heading'
      : 'presentation');

  const Element =
    role === 'presentation' ? 'p' : (`h${toHeadingLevel(level)}` as const);

  return {Element, level: explicitLevel ?? level} as const;
}
