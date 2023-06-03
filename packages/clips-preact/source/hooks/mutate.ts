import {useApi} from './api.ts';

export function useMutate() {
  return useApi().mutate;
}
