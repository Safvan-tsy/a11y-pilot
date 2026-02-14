/**
 * Rule: button-content
 * Buttons must have discernible text for screen readers.
 * WCAG 4.1.2 — Name, Role, Value (Level A)
 */
export default {
  id: 'button-content',
  description: '<button> elements must have text content or aria-label',
  severity: 'error',
  wcag: '4.1.2',
  impact: 'Screen readers announce the button without a name, making it impossible to understand its purpose',
  url: 'https://www.w3.org/WAI/WCAG21/Understanding/name-role-value.html',

  check(element) {
    if (element.name !== 'button') return null;
    if (element.hasAttributes['...spread']) return null;

    const hasAriaLabel = 'aria-label' in element.attributes || 'ariaLabel' in element.attributes;
    const hasAriaLabelledBy = 'aria-labelledby' in element.attributes || 'ariaLabelledby' in element.attributes;
    const hasTitle = 'title' in element.attributes;
    const hasText = element.hasTextChildren;

    if (!hasAriaLabel && !hasAriaLabelledBy && !hasTitle && !hasText) {
      return {
        ruleId: this.id,
        severity: this.severity,
        message: '<button> has no accessible name (no text content, aria-label, or title)',
        line: element.line,
        sourceLine: element.sourceLine,
        fix: 'Add text content inside the button, or add an aria-label attribute',
        copilotPrompt: `Look at line ${element.line}. There is a <button> element with no accessible name — it has no text content, no aria-label, and no title attribute. Add an appropriate aria-label based on the button's purpose (look at its onClick handler, icon, or surrounding context for clues). If the button contains an icon, add aria-label describing the action.`,
      };
    }

    return null;
  },
};
