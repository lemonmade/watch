import type {PropsWithChildren} from 'react';

import {toProps, useDomProps} from '../../system';
import type {SystemProps} from '../../system';
import {
  toHeadingLevel,
  AutoHeadingContext,
  useAutoHeadingLevel,
} from '../../utilities/headings';

interface Props extends SystemProps {
  content?: 'header' | 'footer';
}

export function Section({
  content,
  children,
  ...systemProps
}: PropsWithChildren<Props>) {
  const dom = useDomProps(systemProps);
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
      <Element {...toProps(dom)}>{children}</Element>
    </AutoHeadingContext.Provider>
  );
}
