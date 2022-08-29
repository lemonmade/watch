import type {PropsWithChildren} from 'react';
import {View} from '@lemon/basics';

interface Props {
  status?: 'information' | 'error';
}

export function Banner({status, children}: PropsWithChildren<Props>) {
  const background =
    status === 'error' ? 'rgb(105, 10, 10)' : 'rgb(40, 50, 86)';

  return (
    <View cornerRadius={4} padding="base" background={background} border="base">
      {children}
    </View>
  );
}
