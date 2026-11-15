import type { DetectedField, FieldInputType, SelectOption } from '../types/form';

export class FieldExtractor {
  extractFields(container: Document | HTMLElement = document): DetectedField[] {
    const fields: DetectedField[] = [];
    const elements = container.querySelectorAll<HTMLElement>(
      'input, textarea, select, [role="textbox"], [role="combobox"], [contenteditable="true"]'
    );

    let index = 0;
    elements.forEach((el) => {
      // Ignore hidden or system elements
      if (this.isHiddenOrIgnored(el)) return;

      const field = this.inspectElement(el, index++);
      if (field) {
        fields.push(field);
      }
    });

    return fields;
  }

  private isHiddenOrIgnored(el: HTMLElement): boolean {
    if (el.getAttribute('type') === 'hidden') return true;
    if (el.getAttribute('type') === 'submit' || el.getAttribute('type') === 'button') return true;

    // Check display or visibility
    const style = window.getComputedStyle(el);
    if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') {
      return true;
    }

    // Ignore search bars, login password fields if not part of application
    const name = (el.getAttribute('name') || '').toLowerCase();
    const id = (el.id || '').toLowerCase();
    if (name.includes('search') || id.includes('search')) return true;

    return false;
  }

  private inspectElement(el: HTMLElement, index: number): DetectedField | null {
    const tagName = el.tagName.toLowerCase();
    const typeAttr = (el.getAttribute('type') || 'text').toLowerCase();

    let type: FieldInputType = 'text';
    if (tagName === 'textarea') type = 'textarea';
    else if (tagName === 'select') type = 'select';
    else if (typeAttr === 'email') type = 'email';
    else if (typeAttr === 'tel') type = 'tel';
    else if (typeAttr === 'url') type = 'url';
    else if (typeAttr === 'file') type = 'file';
    else if (typeAttr === 'checkbox') type = 'checkbox';
    else if (typeAttr === 'radio') type = 'radio';
    else if (typeAttr === 'number') type = 'number';
    else if (typeAttr === 'date') type = 'date';
    else if (typeAttr === 'password') type = 'password';

    // Generate stable unique field selector / id
    const fieldId = el.id || el.getAttribute('name') || `applymate-field-${index}`;
    const name = el.getAttribute('name') || '';
    const htmlId = el.id || '';
    const placeholder = el.getAttribute('placeholder') || '';
    const ariaLabel = el.getAttribute('aria-label') || '';
    const required = el.hasAttribute('required') || el.getAttribute('aria-required') === 'true';

    // Get current value
    let currentValue = '';
    if (tagName === 'input' || tagName === 'textarea') {
      currentValue = (el as HTMLInputElement | HTMLTextAreaElement).value || '';
    } else if (tagName === 'select') {
      currentValue = (el as HTMLSelectElement).value || '';
    }

    // Extract label from multiple sources
    const label = this.extractLabel(el);

    // Extract dropdown options if select
    const options: SelectOption[] = [];
    if (tagName === 'select') {
      const select = el as HTMLSelectElement;
      Array.from(select.options).forEach((opt) => {
        options.push({
          value: opt.value,
          text: opt.text.trim(),
        });
      });
    }

    // Contextual text (surrounding parent heading, section, or legend)
    const contextualText = this.extractContextualText(el);

    // Max length
    const maxLenAttr = el.getAttribute('maxlength');
    const maxLength = maxLenAttr ? parseInt(maxLenAttr, 10) : undefined;

    return {
      id: fieldId,
      name,
      htmlId,
      type,
      label,
      placeholder,
      ariaLabel,
      required,
      currentValue,
      options,
      contextualText,
      maxLength,
    };
  }

  private extractLabel(el: HTMLElement): string {
    // 1. Explicit <label for="...">
    if (el.id) {
      const labelEl = document.querySelector<HTMLLabelElement>(`label[for="${CSS.escape(el.id)}"]`);
      if (labelEl && labelEl.textContent) {
        return labelEl.textContent.trim();
      }
    }

    // 2. Enclosing <label>
    const parentLabel = el.closest('label');
    if (parentLabel && parentLabel.textContent) {
      // Remove text of child inputs if any
      const clone = parentLabel.cloneNode(true) as HTMLElement;
      clone.querySelectorAll('input, select, textarea, button').forEach((child) => child.remove());
      const text = clone.textContent?.trim();
      if (text) return text;
    }

    // 3. aria-labelledby
    const labelledby = el.getAttribute('aria-labelledby');
    if (labelledby) {
      const labelEl = document.getElementById(labelledby);
      if (labelEl && labelEl.textContent) {
        return labelEl.textContent.trim();
      }
    }

    // 4. aria-label
    if (el.getAttribute('aria-label')) {
      return el.getAttribute('aria-label')!.trim();
    }

    // 5. Placeholder fallback
    if (el.getAttribute('placeholder')) {
      return el.getAttribute('placeholder')!.trim();
    }

    // 6. Closest previous sibling or parent element with text
    const prevSibling = el.previousElementSibling;
    if (prevSibling && prevSibling.textContent && prevSibling.textContent.length < 100) {
      return prevSibling.textContent.trim();
    }

    const parentDiv = el.parentElement;
    if (parentDiv) {
      const header = parentDiv.querySelector('label, h3, h4, h5, span, p');
      if (header && header.textContent && header.textContent.length < 100) {
        return header.textContent.trim();
      }
    }

    return '';
  }

  private extractContextualText(el: HTMLElement): string {
    // Search upwards for fieldset legend, section header, or card header
    const fieldset = el.closest('fieldset');
    if (fieldset) {
      const legend = fieldset.querySelector('legend');
      if (legend && legend.textContent) return legend.textContent.trim();
    }

    const section = el.closest('section, form, [class*="form-group"], [class*="section"]');
    if (section) {
      const heading = section.querySelector('h1, h2, h3, h4, [class*="title"], [class*="heading"]');
      if (heading && heading.textContent) return heading.textContent.trim();
    }

    return '';
  }
}

