import {TextField as UITextField} from '@lemon/zest';
import {
  TEXT_FIELD_RESIZE_KEYWORDS,
  TEXT_FIELD_KEYBOARD_TYPE_KEYWORDS,
  TEXT_FIELD_LABEL_STYLE_KEYWORDS,
  type TextFieldAutocompleteValue,
} from '@watching/design';
import {
  useRenderedChildren,
  createClipsComponentRenderer,
  restrictToAllowedValues,
  wrapEventListenerForCallback,
} from './shared.ts';

export const TextField = createClipsComponentRenderer(
  'ui-text-field',
  function TextField(props) {
    const {element} = props;

    const {label} = useRenderedChildren(props, {slotProps: ['label']});

    const attributes = element.attributes.value;
    const eventListeners = element.eventListeners.value;

    return (
      <UITextField
        disabled={attributes.disabled != null}
        readonly={attributes.readonly != null}
        value={attributes.value}
        minimumLines={
          attributes['minimum-lines']
            ? Number(attributes['minimum-lines'])
            : undefined
        }
        maximumLines={
          attributes['maximum-lines']
            ? Number(attributes['maximum-lines'])
            : undefined
        }
        id={attributes.id}
        keyboardType={restrictToAllowedValues(
          attributes['keyboard-type'],
          TEXT_FIELD_KEYBOARD_TYPE_KEYWORDS,
        )}
        resize={restrictToAllowedValues(
          attributes.resize,
          TEXT_FIELD_RESIZE_KEYWORDS,
        )}
        placeholder={attributes.placeholder}
        autocomplete={attributes.autocomplete as TextFieldAutocompleteValue}
        label={label ?? attributes.label}
        labelStyle={restrictToAllowedValues(
          attributes['label-style'],
          TEXT_FIELD_LABEL_STYLE_KEYWORDS,
        )}
        onInput={
          eventListeners.input
            ? wrapEventListenerForCallback(eventListeners.input)
            : undefined
        }
        onChange={
          eventListeners.change
            ? wrapEventListenerForCallback(eventListeners.change)
            : undefined
        }
      />
    );
  },
);
