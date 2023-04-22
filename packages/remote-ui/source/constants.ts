export const NODE_TYPE_ELEMENT = 0;
export const NODE_TYPE_TEXT = 3;
export const NODE_TYPE_ROOT = 9;

export const MUTATION_TYPE_INSERT_CHILD = 0;
export const MUTATION_TYPE_REMOVE_CHILD = 1;
export const MUTATION_TYPE_UPDATE_TEXT = 2;
export const MUTATION_TYPE_UPDATE_PROPERTY = 3;

export const REMOTE_ID = Symbol.for('remote.id');
export const REMOTE_CALLBACK = Symbol.for('remote.callback');
export const REMOTE_PROPERTIES = Symbol.for('remote.properties');
export const ROOT_ID = '_root';
