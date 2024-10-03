import {Button as UIButton, type ButtonProps} from '@lemon/zest';

import {useClipsExtensionPointBeingRendered} from '../context.ts';
import type {ClipsExtensionPoint} from '../extension.ts';

import {
  createClipsComponentRenderer,
  useRenderedChildren,
  wrapEventListenerForCallback,
} from './shared.ts';

export const Button = createClipsComponentRenderer(
  'ui-button',
  function Button(props) {
    const extension = useClipsExtensionPointBeingRendered();

    const {overlay, children} = useRenderedChildren(props, {
      slotProps: ['overlay'],
    });

    const attributes = props.element.attributes.value;
    const events = props.element.eventListeners.value;

    const action = parseAction(attributes.action);

    let to: string | undefined = attributes.to;
    let onPress: ButtonProps['onPress'] | undefined = undefined;

    switch (action.type) {
      case 'auto': {
        onPress = events.press
          ? wrapEventListenerForCallback(events.press)
          : undefined;
        break;
      }
      case 'navigate': {
        to = action.url;
        break;
      }
      case 'mutate': {
        onPress = createMutateAction(action.mutation, extension);
        break;
      }
    }

    return (
      <UIButton
        to={to}
        disabled={attributes.disabled != null}
        onPress={onPress}
        overlay={overlay}
      >
        {children}
      </UIButton>
    );
  },
);

function parseAction(action: string | undefined) {
  if (action == null) return {type: 'auto' as const};

  if (action.startsWith('navigate(') && action.endsWith(')')) {
    return {type: 'navigate' as const, url: action.slice(8, -1)};
  }

  if (action.startsWith('mutate(') && action.endsWith(')')) {
    return {type: 'mutate' as const, mutation: action.slice(7, -1)};
  }

  return {type: 'auto' as const};
}

function createMutateAction(
  mutation: string,
  extensionPoint: ClipsExtensionPoint<any>,
) {
  return async function mutate() {
    console.log(`TODO: run mutation "${mutation}"`, extensionPoint);
  };
}
