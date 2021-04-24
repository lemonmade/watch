import type {PropsWithChildren} from 'react';

import {toProps, useDomProps} from '../../system';
import type {SystemProps} from '../../system';
import {
  AutoHeadingContext,
  useAutoHeadingLevel,
} from '../../utilities/headings';
import type {HeadingLevel} from '../../utilities/headings';

interface Props extends SystemProps {}

export function Section({children, ...systemProps}: PropsWithChildren<Props>) {
  const dom = useDomProps(systemProps);
  const currentLevel = useAutoHeadingLevel();

  const level = ((currentLevel ?? 0) + 1) as HeadingLevel;

  return (
    <AutoHeadingContext.Provider value={level}>
      <section {...toProps(dom)}>{children}</section>
    </AutoHeadingContext.Provider>
  );
}
