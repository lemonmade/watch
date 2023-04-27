import {remoteId, remoteProperties} from './remote.ts';
import type {RemoteNodeSerialization} from './types.ts';

export function serializeNode(node: Node): RemoteNodeSerialization {
  switch (node.nodeType) {
    // Element
    case 1: {
      return {
        id: remoteId(node),
        type: 1,
        element: (node as Element).localName,
        properties: remoteProperties(node),
        children: Array.from(node.childNodes).map(serializeNode),
      };
    }
    // TextNode
    case 3: {
      return {
        id: remoteId(node),
        type: 3,
        data: (node as Text).data,
      };
    }
    default: {
      throw new Error(
        `Cannot serialize node of type ${
          node.nodeType
        } (${typeof node.nodeType})`,
      );
    }
  }
}
