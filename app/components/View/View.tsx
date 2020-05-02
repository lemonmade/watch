import React, {ReactNode, useCallback} from 'react';

interface Props {
  children?: ReactNode;
  onPress?(): void | Promise<void>;
}

export function View({onPress, children}: Props) {
  const handlePress = useCallback(() => {
    onPress?.();
  }, [onPress]);

  return <div onPointerDown={onPress && handlePress}>{children}</div>;
}
