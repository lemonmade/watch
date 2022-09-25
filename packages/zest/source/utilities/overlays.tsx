import {useMemo, type ReactNode, type PropsWithChildren} from 'react';
import {signal, type Signal, type ReadonlySignal} from '@preact/signals-core';
import {createEmitter, type Emitter} from '@quilted/events';
import {
  createUseContextHook,
  createOptionalContext,
} from '@quilted/react-utilities';

export interface OverlayEvents {
  open: void;
  close: void;
  change: boolean;
}

export type OverlayState = 'open' | 'closed';

export interface OverlayController extends Pick<Emitter<OverlayEvents>, 'on'> {
  readonly id: string;
  readonly state: ReadonlySignal<OverlayState>;
  readonly trigger: Signal<HTMLElement | null>;
  readonly overlay: Signal<HTMLElement | null>;
  readonly target: {readonly id: string};
  open(): void;
  close(): void;
  toggle(): void;
}

const OverlayControllerContext = createOptionalContext<OverlayController>();
export const useOverlayController = createUseContextHook(
  OverlayControllerContext,
);

export interface OverlayContextProps {
  id?: string;
  overlay: ReactNode;
  targetId: string;
}

export function OverlayContext({
  id,
  overlay,
  targetId,
  children,
}: PropsWithChildren<OverlayContextProps>) {
  const controller = useMemo(
    () => createOverlayController({id, targetId}),
    [id, targetId],
  );

  return (
    <>
      <OverlayControllerContext.Provider value={controller}>
        {children}
        {overlay}
      </OverlayControllerContext.Provider>
    </>
  );
}

// eslint-disable-next-line @typescript-eslint/ban-types
export function OverlayContextReset({children}: PropsWithChildren<{}>) {
  return (
    <OverlayControllerContext.Provider value={undefined}>
      {children}
    </OverlayControllerContext.Provider>
  );
}

export interface OverlayControllerOptions {
  id?: string;
  targetId: string;
}

export function createOverlayController({
  targetId,
  id = `${targetId}Overlay`,
}: OverlayControllerOptions) {
  const emitter = createEmitter<OverlayEvents>();
  const trigger: OverlayController['trigger'] = signal(null);
  const overlay: OverlayController['overlay'] = signal(null);
  const state = signal<OverlayState>('closed');

  const controller: OverlayController = {
    id,
    state,
    trigger,
    overlay,
    on: emitter.on,
    target: {id: targetId},
    open() {
      if (state.value === 'open') return;

      state.value = 'open';
      emitter.emit('open');
      emitter.emit('change', true);
    },
    close() {
      if (state.value === 'closed') return;

      state.value = 'closed';
      emitter.emit('close');
      emitter.emit('change', false);
    },
    toggle() {
      return state.value === 'open' ? controller.close() : controller.open();
    },
  };

  return controller;
}

export function ariaForOverlay(overlay?: OverlayController) {
  if (overlay == null) return undefined;

  const {id, state} = overlay;

  return {
    'aria-expanded': state.value === 'open',
    'aria-controls': id,
    'aria-owns': id,
  };
}
