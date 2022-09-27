import {createContext, useContext} from 'react';

export type HeadingLevel = 1 | 2 | 3 | 4 | 5 | 6;

export const AutoHeadingContext = createContext<HeadingLevel>(1);

export function useAutoHeadingLevel() {
  return useContext(AutoHeadingContext);
}

export function toHeadingLevel(level: number) {
  return Math.min(Math.max(level, 1), 6) as HeadingLevel;
}
