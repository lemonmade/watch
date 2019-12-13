import React, {useEffect} from 'react';
import {Rating} from '@lemon/zest';

interface Props {}

export function App({}: Props) {
  useEffect(() => {
    (async () => {
      const fetched = await fetch('http://localhost:8041/api', {
        method: 'POST',
        headers: {Accept: 'application/json'},
      });
      console.log(await fetched.json());
    })();
  });

  return (
    <>
      <div>Hello world!</div>
      <Rating />
    </>
  );
}
