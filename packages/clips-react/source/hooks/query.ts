import {useApi} from './api';

export function useQuery<Data = Record<string, unknown>>() {
  return useApi().query.value as Data;
}
