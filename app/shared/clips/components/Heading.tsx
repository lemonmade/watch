import {Heading as UiHeading} from '@lemon/zest';
import {createClipsComponent} from './shared.ts';

export const Heading = createClipsComponent(
  'ui-heading',
  function Heading({children, level, divider, accessibilityRole}) {
    return (
      <UiHeading
        level={level}
        divider={divider}
        accessibilityRole={accessibilityRole}
      >
        {children}
      </UiHeading>
    );
  },
);
