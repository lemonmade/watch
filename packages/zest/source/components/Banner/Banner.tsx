import type {PropsWithChildren} from 'react';
import {View} from '@lemon/basics';

interface Props {
  status?: 'information' | 'error';
}

export function Banner({status, children}: PropsWithChildren<Props>) {
  const background =
    status === 'error' ? 'rgb(105, 10, 10)' : 'rgb(40, 50, 86)';
  const border =
    status === 'error' ? 'rgb(196, 26, 26)' : '1px solid rgb(108, 127, 197)';

  return (
    <View cornerRadius={4} padding={16} background={background} border={border}>
      {children}
    </View>
  );
}
