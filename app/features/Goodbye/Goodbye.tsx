import {TextBlock, View, Action} from '@lemon/zest';

export function Goodbye() {
  return (
    <View padding={16}>
      <TextBlock>Until we meet again!</TextBlock>
      <Action to="/">Go home</Action>
    </View>
  );
}
