import {Heading as UiHeading} from '@lemon/zest';
import {type ReactComponentPropsForClipsElement} from './shared.ts';

export function Heading({
  children,
  level,
  divider,
  accessibilityRole,
}: ReactComponentPropsForClipsElement<'ui-heading'>) {
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
