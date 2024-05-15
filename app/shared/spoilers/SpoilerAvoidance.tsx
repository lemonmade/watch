import {Choice, ChoiceList} from '@lemon/zest';
import {
  isSignal,
  resolveSignalOrValue,
  type SignalOrValue,
} from '@quilted/quilt/signals';

import {type SpoilerAvoidance as SpoilerAvoidanceValue} from '~/graphql/types';

interface Props {
  value: SignalOrValue<SpoilerAvoidanceValue>;
  onChange?(value: SpoilerAvoidanceValue): void;
}

export function SpoilerAvoidance({value, onChange}: Props) {
  const valueIsSignal = isSignal(value);
  const resolvedValue = resolveSignalOrValue(value);
  const handleChange =
    onChange || valueIsSignal
      ? (newValue: string) => {
          const newSpoilerAvoidance =
            newValue.toUpperCase() as SpoilerAvoidanceValue;

          if (onChange) {
            onChange(newSpoilerAvoidance);
          } else {
            (value as any).value = newSpoilerAvoidance;
          }
        }
      : undefined;

  return (
    <ChoiceList
      value={resolvedValue.toLowerCase()}
      onChange={handleChange}
      spacing="base"
    >
      <Choice
        value="none"
        helpText="We’ll never hide any details, even for episodes you might not have seen yet."
      >
        Don’t hide any possible spoilers
      </Choice>
      <Choice
        value="upcoming"
        helpText="We’ll show you details about the next episode, but we’ll hide details about any episodes after that."
      >
        Hide spoilers for episodes you haven’t seen
      </Choice>
      <Choice
        value="everything"
        helpText="We’ll hide the details about every episode you might not have seen yet."
      >
        Hide anything that might be considered a spoiler
      </Choice>
    </ChoiceList>
  );
}
