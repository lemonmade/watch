import React, {useCallback} from 'react';
import {ReactPropsFromRemoteComponentType} from '@remote-ui/react';

type Props = ReactPropsFromRemoteComponentType<
  typeof import('components').View
>;

export function View({onPress, children}: Props) {
  const handlePress = useCallback(() => {
    onPress?.();
  }, [onPress]);

  return <div onPointerDown={onPress && handlePress}>{children}</div>;
}
