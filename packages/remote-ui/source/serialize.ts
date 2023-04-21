import {remoteId, remoteProperties} from './remote.ts';
import type {RemoteNodeSerialization} from './types.ts';

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
