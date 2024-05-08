import type {RenderableProps} from 'preact';
import {createOptionalContext} from '@quilted/preact-context';

export type Display = 'block' | 'inline';

const ImplicitDisplayContext = createOptionalContext<Display>();

export const useImplicitDisplay = () =>
  ImplicitDisplayContext.use({optional: true});

export function ImplicitDisplay({
  display,
  children,
}: RenderableProps<{display?: Display}>) {
  return (
    <ImplicitDisplayContext.Provider value={display}>
      {children}
    </ImplicitDisplayContext.Provider>
  );
}
