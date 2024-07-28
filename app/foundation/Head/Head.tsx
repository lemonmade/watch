import {Title, Viewport, Favicon, ThemeColor} from '@quilted/quilt/html';

export function Head() {
  return (
    <>
      <Title>Watch</Title>
      <Viewport />
      <Favicon emoji="📺" />
      <ThemeColor value="rgb(26, 21, 34)" />
    </>
  );
}
