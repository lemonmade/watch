import React, {
  useState,
  useRef,
  useCallback,
  useEffect,
  ReactNode,
} from 'react';

import {CREATE_SWITCH_ID, SWITCH_IS_FALLBACK} from '../../router';
import {useCurrentUrl, useRouter} from '../../hooks';
import {SwitchContext} from '../../context';

interface Props {
  id?: string;
  children?: ReactNode;
  // need to call with URL
  renderFallback?(): ReactNode;
}

export function Switch({id, children, renderFallback}: Props) {
  const router = useRouter();
  const switchId = id || router[CREATE_SWITCH_ID]();
  const usedFallback = router[SWITCH_IS_FALLBACK](switchId);

  const matched = useRef(false);
  const {current: switcher} = useRef({
    matched: () => {
      matched.current = true;
    },
  });

  const triedChildren = useRef(usedFallback);
  const currentUrl = useCurrentUrl();
  const forceUpdate = useForcedUpdate();

  useValueTracking(currentUrl, () => {
    matched.current = false;
    triedChildren.current = false;
  });

  useEffect(() => {
    triedChildren.current = true;

    if (!matched.current && renderFallback != null) {
      forceUpdate();
    }
  }, [matched, triedChildren, currentUrl, forceUpdate, renderFallback]);

  const fallbackContent =
    triedChildren.current && !matched.current && renderFallback ? (
      <>{renderFallback()}</>
    ) : null;

  return (
    <>
      {fallbackContent}
      <SwitchContext.Provider value={switcher}>
        {children}
      </SwitchContext.Provider>
    </>
  );
}

function useForcedUpdate() {
  const [, setSignal] = useState(Symbol(''));
  return useCallback(() => setSignal(() => Symbol('')), []);
}

function useValueTracking<T>(
  value: T,
  onChange: (value: T, oldValue: T) => void,
) {
  const tracked = useRef(value);
  const oldValue = tracked.current;

  if (value !== oldValue) {
    tracked.current = value;
    onChange(value, oldValue);
  }
}
