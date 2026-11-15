import type { FieldMapping } from '../types/form';
import { setNativeValue, setNativeCheckbox, dispatchFrameworkEvents } from './event-dispatcher';

export interface AutofillResult {
  filledCount: number;
  skippedCount: number;
  errors: string[];
}

export class AutofillEngine {
  /**
   * Safely fills the approved field mappings on the current page.
   * Never overwrites existing user input unless approved or empty.
   * Dispatches framework events for React/Angular/Vue.
   */
  async fillFields(
    mappings: FieldMapping[],
    options: { overwriteExisting?: boolean } = {}
  ): Promise<AutofillResult> {
    let filledCount = 0;
    let skippedCount = 0;
    const errors: string[] = [];

    for (const mapping of mappings) {
      // Only fill approved or high-confidence fields
      if (mapping.status === 'rejected' || mapping.status === 'missing') {
        skippedCount++;
        continue;
      }

      const valueToFill = mapping.userModifiedValue || mapping.suggestedValue;
      if (!valueToFill && valueToFill !== '0') {
        skippedCount++;
        continue;
      }

      const element = this.findElement(mapping);
      if (!element) {
        errors.push(`Could not locate element for "${mapping.fieldName}"`);
        continue;
      }

      try {
        const didFill = this.fillSingleElement(element, valueToFill, options.overwriteExisting);
        if (didFill) {
          filledCount++;
          mapping.status = 'filled';
          this.highlightFilledField(element);
        } else {
          skippedCount++;
        }
      } catch (err) {
        errors.push(`Failed to fill ${mapping.fieldName}: ${err}`);
      }
    }

    return { filledCount, skippedCount, errors };
  }

  private findElement(mapping: FieldMapping): HTMLElement | null {
    // 1. Try by htmlId
    if (mapping.fieldId && !mapping.fieldId.startsWith('applymate-field-')) {
      const byId = document.getElementById(mapping.fieldId);
      if (byId) return byId;

      // 2. Try by name
      const byName = document.querySelector<HTMLElement>(`[name="${CSS.escape(mapping.fieldId)}"]`);
      if (byName) return byName;
    }

    if (mapping.fieldName) {
      const byName = document.querySelector<HTMLElement>(`[name="${CSS.escape(mapping.fieldName)}"]`);
      if (byName) return byName;
    }

    // 3. Try finding by matching label
    const allLabels = Array.from(document.querySelectorAll('label'));
    const matchedLabel = allLabels.find((l) =>
      l.textContent?.toLowerCase().includes(mapping.originalLabel.toLowerCase())
    );
    if (matchedLabel) {
      if (matchedLabel.htmlFor) {
        const target = document.getElementById(matchedLabel.htmlFor);
        if (target) return target;
      }
      const childInput = matchedLabel.querySelector<HTMLElement>('input, textarea, select');
      if (childInput) return childInput;
    }

    return null;
  }

  private fillSingleElement(
    element: HTMLElement,
    value: string,
    overwriteExisting = false
  ): boolean {
    const tagName = element.tagName.toLowerCase();
    const type = (element.getAttribute('type') || '').toLowerCase();

    // 1. Inputs & Textareas
    if (tagName === 'input' || tagName === 'textarea') {
      const inputEl = element as HTMLInputElement | HTMLTextAreaElement;

      if (type === 'checkbox') {
        const shouldCheck = value.toLowerCase() === 'true' || value === '1' || value.toLowerCase() === 'yes';
        setNativeCheckbox(inputEl as HTMLInputElement, shouldCheck);
        dispatchFrameworkEvents(inputEl);
        return true;
      }

      if (type === 'radio') {
        const radioEl = inputEl as HTMLInputElement;
        if (radioEl.value.toLowerCase() === value.toLowerCase()) {
          setNativeCheckbox(radioEl, true);
          dispatchFrameworkEvents(radioEl);
          return true;
        }
        return false;
      }

      // Check existing value
      if (inputEl.value && inputEl.value.trim().length > 0 && !overwriteExisting) {
        // Do not overwrite existing user-entered text without permission
        return false;
      }

      setNativeValue(inputEl, value);
      dispatchFrameworkEvents(inputEl);
      return true;
    }

    // 2. Select dropdowns
    if (tagName === 'select') {
      const selectEl = element as HTMLSelectElement;
      let matched = false;

      // Match by option value or option text
      for (let i = 0; i < selectEl.options.length; i++) {
        const opt = selectEl.options[i];
        if (
          opt.value.toLowerCase() === value.toLowerCase() ||
          opt.text.toLowerCase().includes(value.toLowerCase()) ||
          value.toLowerCase().includes(opt.text.toLowerCase())
        ) {
          selectEl.selectedIndex = i;
          matched = true;
          break;
        }
      }

      if (matched) {
        dispatchFrameworkEvents(selectEl);
        return true;
      }
      return false;
    }

    // 3. Contenteditable / custom div
    if (element.isContentEditable) {
      if (element.textContent && element.textContent.trim().length > 0 && !overwriteExisting) {
        return false;
      }
      element.textContent = value;
      dispatchFrameworkEvents(element);
      return true;
    }

    return false;
  }

  private highlightFilledField(element: HTMLElement): void {
    const originalBorder = element.style.borderColor;
    const originalShadow = element.style.boxShadow;

    element.style.borderColor = '#10b981'; // subtle emerald green
    element.style.boxShadow = '0 0 0 2px rgba(16, 185, 129, 0.2)';
    element.style.transition = 'border-color 0.3s, box-shadow 0.3s';

    setTimeout(() => {
      element.style.borderColor = originalBorder;
      element.style.boxShadow = originalShadow;
    }, 4000);
  }
}

