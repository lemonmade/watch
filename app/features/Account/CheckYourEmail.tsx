import {usePerformanceNavigation} from '@quilted/quilt/performance';
import {View, TextBlock} from '@lemon/zest';

export default function CheckYourEmail() {
  usePerformanceNavigation();

  return (
    <View padding>
      <TextBlock>Check your email!</TextBlock>
    </View>
  );
}
