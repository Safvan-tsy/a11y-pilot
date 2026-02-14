/**
 * Rule: tabindex-positive
 * Positive tabindex values disrupt the natural DOM tab order and are considered
 * an accessibility anti-pattern. tabindex should only be 0 (add to tab order)
 * or -1 (programmatic focus only).
 * WCAG 2.4.3 — Focus Order (Level A)
 */
export default {
  id: 'tabindex-positive',
  description: 'Avoid positive tabindex values — they disrupt natural focus order',
  severity: 'warning',
  wcag: '2.4.3',
  impact: 'Positive tabindex values override the natural document tab order, creating a confusing and unpredictable focus sequence for keyboard users',
  url: 'https://www.w3.org/WAI/WCAG21/Understanding/focus-order.html',

  check(element) {
    if (element.hasAttributes['...spread']) return null;

    const has = element.hasAttributes;
    const attrs = element.attributes;

    if (!has['tabindex'] && !has['tabIndex']) return null;

    const rawValue = attrs['tabindex'] || attrs['tabIndex'];
    if (!rawValue || rawValue === '{expression}') return null;

    const tabindex = parseInt(rawValue, 10);

    if (isNaN(tabindex)) return null;

    if (tabindex > 0) {
      return {
        ruleId: this.id,
        severity: this.severity,
        message: `<${element.rawName}> has tabindex="${tabindex}" — positive tabindex disrupts natural tab order`,
        line: element.line,
        sourceLine: element.sourceLine,
        fix: `Change tabindex="${tabindex}" to tabindex="0" (or remove it if the element is natively focusable)`,
        copilotPrompt: `Look at line ${element.line}. The <${element.rawName}> element has tabindex="${tabindex}". Positive tabindex values are an anti-pattern because they override the natural DOM-based tab order, causing confusion for keyboard users. Elements with positive tabindex are focused before all elements with tabindex="0" or no tabindex. Fix: If the element needs to be focusable, use tabindex="0" to add it to the natural tab order. If it's natively focusable (button, a, input), remove the tabindex entirely. Reorder elements in the DOM instead of using tabindex to control focus order.`,
      };
    }

    return null;
  },
};
