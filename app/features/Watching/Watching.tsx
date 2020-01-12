import React, {useState} from 'react';
import {View} from '../../components';

interface Props {}

export function Watching(_: Props) {
  const [count, setCount] = useState(0);
  return (
    <View
      onPress={() => {
        setCount(count + 1);
      }}
    >
      Hello from the watching page! Clicked {count} times.
    </View>
  );
}
