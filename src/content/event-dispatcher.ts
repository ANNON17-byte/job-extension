/**
 * Robust synthetic event dispatcher for modern web frameworks
 * Supports React 16+, Vue 2/3, Angular, Svelte, Google Forms (Polymer / jsaction), and standard DOM.
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

export function fillInputWithNativeFallback(
  element: HTMLInputElement | HTMLTextAreaElement,
  value: string
): void {
  // 1. Focus element
  try {
    element.focus();
  } catch {}

  // 2. Try document.execCommand first (fires native trusted insertText in Chromium)
  let execSuccess = false;
  try {
    if (typeof document !== 'undefined' && typeof document.execCommand === 'function') {
      element.setSelectionRange(0, element.value.length);
      execSuccess = document.execCommand('insertText', false, value);
    }
  } catch {
    execSuccess = false;
  }

  // 3. If execCommand didn't execute or didn't set full value, use native prototype setter
  if (!execSuccess || element.value !== value) {
    setNativeValue(element, value);
  }

  // 4. Update data-initial-value and value attributes
  element.setAttribute('data-initial-value', value);
  element.setAttribute('value', value);

  // 5. Dispatch full framework lifecycle events
  dispatchFrameworkEvents(element);

  // 6. Special Google Forms handler: Fix overlapping "Your answer" placeholder & error message
  const cleanupGoogleFormsUI = () => {
    // Find outermost question card
    const questionCard =
      element.closest('.Qr7Oae, [role="listitem"], .geS5n') ||
      element.closest('.rFrNMe, .quantumWizTextinputPaperinputEl') ||
      element.parentElement;

    if (!questionCard) return;

    // A. Remove error classes and add hasValue
    questionCard.classList.add('hasValue');
    questionCard.classList.remove('isError');
    questionCard.removeAttribute('aria-invalid');

    const inputWrappers = questionCard.querySelectorAll(
      '.rFrNMe, .quantumWizTextinputPaperinputEl, .o3Gaw'
    );
    inputWrappers.forEach((w) => {
      w.classList.add('hasValue');
      w.classList.remove('isError');
      w.removeAttribute('aria-invalid');
    });

    // B. Hide overlapping "Your answer" placeholder
    const placeholders = questionCard.querySelectorAll(
      '.nd9RD, .asQxv, [aria-hidden="true"], [jsname="YPqjbf"]:not(input):not(textarea)'
    );
    placeholders.forEach((p) => {
      if (p instanceof HTMLElement) {
        const text = p.textContent?.trim().toLowerCase() || '';
        if (text.includes('your answer') || text.includes('your response') || text === '') {
          p.style.display = 'none';
          p.style.opacity = '0';
          p.style.visibility = 'hidden';
        }
      }
    });

    // C. Hide "This is a required question" error message
    const errorAlerts = questionCard.querySelectorAll(
      '[role="alert"], .RHiNhe, .error-message, .vXX8oc'
    );
    errorAlerts.forEach((e) => {
      if (e instanceof HTMLElement) {
        e.style.display = 'none';
        e.setAttribute('aria-hidden', 'true');
      }
    });
  };

  // Run cleanup immediately and on next tick/after blur
  cleanupGoogleFormsUI();
  if (typeof requestAnimationFrame !== 'undefined') {
    requestAnimationFrame(cleanupGoogleFormsUI);
  }
  setTimeout(cleanupGoogleFormsUI, 60);
}

export function dispatchFrameworkEvents(element: HTMLElement): void {
  // 1. Focus sequence
  element.dispatchEvent(new FocusEvent('focus', { bubbles: true, composed: true }));
  element.dispatchEvent(new FocusEvent('focusin', { bubbles: true, composed: true }));

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
  element.dispatchEvent(new FocusEvent('focusout', { bubbles: true, composed: true }));
  element.dispatchEvent(new FocusEvent('blur', { bubbles: true, composed: true }));
}
