import {
  forwardRef,
  type ReactNode,
  type ReactElement,
  type PropsWithChildren,
  useMemo,
} from 'react';
import {classes, variation} from '@lemon/css';
import {
  signal,
  resolveSignalOrValue,
  type SignalOrValue,
  computed,
} from '@watching/react-signals';

import {Icon, type IconSource} from '../Icon';
import {Pressable, type PressableProps} from '../Pressable';

import {useUniqueId} from '../../utilities/id';
import {
  useActionScope,
  useConnectedAccessory,
  ConnectedAccessoryContext,
  ConnectedAccessoryReset,
} from '../../utilities/actions';
import {useMenuController} from '../../utilities/menus';

import type {
  EmphasisValue,
  ActionRoleKeyword,
  BasicAlignmentKeyword,
} from '../../system';

import styles from './Action.module.css';
import {useContainingForm} from '../../utilities/forms';

export type Props = Omit<PressableProps, 'className' | 'display'> & {
  emphasis?: EmphasisValue;
  loading?: SignalOrValue<boolean>;
  icon?: IconSource | ReactElement;
  iconAlignment?: BasicAlignmentKeyword;
  detail?: ReactElement;
  role?: ActionRoleKeyword;
  size?: 'small' | 'base';
  accessory?: ReactNode;
  inlineSize?: 'content' | 'fill';
};

export const Action = forwardRef<
  HTMLButtonElement | HTMLAnchorElement,
  PropsWithChildren<Props>
>(function Action(
  {
    role,
    disabled,
    emphasis,
    icon,
    iconAlignment,
    detail,
    children,
    size,
    accessory,
    loading,
    inlineSize,
    selected,
    id: explicitId,
    overlay,
    perform,
    onPress,
    ...rest
  },
  ref,
) {
  const needsGrid = Boolean(children) && Boolean(detail || icon);
  const connectedAccessory = useConnectedAccessory();
  const menu = useMenuController({required: false});
  const actionScope = useActionScope({required: false});
  const form = useContainingForm();

  let finalEmphasis = emphasis;
  let finalRole = role;

  const hasOnPress = typeof onPress === 'function';

  const {activeActions, performingAction} = useMemo(() => {
    if (!hasOnPress) {
      return {};
    }

    const activeActions = signal(0);
    const performingAction = computed(() => activeActions.value > 0);

    return {activeActions, performingAction};
  }, [hasOnPress]);

  const resolvedSelected = resolveSignalOrValue(selected);
  const resolvedDisabled = resolveSignalOrValue(disabled);
  const resolvedLoading =
    resolveSignalOrValue(loading) ||
    (perform === 'submit'
      ? resolveSignalOrValue(form?.submitting.value)
      : undefined) ||
    performingAction?.value;
  const resolvedInert =
    resolvedLoading ||
    actionScope?.active.value ||
    (connectedAccessory === false ? undefined : connectedAccessory.inert);
  const finalDisabled =
    resolvedDisabled || resolvedLoading || resolvedInert || false;

  const idOrAutogeneratedId = useUniqueId('Action', explicitId);

  if (connectedAccessory) {
    finalEmphasis = connectedAccessory.emphasis ?? finalEmphasis;
    finalRole = connectedAccessory.role ?? finalRole;
  }

  const loadingContent = (loading != null ||
    (perform === 'submit' && form != null) ||
    performingAction != null) && (
    <span className={styles.LoadingContent}>
      <LoadingIcon />
    </span>
  );

  let iconContent: ReactNode = null;
  let needsContentWrapperForLoading = false;

  if (icon) {
    iconContent = resolveIcon(icon);

    if (loadingContent) {
      iconContent = (
        <span className={styles.IconContainer}>
          <span className={styles.Icon}>{iconContent}</span>
          {loadingContent}
        </span>
      );
    }
  } else if (loadingContent) {
    iconContent = loadingContent;
    needsContentWrapperForLoading = true;
  }

  const content = (
    <>
      {iconContent}
      {needsGrid || needsContentWrapperForLoading ? (
        <span className={styles.Content}>{children}</span>
      ) : (
        children
      )}
      {detail}
    </>
  );

  const handlePress: typeof onPress =
    typeof onPress === 'function' && activeActions != null
      ? async (...args) => {
          activeActions.value += 1;

          try {
            const result = await onPress(...args);
            return result;
          } finally {
            activeActions.value -= 1;
          }
        }
      : undefined;

  const handlePressWithActionScope: typeof handlePress =
    handlePress && actionScope
      ? (...args) => actionScope.perform(() => handlePress(...args))
      : handlePress;

  const pressable = (
    <Pressable
      {...(rest as any)}
      ref={ref}
      id={menu || overlay ? idOrAutogeneratedId : explicitId}
      overlay={overlay}
      className={classes(
        styles.Action,
        (finalEmphasis === true || finalEmphasis === 'emphasized') &&
          styles.emphasized,
        finalEmphasis === 'subdued' && styles.subdued,
        finalRole === 'destructive' && styles.destructive,
        menu?.focused.value?.id === idOrAutogeneratedId && styles.focused,
        resolvedSelected && styles.selected,
        resolvedDisabled && styles.disabled,
        resolvedInert && styles.inert,
        resolvedLoading && styles.loading,
        Boolean(icon) && styles.hasIcon,
        iconAlignment && styles[variation('iconAlignment', iconAlignment)],
        Boolean(detail) && styles.hasDetail,
        needsGrid && styles.spacing,
        size && styles[variation('size', size)],
        accessory && styles.connectedMain,
        Boolean(connectedAccessory) && styles.connectedAccessory,
      )}
      disabled={finalDisabled}
      selected={selected}
      display={
        needsGrid
          ? inlineSize === 'fill'
            ? 'grid'
            : 'inlineGrid'
          : inlineSize === 'fill'
          ? 'flex'
          : 'inlineFlex'
      }
      perform={perform}
      onPress={handlePressWithActionScope}
    >
      {content}
    </Pressable>
  );

  return accessory ? (
    <span className={styles.ActionContainer}>
      <ConnectedAccessoryReset>{pressable}</ConnectedAccessoryReset>
      <ConnectedAccessoryContext
        role={finalRole}
        emphasis={finalEmphasis}
        inert={resolvedInert}
      >
        {accessory}
      </ConnectedAccessoryContext>
    </span>
  ) : (
    pressable
  );
});

function resolveIcon(icon: IconSource | ReactElement) {
  return typeof icon === 'string' ? <Icon source={icon} /> : icon;
}

function LoadingIcon() {
  return <span aria-label="Loading" className={styles.LoadingIcon} />;
}
