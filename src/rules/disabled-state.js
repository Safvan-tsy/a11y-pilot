/**
 * Rule: disabled-state
 * Disabled interactive elements should use aria-disabled + explanation rather
 * than the native `disabled` attribute, which removes them from tab order and
 * makes them invisible to many assistive technologies.
 * WCAG 4.1.2 — Name, Role, Value (Level A)
 */
export default {
  id: 'disabled-state',
  description: 'Disabled elements should be accessible with aria-disabled and provide context',
  severity: 'warning',
  wcag: '4.1.2',
  impact: 'Native disabled attribute removes elements from tab order, making them invisible to keyboard and screen-reader users who may need to understand *why* an action is unavailable',
  url: 'https://www.w3.org/WAI/WCAG21/Understanding/name-role-value.html',

  check(element) {
    if (element.hasAttributes['...spread']) return null;

    const has = element.hasAttributes;
    const attrs = element.attributes;

    // Only care about interactive elements with disabled
    const interactiveElements = ['button', 'input', 'select', 'textarea', 'fieldset'];
    if (!interactiveElements.includes(element.name)) return null;

    const isDisabled = has['disabled'];
    if (!isDisabled) return null;

    // Check if they provide context for why it's disabled
    const hasTitle = has['title'];
    const hasAriaLabel = has['aria-label'];
    const hasAriaDescribedby = has['aria-describedby'];
    const hasAriaDisabled = has['aria-disabled'];

    // If using native disabled WITHOUT any explanation, flag it
    const hasExplanation = hasTitle || hasAriaLabel || hasAriaDescribedby;

    if (!hasExplanation) {
      return {
        ruleId: this.id,
        severity: this.severity,
        message: `<${element.rawName}> is disabled without accessible explanation (add title or aria-describedby)`,
        line: element.line,
        sourceLine: element.sourceLine,
        fix: 'Add a title attribute or aria-describedby explaining why the control is disabled',
        copilotPrompt: `Look at line ${element.line}. The <${element.rawName}> element uses the disabled attribute but provides no explanation for *why* it's disabled. Screen reader users encounter a disabled control with no context about what they need to do to enable it. Best practice: use aria-disabled="true" instead of native disabled (keeps element in tab order), and add a title or aria-describedby attribute explaining why it's disabled (e.g., title="Please fill in all required fields first"). Example: <button aria-disabled="true" title="Complete the form first">Submit</button>`,
      };
    }

    return null;
  },
};
