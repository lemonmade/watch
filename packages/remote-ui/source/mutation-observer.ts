import {remoteId, serializeNode} from './serialize.ts';
import {
  REMOTE_CALLBACK,
  MUTATION_TYPE_INSERT_CHILD,
  MUTATION_TYPE_REMOVE_CHILD,
  MUTATION_TYPE_UPDATE_TEXT,
  MUTATION_TYPE_UPDATE_PROPERTY,
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

          record.removedNodes.forEach(() => {
            remoteRecords.push([
              MUTATION_TYPE_REMOVE_CHILD,
              targetId,
              position,
            ]);
          });

          record.addedNodes.forEach((node, index) => {
            // TODO: iterate through descendants
            (node as any)[REMOTE_CALLBACK] = callback;

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
        } else if (record.type === 'attributes') {
          remoteRecords.push([
            MUTATION_TYPE_UPDATE_PROPERTY,
            targetId,
            record.attributeName!,
            (record.target as Element).getAttribute(record.attributeName!),
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
      attributes: true,
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
