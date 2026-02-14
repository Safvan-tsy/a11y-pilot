/**
 * Rule: aria-hidden-focus
 * Focusable elements must not be inside aria-hidden="true" containers
 * or have aria-hidden="true" themselves while being focusable.
 * WCAG 4.1.2 — Name, Role, Value (Level A)
 * WCAG 1.3.1 — Info and Relationships (Level A)
 */

const FOCUSABLE_ELEMENTS = new Set([
  'a', 'button', 'input', 'select', 'textarea', 'summary',
]);

export default {
  id: 'aria-hidden-focus',
  description: 'Focusable elements must not have aria-hidden="true"',
  severity: 'error',
  wcag: '4.1.2, 1.3.1',
  impact: 'Screen readers will skip the element but keyboard users can still focus it, creating a confusing mismatch',
  url: 'https://www.w3.org/WAI/WCAG21/Understanding/name-role-value.html',

  check(element) {
    if (element.hasAttributes['...spread']) return null;

    const isAriaHidden =
      element.attributes['aria-hidden'] === 'true' ||
      element.attributes['ariaHidden'] === 'true';

    if (!isAriaHidden) return null;

    // Check if the element itself is focusable
    const isFocusable =
      FOCUSABLE_ELEMENTS.has(element.name) ||
      element.hasAttributes['tabIndex'] ||
      element.hasAttributes['tabindex'] ||
      element.hasAttributes['contentEditable'] ||
      element.hasAttributes['contenteditable'];

    // Skip <a> without href — they're not focusable
    if (element.name === 'a' && !element.hasAttributes['href']) return null;

    // Skip <input type="hidden">
    if (element.name === 'input' && element.attributes['type'] === 'hidden') return null;

    // Check for tabindex="-1" which removes from tab order — still a concern
    // but less severe since user can't tab to it
    const tabIndex = element.attributes['tabIndex'] || element.attributes['tabindex'];
    if (tabIndex === '-1') return null; // Intentionally removed from tab order

    if (isFocusable) {
      return {
        ruleId: this.id,
        severity: this.severity,
        message: `<${element.rawName}> is focusable but has aria-hidden="true" — keyboard users can reach it but screen readers cannot`,
        line: element.line,
        sourceLine: element.sourceLine,
        fix: 'Either remove aria-hidden="true" or add tabIndex={-1} to remove it from the tab order',
        copilotPrompt: `Look at line ${element.line}. The <${element.rawName}> element has aria-hidden="true" but is still focusable by keyboard. This creates a confusing experience — keyboard users can tab to it, but screen readers skip it entirely. Either remove aria-hidden="true" so the element is properly announced, or add tabIndex={-1} to also remove it from the keyboard tab order. Choose based on whether the element should be accessible or truly hidden.`,
      };
    }

    return null;
  },
};
