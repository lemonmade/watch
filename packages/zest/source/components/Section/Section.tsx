import type {PropsWithChildren} from 'react';

import {
  toHeadingLevel,
  AutoHeadingContext,
  useAutoHeadingLevel,
} from '../../utilities/headings';

import {useViewProps, resolveViewProps, type ViewProps} from '../View';

interface Props extends ViewProps {
  content?: 'header' | 'footer';
}

export function Section({
  content,
  children,
  ...viewProps
}: PropsWithChildren<Props>) {
  const view = useViewProps(viewProps);
  const currentLevel = useAutoHeadingLevel();

  let level = currentLevel ?? 0;
  let Element: 'section' | 'footer' | 'header' = 'section';

  if (content === 'header') {
    Element = 'header';
  } else if (content === 'footer') {
    Element = 'footer';
  } else {
    level += 1;
  }

  return (
    <AutoHeadingContext.Provider value={toHeadingLevel(level)}>
      <Element {...resolveViewProps(view)}>{children}</Element>
    </AutoHeadingContext.Provider>
  );
}
