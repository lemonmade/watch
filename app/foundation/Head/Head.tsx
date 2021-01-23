import {useTitle, useMeta} from '@quilted/quilt/html';

export function Head() {
  useTitle('Watch');

  useMeta({
    name: 'viewport',
    content:
      'width=device-width, initial-scale=1.0, height=device-height, user-scalable=0',
  });

  return null;
}
