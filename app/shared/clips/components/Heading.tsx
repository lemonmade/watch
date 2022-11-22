import {Heading as UiHeading} from '@lemon/zest';
import {type PropsForClipsComponent} from './shared';

export function Heading({
  children,
  level,
  divider,
  accessibilityRole,
}: PropsForClipsComponent<'Heading'>) {
  return (
    <UiHeading
      level={level}
      divider={divider}
      accessibilityRole={accessibilityRole}
    >
      {children}
    </UiHeading>
  );
}
