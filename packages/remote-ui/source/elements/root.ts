import {REMOTE_ID, REMOTE_CALLBACK, ROOT_ID} from '../constants.ts';
import type {RemoteMutationCallback} from '../types.ts';

export class RemoteRootElement extends HTMLElement {
  readonly [REMOTE_ID] = ROOT_ID;
  [REMOTE_CALLBACK]?: RemoteMutationCallback;
}
