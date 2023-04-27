import {
  MUTATION_TYPE_INSERT_CHILD,
  MUTATION_TYPE_REMOVE_CHILD,
  MUTATION_TYPE_UPDATE_TEXT,
  REMOTE_CALLBACK,
} from './constants.ts';
import {
  remoteId,
  connectNodeToRemoteCallback,
  disconnectNodeFromRemoteCallback,
} from './remote.ts';
import {serializeNode} from './serialize.ts';
import {hooks, type Hooks} from './polyfill/hooks.ts';
import {Window, installWindowGlobals} from './polyfill/Window.ts';

const window = new Window();

installWindowGlobals(window);

hooks.insertChild = (parent, node, index) => {
  const callback = (parent as any)[REMOTE_CALLBACK];
  if (callback == null) return;

  connectNodeToRemoteCallback(node, callback);

  callback([
    [MUTATION_TYPE_INSERT_CHILD, remoteId(parent), serializeNode(node), index],
  ]);
};

hooks.removeChild = (parent, node, index) => {
  const callback = (parent as any)[REMOTE_CALLBACK];
  if (callback == null) return;

  disconnectNodeFromRemoteCallback(node);

  callback([[MUTATION_TYPE_REMOVE_CHILD, remoteId(parent), index]]);
};

hooks.setText = (text, data) => {
  const callback = (text as any)[REMOTE_CALLBACK];
  if (callback == null) return;

  callback([[MUTATION_TYPE_UPDATE_TEXT, remoteId(text), data]]);
};

export {hooks, window, type Hooks};
