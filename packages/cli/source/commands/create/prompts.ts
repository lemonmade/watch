import {AbortError} from '@quilted/events';
import prompts, {type PromptObject} from 'prompts';

export async function prompt<T extends string | boolean = string>(
  prompt: Omit<PromptObject<'value'>, 'name'>,
) {
  const result = await prompts<'value'>(
    {name: 'value', ...prompt},
    {
      onCancel() {
        throw new AbortError();
      },
    },
  );

  return result.value as T;
}
