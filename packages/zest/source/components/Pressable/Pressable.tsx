import type {Ref, ComponentChild, RenderableProps, JSX} from 'preact';
import {useMemo} from 'preact/hooks';
import {classes, variation} from '@lemon/css';
import {Link, type NavigateTo} from '@quilted/quilt/navigate';
import {
  resolveSignalOrValue,
  type SignalOrValue,
} from '@quilted/preact-signals';

import systemStyles from '../../system.module.css';
import {useUniqueId} from '../../shared/id.ts';
import {useContainingForm} from '../../shared/forms.ts';
import {
  OverlayContext,
  createOverlayController,
  useContainingOverlay,
  ariaForOverlay,
  type OverlayController,
} from '../../shared/overlays.tsx';

import styles from './Pressable.module.css';

export type PerformAction =
  | 'submit'
  | 'toggleOverlay'
  | 'closeContainingOverlay'
  | 'none';
export type PostPerformAction =
  | 'toggleOverlay'
  | 'closeContainingOverlay'
  | 'none';

export interface PressableProps {
  id?: string;
  className?: string;
  display?: 'block' | 'flex' | 'inlineFlex' | 'grid' | 'inlineGrid';
  inlineAlignment?: 'start' | 'end' | 'center';
  disabled?: SignalOrValue<boolean>;
  selected?: SignalOrValue<boolean>;
  accessibilityLabel?: string;
  to?: NavigateTo;
  target?: 'new' | 'current';
  perform?: PerformAction | false;
  postPerform?: PostPerformAction | false;
  overlay?: ComponentChild | false;
  onPress?(): void | Promise<void>;
}

export function Pressable(
  props: RenderableProps<PressableProps, HTMLButtonElement | HTMLAnchorElement>,
) {
  const {id, ref, overlay} = props;

  const hasOverlay = overlay !== undefined;
  const idOrAutogeneratedId = useUniqueId('Pressable', id);
  const overlayController = useMemo(
    () =>
      hasOverlay
        ? createOverlayController({targetId: idOrAutogeneratedId})
        : undefined,
    [hasOverlay, idOrAutogeneratedId],
  );

  const action = (
    <PressableInternal
      {...props}
      ref={ref}
      id={hasOverlay ? idOrAutogeneratedId : id}
      overlay={overlayController}
    />
  );

  if (overlayController == null) return action;

  return (
    <>
      {action}
      <OverlayContext controller={overlayController}>{overlay}</OverlayContext>
    </>
  );
}

export function PressableInternal({
  ref,
  to,
  className: explicitClassName,
  target,
  children,
  display,
  inlineAlignment,
  disabled,
  selected,
  onPress,
  accessibilityLabel,
  overlay,
  perform,
  postPerform,
  ...rest
}: RenderableProps<
  Omit<PressableProps, 'overlay'> & {overlay?: OverlayController},
  HTMLButtonElement | HTMLAnchorElement
>) {
  const form = useContainingForm();
  const containingOverlay = useContainingOverlay({optional: true});
  const resolvedDisabled =
    (form != null && form.disabled.value) || resolveSignalOrValue(disabled);
  const resolvedSelected = resolveSignalOrValue(selected);

  const className = classes(
    display && systemStyles[variation('display', display)],
    inlineAlignment &&
      systemStyles[variation('inlineAlignment', inlineAlignment)],
    styles.Pressable,
    resolvedDisabled && styles.disabled,
    explicitClassName,
  );

  const handleClick: JSX.MouseEventHandler<
    HTMLAnchorElement | HTMLButtonElement
  > = (event) => {
    if (onPress) {
      event.preventDefault();

      const onPressResult = onPress();

      if (
        (postPerform == null || postPerform === 'closeContainingOverlay') &&
        containingOverlay != null
      ) {
        runWithMaybePromise(onPressResult, () => {
          containingOverlay.close();
        });
      } else if (
        (postPerform == null || postPerform === 'toggleOverlay') &&
        overlay != null
      ) {
        runWithMaybePromise(onPressResult, () => {
          overlay.toggle();
        });
      }
    } else if (
      (perform == null || perform === 'toggleOverlay') &&
      overlay != null
    ) {
      event.preventDefault();
      overlay.toggle();
    } else if (
      (perform == null || perform === 'closeContainingOverlay') &&
      containingOverlay != null
    ) {
      if (to == null) event.preventDefault();
      containingOverlay.close();
    }
  };

  const resolvedRef: Ref<HTMLAnchorElement | HTMLButtonElement> | undefined =
    overlay
      ? (element) => {
          const resolvedElement = (element as any)?.base ?? element;
          overlay!.trigger.value = resolvedElement;

          if (ref == null) return;

          if (typeof ref === 'function') {
            ref(resolvedElement);
          } else {
            ref.current = resolvedElement;
          }
        }
      : ref;

  if (to != null) {
    const externalProps =
      target === 'new' ? {target: '_blank', rel: 'noopener noreferrer'} : {};

    return (
      <Link
        ref={resolvedRef as any}
        to={to}
        className={className}
        onClick={handleClick}
        aria-current={resolvedSelected ? 'page' : undefined}
        {...externalProps}
        {...rest}
      >
        {children}
      </Link>
    );
  }

  const submitButton = perform === 'submit';

  return (
    <button
      ref={resolvedRef as any}
      type={submitButton ? 'submit' : 'button'}
      form={submitButton && form?.nested ? form.id : undefined}
      disabled={resolvedDisabled}
      className={className}
      onClick={handleClick}
      aria-label={accessibilityLabel}
      aria-pressed={resolvedSelected == null ? undefined : resolvedSelected}
      {...ariaForOverlay(overlay)}
      {...rest}
    >
      {children}
    </button>
  );
}

function runWithMaybePromise<T, R>(
  value: T | Promise<T>,
  run: (value: T) => R,
): typeof value extends Promise<any> ? Promise<R> : R {
  if (value == null || typeof (value as any).then !== 'function') {
    return run(value as any) as any;
  }

  return (value as Promise<T>).then((value) => {
    return run(value);
  }) as any;
}
