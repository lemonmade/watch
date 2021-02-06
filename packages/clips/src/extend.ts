import type {ClipsApi} from './globals';

export const extend: ClipsApi['extend'] = (...args) =>
  self.clips.extend(...args);
