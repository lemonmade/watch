import {Choice, ChoiceList} from '@lemon/zest';

import type {SpoilerAvoidance as SpoilerAvoidanceValue} from 'graphql/types';

interface Props {
  value: SpoilerAvoidanceValue;
  onChange(value: SpoilerAvoidanceValue): void;
}

export function SpoilerAvoidance({value, onChange}: Props) {
  return (
    <ChoiceList
      value={value.toLowerCase()}
      // @ts-expect-error We know this will be a safe string value
      onChange={(value) => onChange(value.toUpperCase())}
    >
      <Choice value="none">Don’t hide any possible spoilers</Choice>
      <Choice value="upcoming">
        Hide spoilers for episodes you haven’t seen
      </Choice>
      <Choice value="everything">
        Hide anything that might be considered a spoiler
      </Choice>
    </ChoiceList>
  );
}
