/**
 * Rule: form-label
 * Form inputs must have associated labels.
 * WCAG 1.3.1 — Info and Relationships (Level A)
 * WCAG 4.1.2 — Name, Role, Value (Level A)
 */
export default {
  id: 'form-label',
  description: 'Form inputs must have an associated <label>, aria-label, or aria-labelledby',
  severity: 'error',
  wcag: '1.3.1, 4.1.2',
  impact: 'Screen reader users cannot determine the purpose of the input field',
  url: 'https://www.w3.org/WAI/WCAG21/Understanding/info-and-relationships.html',

  check(element) {
    const inputTypes = ['input', 'select', 'textarea'];
    if (!inputTypes.includes(element.name)) return null;
    if (element.hasAttributes['...spread']) return null;

    // Hidden inputs don't need labels
    const type = element.attributes['type'] || '';
    if (type === 'hidden' || type === 'submit' || type === 'button' || type === 'reset') return null;

    const hasAriaLabel = 'aria-label' in element.attributes || 'ariaLabel' in element.attributes;
    const hasAriaLabelledBy = 'aria-labelledby' in element.attributes || 'ariaLabelledby' in element.attributes;
    const hasId = 'id' in element.attributes; // might be referenced by a <label for="...">
    const hasTitle = 'title' in element.attributes;
    const hasPlaceholder = 'placeholder' in element.attributes;

    // We can't verify label-for association statically across elements easily,
    // so we check for inline labelling mechanisms
    if (!hasAriaLabel && !hasAriaLabelledBy && !hasTitle) {
      // Placeholder alone is not sufficient
      return {
        ruleId: this.id,
        severity: this.severity,
        message: `<${element.rawName}> has no accessible label (missing aria-label, aria-labelledby, or title)${hasPlaceholder ? '. Note: placeholder is NOT a substitute for a label' : ''}`,
        line: element.line,
        sourceLine: element.sourceLine,
        fix: 'Add aria-label="Description" to the input, or wrap it with a <label> element',
        copilotPrompt: `Look at line ${element.line}. There is a <${element.rawName}> element without an accessible label. Add an appropriate aria-label attribute based on the context (look at nearby text, placeholder, or variable names for clues about the field's purpose). If there is a placeholder, the aria-label should match or expand on it. Alternatively, add a visible <label> element associated via htmlFor/id.`,
      };
    }

    return null;
  },
};
