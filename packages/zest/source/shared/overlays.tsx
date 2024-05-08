import type {RenderableProps} from 'preact';
import {signal, type Signal, type ReadonlySignal} from '@preact/signals-core';
import {EventEmitter} from '@quilted/events';
import {createOptionalContext} from '@quilted/preact-context';

export interface OverlayEvents {
  open: void;
  close: void;
  change: boolean;
}

export type OverlayState = 'open' | 'closed';

export interface OverlayController
  extends Pick<EventEmitter<OverlayEvents>, 'on' | 'once'> {
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
export const useContainingOverlay = OverlayControllerContext.use;

export interface OverlayContextProps {
  controller: OverlayController;
}

export function OverlayContext({
  controller,
  children,
}: RenderableProps<OverlayContextProps>) {
  return (
    <>
      <OverlayControllerContext.Provider value={controller}>
        {children}
      </OverlayControllerContext.Provider>
    </>
  );
}

export function OverlayContextReset({children}: RenderableProps<{}>) {
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
  const emitter = new EventEmitter<OverlayEvents>();
  const trigger: OverlayController['trigger'] = signal(null);
  const overlay: OverlayController['overlay'] = signal(null);
  const state = signal<OverlayState>('closed');

  const controller: OverlayController = {
    id,
    state,
    trigger,
    overlay,
    on: emitter.on,
    once: emitter.once,
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
