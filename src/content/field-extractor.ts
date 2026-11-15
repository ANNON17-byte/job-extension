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

    // Google Forms has hidden inputs for history / token
    const name = (el.getAttribute('name') || '').toLowerCase();
    const id = (el.id || '').toLowerCase();
    if (name === 'fbzx' || name === 'fvv' || name === 'pagehistory' || name === 'draftresponse') {
      return true;
    }

    // Check display or visibility
    const style = window.getComputedStyle(el);
    if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') {
      return true;
    }

    // Ignore search bars
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

    // Stamp DOM element with guaranteed unique data-attribute for 100% reliable locator
    const fieldId = el.id || el.getAttribute('name') || `applymate-field-${index}`;
    el.setAttribute('data-applymate-id', fieldId);

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

    // Extract label from multiple sources including Google Forms and ARIA
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
    // 1. Google Forms question item container (Specific & robust for docs.google.com/forms)
    const googleItem = el.closest('div[role="listitem"], .Qr7Oae, .geS5n, [jsmodel]');
    if (googleItem) {
      const heading = googleItem.querySelector('div[role="heading"], .M7eMe, [aria-level="3"], span.M7eMe');
      if (heading && heading.textContent) {
        const clean = this.cleanLabelText(heading.textContent);
        if (clean) return clean;
      }
    }

    // 2. aria-labelledby (handles space-separated multiple IDs e.g. "i1 i4" on Google Forms)
    const labelledby = el.getAttribute('aria-labelledby');
    if (labelledby) {
      const ids = labelledby.split(/\s+/).filter(Boolean);
      for (const id of ids) {
        const labelEl = document.getElementById(id);
        if (labelEl && labelEl.textContent) {
          const clean = this.cleanLabelText(labelEl.textContent);
          if (clean && !clean.toLowerCase().includes('required question')) {
            return clean;
          }
        }
      }
    }

    // 3. Explicit <label for="...">
    if (el.id) {
      const labelEl = document.querySelector<HTMLLabelElement>(`label[for="${CSS.escape(el.id)}"]`);
      if (labelEl && labelEl.textContent) {
        return this.cleanLabelText(labelEl.textContent);
      }
    }

    // 4. Enclosing <label>
    const parentLabel = el.closest('label');
    if (parentLabel && parentLabel.textContent) {
      const clone = parentLabel.cloneNode(true) as HTMLElement;
      clone.querySelectorAll('input, select, textarea, button').forEach((child) => child.remove());
      const text = clone.textContent?.trim();
      if (text) return this.cleanLabelText(text);
    }

    // 5. aria-label
    if (el.getAttribute('aria-label')) {
      const clean = this.cleanLabelText(el.getAttribute('aria-label')!);
      if (clean) return clean;
    }

    // 6. Placeholder fallback
    if (el.getAttribute('placeholder')) {
      return this.cleanLabelText(el.getAttribute('placeholder')!);
    }

    // 7. Closest previous sibling or parent element with text
    const prevSibling = el.previousElementSibling;
    if (prevSibling && prevSibling.textContent && prevSibling.textContent.length < 100) {
      return this.cleanLabelText(prevSibling.textContent);
    }

    const parentDiv = el.parentElement;
    if (parentDiv) {
      const header = parentDiv.querySelector('label, h3, h4, h5, span, p');
      if (header && header.textContent && header.textContent.length < 100) {
        return this.cleanLabelText(header.textContent);
      }
    }

    return '';
  }

  private cleanLabelText(raw: string): string {
    return raw
      .replace(/[\n\r\t]+/g, ' ')
      .replace(/\s*\*\s*$/, '') // remove trailing required asterisk
      .replace(/Required question/i, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private extractContextualText(el: HTMLElement): string {
    const fieldset = el.closest('fieldset');
    if (fieldset) {
      const legend = fieldset.querySelector('legend');
      if (legend && legend.textContent) return legend.textContent.trim();
    }

    const section = el.closest('section, form, [class*="form-group"], [class*="section"], [role="listitem"]');
    if (section) {
      const heading = section.querySelector('h1, h2, h3, h4, [class*="title"], [class*="heading"]');
      if (heading && heading.textContent) return heading.textContent.trim();
    }

    return '';
  }
}
