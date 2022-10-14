export type NodeId = number;

export interface AbstractChannel {
  createElement(
    node: NodeId,
    localName: string,
    ns?: string | null,
    parent?: NodeId,
  ): void;
  setAttribute(
    node: NodeId,
    name: string,
    value: string,
    ns?: string | null,
  ): void;
  removeAttribute(node: NodeId, name: string, ns?: string | null): void;
  createText(node: NodeId, data: string, parent?: NodeId): void;
  setText(node: NodeId, data: string): void;
  insert(parent: NodeId, node: NodeId, before?: NodeId): void;
  remove(node: NodeId): void;
  setProperty(node: NodeId, name: string, value: any): void;
  addListener(node: NodeId, type: string, listener: (event: any) => void): void;
  removeListener(
    node: NodeId,
    type: string,
    listener: (event: any) => void,
  ): void;
}
