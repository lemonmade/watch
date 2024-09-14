import {createContext} from 'preact';
import {useContext} from 'preact/hooks';

import type {HeadingLevel, HeadingAccessibilityRoleKeyword} from '@watching/design';

export type {HeadingLevel, HeadingAccessibilityRoleKeyword};

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
  level?: HeadingLevel | 'auto';
  accessibilityRole?: HeadingAccessibilityRoleKeyword;
} = {}) {
  const level = useHeadingLevel();
  const role =
    accessibilityRole ??
    (explicitLevel == null || explicitLevel === level
      ? 'heading'
      : 'presentation');

  const Element =
    role === 'presentation' ? 'p' : (`h${toHeadingLevel(level)}` as const);

  let resolvedLevel =
    (explicitLevel === 'auto' ? undefined : explicitLevel) ?? level;

  return {Element, level: resolvedLevel} as const;
}
