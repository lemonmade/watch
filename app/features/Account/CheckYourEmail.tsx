import {usePerformanceNavigation} from '@quilted/quilt';
import {View, TextBlock} from '@lemon/zest';

export default function CheckYourEmail() {
  usePerformanceNavigation({state: 'complete'});

  return (
    <View padding="base">
      <TextBlock>Check your email!</TextBlock>
    </View>
  );
}
