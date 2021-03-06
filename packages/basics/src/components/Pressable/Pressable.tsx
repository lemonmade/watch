import type {MouseEventHandler, PropsWithChildren} from 'react';
import {variation} from '@lemon/css';

import {useDomProps, Keyword, toProps} from '../../system';
import type {KeywordValue, SystemProps} from '../../system';
import {useImplicitAction, ariaForAction} from '../../utilities/actions';
import type {ImplicitActionType} from '../../utilities/actions';

import styles from './Pressable.module.css';

export type AlignKeyword = 'start' | 'center' | 'end';

interface Props extends SystemProps {
  align?: AlignKeyword | KeywordValue<AlignKeyword>;
  implicitAction?:
    | boolean
    | ImplicitActionType
    | KeywordValue<ImplicitActionType>;
  onPress?(): void;
}

export function Pressable({
  onPress,
  children,
  align,
  implicitAction = onPress == null,
  ...systemProps
}: PropsWithChildren<Props>) {
  const dom = useDomProps(systemProps);
  const implicitActionFromContext = useImplicitAction();

  dom.addClassName(styles.Pressable);

  if (align) {
    dom.addClassName(
      styles[
        variation('align', Keyword.test(align) ? Keyword.parse(align) : align)
      ],
    );
  }

  let implicitOnClick: (() => void) | undefined;

  if (implicitActionFromContext) {
    let parsedImplicitAction: boolean | ImplicitActionType;

    if (typeof implicitAction === 'boolean') {
      parsedImplicitAction = implicitAction;
    } else if (Keyword.test(implicitAction)) {
      parsedImplicitAction = Keyword.parse(implicitAction);
    } else {
      parsedImplicitAction = implicitAction;
    }

    if (
      parsedImplicitAction === true ||
      implicitActionFromContext.type === parsedImplicitAction
    ) {
      implicitOnClick = () => {
        implicitActionFromContext.perform();
      };
    }
  }

  let onClick: MouseEventHandler<HTMLButtonElement> | undefined;

  if (onPress) {
    onClick = () => {
      implicitOnClick?.();
      onPress();
    };
  } else if (implicitOnClick) {
    onClick = implicitOnClick;
  }

  return (
    <button
      {...toProps(dom)}
      type="button"
      onClick={onClick}
      {...ariaForAction(implicitActionFromContext)}
    >
      {children}
    </button>
  );
}
