import React, {useState} from 'react';

interface Props {}

export function Rating(_props: Props) {
  const [value, setValue] = useState('Five');
  return (
    <div
      onPointerEnter={() => setValue('One')}
      onPointerLeave={() => setValue('Five')}
    >
      {value} stars!
    </div>
  );
}
