import {
  remoteId,
  connectNodeToRemoteCallback,
  disconnectNodeFromRemoteCallback,
} from './remote.ts';
import {serializeNode} from './serialize.ts';
import {
  MUTATION_TYPE_INSERT_CHILD,
  MUTATION_TYPE_REMOVE_CHILD,
  MUTATION_TYPE_UPDATE_TEXT,
} from './constants.ts';
import type {RemoteMutationCallback, RemoteMutationRecord} from './types';

export class RemoteMutationObserver extends MutationObserver {
  constructor(callback: RemoteMutationCallback) {
    super((records) => {
      const remoteRecords: RemoteMutationRecord[] = [];

      for (const record of records) {
        const targetId = remoteId(record.target);

        if (record.type === 'childList') {
          const position = record.previousSibling
            ? indexOf(record.previousSibling, record.target.childNodes) + 1
            : 0;

          record.removedNodes.forEach((node) => {
            disconnectNodeFromRemoteCallback(node);

            remoteRecords.push([
              MUTATION_TYPE_REMOVE_CHILD,
              targetId,
              position,
            ]);
          });

          record.addedNodes.forEach((node, index) => {
            connectNodeToRemoteCallback(node, callback);

            remoteRecords.push([
              MUTATION_TYPE_INSERT_CHILD,
              targetId,
              serializeNode(node),
              position + index,
            ]);
          });
        } else if (record.type === 'characterData') {
          remoteRecords.push([
            MUTATION_TYPE_UPDATE_TEXT,
            targetId,
            record.target.textContent ?? '',
          ]);
        }
      }

      callback(remoteRecords);
    });
  }

  observe(target: Node, options?: MutationObserverInit) {
    super.observe(target, {
      subtree: true,
      childList: true,
      attributes: false,
      characterData: true,
      ...options,
    });
  }
}

function indexOf(node: Node, list: NodeList) {
  for (let i = 0; i < list.length; i++) {
    if (list[i] === node) return i;
  }

  return -1;
}
