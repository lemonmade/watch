import {useApi} from './api.ts';

export function useQuery<Data = Record<string, unknown>>() {
  return useApi().query.value as Data;
}
