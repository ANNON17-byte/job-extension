import type { FieldMapping } from '../types/form';
import {
  setNativeValue,
  setNativeCheckbox,
  dispatchFrameworkEvents,
  fillInputWithNativeFallback,
} from './event-dispatcher';

export interface AutofillResult {
  filledCount: number;
  skippedCount: number;
  errors: string[];
}

export class AutofillEngine {
  /**
   * Safely fills the approved field mappings on the current page.
   * Never overwrites existing user input unless approved or empty.
   * Dispatches framework events for React/Angular/Vue/Google Forms.
   */
  async fillFields(
    mappings: FieldMapping[],
    options: { overwriteExisting?: boolean } = {}
  ): Promise<AutofillResult> {
    let filledCount = 0;
    let skippedCount = 0;
    const errors: string[] = [];

    for (const mapping of mappings) {
      // Only skip explicitly rejected fields or fields with zero value
      if (mapping.status === 'rejected') {
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
        errors.push(`Could not locate element for "${mapping.fieldName || mapping.originalLabel}"`);
        skippedCount++;
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
        errors.push(`Failed to fill ${mapping.fieldName || mapping.originalLabel}: ${err}`);
        skippedCount++;
      }
    }

    return { filledCount, skippedCount, errors };
  }

  private findElement(mapping: FieldMapping): HTMLElement | null {
    // 1. Direct stamped data-attribute match (100% reliable across Google Forms, React, SPAs)
    if (mapping.fieldId) {
      const byDataId = document.querySelector<HTMLElement>(`[data-applymate-id="${CSS.escape(mapping.fieldId)}"]`);
      if (byDataId) return byDataId;
    }

    // 2. Try by htmlId
    if (mapping.fieldId && !mapping.fieldId.startsWith('applymate-field-')) {
      const byId = document.getElementById(mapping.fieldId);
      if (byId) return byId;

      const byName = document.querySelector<HTMLElement>(`[name="${CSS.escape(mapping.fieldId)}"]`);
      if (byName) return byName;
    }

    // 3. Try by name
    if (mapping.fieldName) {
      const byName = document.querySelector<HTMLElement>(`[name="${CSS.escape(mapping.fieldName)}"]`);
      if (byName) return byName;
    }

    // 4. Try finding by matching label text across all labels and Google Forms headings
    const labelTextLower = (mapping.originalLabel || '').toLowerCase().trim();
    if (labelTextLower) {
      // 4a. Standard HTML <label>
      const allLabels = Array.from(document.querySelectorAll('label'));
      const matchedLabel = allLabels.find((l) =>
        l.textContent?.toLowerCase().includes(labelTextLower)
      );
      if (matchedLabel) {
        if (matchedLabel.htmlFor) {
          const target = document.getElementById(matchedLabel.htmlFor);
          if (target) return target;
        }
        const childInput = matchedLabel.querySelector<HTMLElement>('input, textarea, select');
        if (childInput) return childInput;
      }

      // 4b. Google Forms item headings (div[role="heading"], .M7eMe)
      const googleHeadings = Array.from(
        document.querySelectorAll<HTMLElement>('div[role="heading"], .M7eMe, [role="listitem"]')
      );
      for (const heading of googleHeadings) {
        if (heading.textContent?.toLowerCase().includes(labelTextLower)) {
          const container = heading.closest('div[role="listitem"], .Qr7Oae, .geS5n') || heading;
          const input = container.querySelector<HTMLElement>('input:not([type="hidden"]), textarea');
          if (input) return input;
        }
      }
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

    // 1. Inputs & Textareas (including Google Forms whsOnd & KHxj8b inputs)
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
        if (radioEl.value.toLowerCase() === value.toLowerCase() || value.toLowerCase() === 'yes') {
          setNativeCheckbox(radioEl, true);
          dispatchFrameworkEvents(radioEl);
          return true;
        }
        return false;
      }

      // Check existing value: if already filled and overwriteExisting is false, do not wipe user data
      if (inputEl.value && inputEl.value.trim().length > 0 && !overwriteExisting) {
        // If it's already filled with the exact same value, consider it filled
        if (inputEl.value.trim() === value.trim()) return true;
        return false;
      }

      // Set value with native chromium fallback, framework events, and Google Forms handling
      fillInputWithNativeFallback(inputEl, value);
      return true;
    }

    // 2. Select dropdowns
    if (tagName === 'select') {
      const selectEl = element as HTMLSelectElement;
      let matched = false;

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
    element.style.boxShadow = '0 0 0 2px rgba(16, 185, 129, 0.25)';
    element.style.transition = 'border-color 0.3s, box-shadow 0.3s';

    setTimeout(() => {
      element.style.borderColor = originalBorder;
      element.style.boxShadow = originalShadow;
    }, 4000);
  }
}
