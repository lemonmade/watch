import type {RemoteNodeSerialization} from './types.ts';

let id = 0;

export function serializeNode(node: Node): RemoteNodeSerialization {
  switch (node.nodeType) {
    case Node.TEXT_NODE: {
      return {
        id: serializedId(node),
        type: 3,
        data: (node as Text).data,
      };
    }
    case Node.ELEMENT_NODE: {
      return {
        id: serializedId(node),
        type: 0,
        element: (node as Element).localName,
        properties: {},
        children: Array.from(node.childNodes).map(serializeNode),
      };
    }
    default: {
      throw new Error(`Cannot serialize node of type ${node.nodeType}`);
    }
  }
}

const SERIALIZED_ID = Symbol.for('remote.id');

export function serializedId(node: Node & {[SERIALIZED_ID]?: string}) {
  if (node[SERIALIZED_ID] == null) {
    node[SERIALIZED_ID] = String(id++);
  }

  return node[SERIALIZED_ID];
}
