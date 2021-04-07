import {TextBlock, View, Link} from '@lemon/zest';

export function Goodbye() {
  return (
    <View padding={16}>
      <TextBlock>Until we meet again!</TextBlock>
      <Link to="/">Go home</Link>
    </View>
  );
}
