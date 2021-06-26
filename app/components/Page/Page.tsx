import {useEffect} from 'react';
import type {PropsWithChildren, ReactNode} from 'react';

import {View} from '@lemon/zest';
import {usePageDelegate} from 'utilities/page';

interface Props {
  heading: ReactNode;
  actions?: ReactNode;
}

export function Page({children, actions, heading}: PropsWithChildren<Props>) {
  const delegate = usePageDelegate();

  useEffect(
    () => delegate.claim({heading, actions}),
    [heading, actions, delegate],
  );

  return <View padding="base">{children}</View>;
}
