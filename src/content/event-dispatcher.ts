/**
 * Robust synthetic event dispatcher for modern web frameworks
 * Supports React 16+, Vue 2/3, Angular, Svelte, Google Forms (jsaction), and standard DOM.
 */
export function setNativeValue(
  element: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement,
  value: string
): void {
  const valueSetter = Object.getOwnPropertyDescriptor(element, 'value')?.set;
  const prototype = Object.getPrototypeOf(element);
  const prototypeValueSetter = Object.getOwnPropertyDescriptor(prototype, 'value')?.set;

  if (prototypeValueSetter && valueSetter !== prototypeValueSetter) {
    prototypeValueSetter.call(element, value);
  } else if (valueSetter) {
    valueSetter.call(element, value);
  } else {
    element.value = value;
  }

  // Update data-initial-value attribute used by Google Forms
  if (element.hasAttribute('data-initial-value') || element.classList.contains('whsOnd')) {
    element.setAttribute('data-initial-value', value);
  }
}

export function setNativeCheckbox(element: HTMLInputElement, checked: boolean): void {
  const checkedSetter = Object.getOwnPropertyDescriptor(element, 'checked')?.set;
  const prototype = Object.getPrototypeOf(element);
  const prototypeCheckedSetter = Object.getOwnPropertyDescriptor(prototype, 'checked')?.set;

  if (prototypeCheckedSetter && checkedSetter !== prototypeCheckedSetter) {
    prototypeCheckedSetter.call(element, checked);
  } else if (checkedSetter) {
    checkedSetter.call(element, checked);
  } else {
    element.checked = checked;
  }
}

export function dispatchFrameworkEvents(element: HTMLElement): void {
  // 1. Focus sequence
  element.dispatchEvent(new FocusEvent('focus', { bubbles: true }));
  element.dispatchEvent(new FocusEvent('focusin', { bubbles: true }));

  // 2. Keyboard interaction sequence
  element.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, key: 'a' }));
  element.dispatchEvent(new KeyboardEvent('keypress', { bubbles: true, key: 'a' }));

  // 3. Input sequence (supports both Event and InputEvent)
  try {
    element.dispatchEvent(
      new InputEvent('input', {
        bubbles: true,
        composed: true,
        inputType: 'insertText',
      })
    );
  } catch {
    element.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
  }

  element.dispatchEvent(new KeyboardEvent('keyup', { bubbles: true, key: 'a' }));

  // 4. Change sequence
  element.dispatchEvent(new Event('change', { bubbles: true, composed: true }));

  // 5. Blur sequence
  element.dispatchEvent(new FocusEvent('focusout', { bubbles: true }));
  element.dispatchEvent(new FocusEvent('blur', { bubbles: true }));
}
