const FOCUSABLE_SELECTOR =
  'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

export function findUniqueFocusable(
  element: Element | null,
): HTMLElement | null {
  if (element == null) return null;

  if (element.matches(FOCUSABLE_SELECTOR)) {
    return element as HTMLElement;
  }

  return element.querySelector<HTMLElement>(FOCUSABLE_SELECTOR);
}

export function focusFirstFocusable(element: HTMLElement | null) {
  findUniqueFocusable(element)?.focus();
}
