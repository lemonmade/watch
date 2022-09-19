import {useState, useRef, useEffect, type PropsWithChildren} from 'react';
import {classes, variation} from '@lemon/css';

import {
  ImplicitActionReset,
  ConnectedAccessoryReset,
} from '../../utilities/actions';
import {usePopoverController} from '../../utilities/popovers';

import styles from './Popover.module.css';

interface PopoverProps {
  blockAttachment?: 'start' | 'end';
  inlineAttachment?: 'start' | 'center' | 'end';
}

export function Popover({
  children,
  blockAttachment = 'end',
  inlineAttachment = 'center',
}: PropsWithChildren<PopoverProps>) {
  const ref = useRef<HTMLDivElement>(null);
  const controller = usePopoverController();
  const [rendered, setRendered] = useState(false);

  const helpers = useRef<any>({});

  useEffect(() => {
    const setState = (state: string) => {
      if (ref.current) {
        ref.current.dataset.state = state;
      }
    };

    const unlisten = controller.subscribe(() => {
      switch (controller.state) {
        case 'preparing': {
          setRendered(true);
          break;
        }
        case 'inactive': {
          setRendered(false);
          break;
        }
        case 'open': {
          setState('open');
          break;
        }
      }
    });

    const clearSheet = controller.setSheet({
      measure() {
        const {current: sheet} = ref;

        if (sheet == null) {
          throw new Error('No sheet!');
        }

        return {
          x: sheet.offsetLeft,
          y: sheet.offsetTop,
          inline: sheet.offsetWidth,
          block: sheet.offsetHeight,
        };
      },
      contains(element) {
        return (
          (ref.current === element || ref.current?.contains(element)) ?? false
        );
      },
      update(geometry) {
        const {current: sheet} = ref;

        if (sheet == null) {
          return;
        }

        // TODO (CS): Need an "implicit sheet" to be relative to, for modals/ sheets in sheets
        // const windowWidth = window.innerWidth;

        // const relativePosition =
        //   (geometry.trigger.left + geometry.trigger.width / 2) /
        //   window.innerWidth;

        let inlineStart: number;
        let blockStart: number;

        switch (inlineAttachment) {
          case 'start': {
            inlineStart = geometry.trigger.left;
            break;
          }
          case 'center': {
            inlineStart =
              geometry.trigger.left +
              geometry.trigger.width / 2 -
              geometry.sheet.inline / 2;
            break;
          }
          case 'end': {
            inlineStart =
              geometry.trigger.left +
              geometry.trigger.width -
              geometry.sheet.inline;
            break;
          }
        }

        switch (blockAttachment) {
          case 'start': {
            blockStart = geometry.trigger.top - geometry.sheet.block;
            break;
          }
          case 'end': {
            blockStart = geometry.trigger.top + geometry.trigger.height;
            break;
          }
        }

        sheet.style.left = `${inlineStart}px`;
        sheet.style.top = `${blockStart}px`;
      },
      async prepare() {
        await new Promise<void>((resolve) => {
          helpers.current.onRenderChange = (rendered: boolean) => {
            if (!rendered) return;
            delete helpers.current.onRenderChange;
            resolve();
          };
        });
      },
      async open() {
        const transitionEnd = onTransitionEnd(ref.current);
        setState('opening');
        await transitionEnd;
      },
      async close() {
        const transitionEnd = onTransitionEnd(ref.current);
        setState('closing');
        await transitionEnd;
      },
    });

    return () => {
      unlisten();
      clearSheet();
    };
  }, [controller, blockAttachment, inlineAttachment]);

  useEffect(() => {
    const handle = window.setTimeout(() => {
      helpers.current.onRenderChange?.(rendered);
    }, 10);

    return () => {
      window.clearTimeout(handle);
    };
  }, [rendered]);

  return rendered ? (
    <ConnectedAccessoryReset>
      <ImplicitActionReset>
        <div
          className={classes(
            styles.Popover,
            styles[variation('blockAttachment', blockAttachment)],
          )}
          id={controller.id}
          ref={ref}
          data-state="inactive"
        >
          {children}
        </div>
      </ImplicitActionReset>
    </ConnectedAccessoryReset>
  ) : null;
}

function onTransitionEnd(element: HTMLElement | null): Promise<void> {
  if (element == null) return Promise.resolve();

  return new Promise<void>((resolve) => {
    const listener = (event: TransitionEvent) => {
      if (event.target !== element || event.propertyName !== 'transform') {
        return;
      }

      element.removeEventListener('transitionend', listener);
      resolve();
    };

    element.addEventListener('transitionend', listener);
  });
}
