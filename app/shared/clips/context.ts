import {createOptionalContext} from '@quilted/quilt/context';
import type {ClipsExtensionPoint} from './extension.ts';

export const ClipsExtensionPointBeingRenderedContext =
  createOptionalContext<ClipsExtensionPoint<any>>();

export const useRenderClipsExtensionPointBeingRendered =
  ClipsExtensionPointBeingRenderedContext.use;
