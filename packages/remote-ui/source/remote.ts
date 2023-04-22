import {
  REMOTE_ID,
  REMOTE_CALLBACK,
  REMOTE_PROPERTIES,
  MUTATION_TYPE_UPDATE_PROPERTY,
} from './constants.ts';
import type {RemoteMutationCallback} from './types.ts';

let id = 0;

export function remoteId(node: Node & {[REMOTE_ID]?: string}) {
  if (node[REMOTE_ID] == null) {
    node[REMOTE_ID] = String(id++);
  }

  return node[REMOTE_ID];
}

export function remoteProperties(
  node: Node & {[REMOTE_PROPERTIES]?: Record<string, unknown>},
) {
  return node[REMOTE_PROPERTIES];
}

export function updateNodeRemoteProperty(
  node: Node,
  property: string,
  value: unknown,
) {
  let properties = (node as any)[REMOTE_PROPERTIES];

  if (properties == null) {
    properties = {};
    (node as any)[REMOTE_PROPERTIES] = properties;
  }

  properties[property] = value;

  const callback = (node as any)[REMOTE_CALLBACK];

  if (callback == null) return;

  callback([[MUTATION_TYPE_UPDATE_PROPERTY, remoteId(node), property, value]]);
}

export function connectNodeToRemoteCallback(
  node: Node,
  callback: RemoteMutationCallback,
) {
  if ((node as any)[REMOTE_CALLBACK] === callback) return;

  (node as any)[REMOTE_CALLBACK] = callback;

  if (node.childNodes) {
    for (let i = 0; i < node.childNodes.length; i++) {
      connectNodeToRemoteCallback(node.childNodes[i]!, callback);
    }
  }
}

export function disconnectNodeFromRemoteCallback(node: Node) {
  if ((node as any)[REMOTE_CALLBACK] == null) return;

  (node as any)[REMOTE_CALLBACK] = undefined;

  if (node.childNodes) {
    for (let i = 0; i < node.childNodes.length; i++) {
      disconnectNodeFromRemoteCallback(node.childNodes[i]!);
    }
  }
}
