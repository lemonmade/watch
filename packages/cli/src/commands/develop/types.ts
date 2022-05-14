import type {LocalExtension} from '../../utilities/app';

export type BuildState =
  | {
      status: 'success';
      id: number;
      startedAt: number;
      duration: number;
      errors?: never;
    }
  | {
      status: 'error';
      id: number;
      startedAt: number;
      duration: number;
      errors: {message: string; stack?: string}[];
    }
  | {
      status: 'building';
      id: number;
      startedAt: number;
      duration?: never;
      errors?: never;
    };

export interface Builder {
  watch(
    extension: Pick<LocalExtension, 'id'>,
    options?: {signal?: AbortSignal},
  ): AsyncGenerator<BuildState, void, void>;
}
