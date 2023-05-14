import {View as UiView} from '@lemon/zest';
import {createClipsComponent} from './shared.ts';

export const View = createClipsComponent(
  'ui-view',
  function View({
    children,
    padding,
    paddingInlineStart,
    paddingInlineEnd,
    paddingBlockStart,
    paddingBlockEnd,
  }) {
    return (
      <UiView
        padding={padding}
        paddingInlineStart={paddingInlineStart}
        paddingInlineEnd={paddingInlineEnd}
        paddingBlockStart={paddingBlockStart}
        paddingBlockEnd={paddingBlockEnd}
      >
        {children}
      </UiView>
    );
  },
);
