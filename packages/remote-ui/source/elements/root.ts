import {connectNodeToRemoteCallback} from '../remote.ts';
import {serializeNode} from '../serialize.ts';
import {
  REMOTE_ID,
  REMOTE_CALLBACK,
  ROOT_ID,
  MUTATION_TYPE_INSERT_CHILD,
} from '../constants.ts';
import type {RemoteMutationCallback, RemoteMutationRecord} from '../types.ts';

export class RemoteRootElement extends HTMLElement {
  readonly [REMOTE_ID] = ROOT_ID;

  [REMOTE_CALLBACK]?: RemoteMutationCallback;

  connect(callback: RemoteMutationCallback): void {
    if (this[REMOTE_CALLBACK] === callback) return;

    connectNodeToRemoteCallback(this, callback);

    if (this.childNodes.length > 0) {
      const records: RemoteMutationRecord[] = [];

      for (let i = 0; i < this.childNodes.length; i++) {
        const node = this.childNodes[i]!;

        records.push([
          MUTATION_TYPE_INSERT_CHILD,
          this[REMOTE_ID],
          serializeNode(node),
          i,
        ]);
      }

      callback(records);
    }
  }
}
