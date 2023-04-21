import {REMOTE_ID, REMOTE_PROPERTIES} from './constants.ts';
import type {RemoteNodeSerialization} from './types.ts';

let id = 0;

export function serializeNode(node: Node): RemoteNodeSerialization {
  switch (node.nodeType) {
    case Node.TEXT_NODE: {
      return {
        id: remoteId(node),
        type: 3,
        data: (node as Text).data,
      };
    }
    case Node.ELEMENT_NODE: {
      return {
        id: remoteId(node),
        type: 0,
        element: (node as Element).localName,
        properties: remoteProperties(node),
        children: Array.from(node.childNodes).map(serializeNode),
      };
    }
    default: {
      throw new Error(`Cannot serialize node of type ${node.nodeType}`);
    }
  }
}

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
