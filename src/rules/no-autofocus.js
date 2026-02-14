/**
 * Rule: no-autofocus
 * Avoid using autoFocus — it disrupts screen readers and keyboard users.
 * WCAG 3.2.1 — On Focus (Level A)
 */
export default {
  id: 'no-autofocus',
  description: 'Avoid using autoFocus attribute — it disrupts screen readers and keyboard navigation',
  severity: 'warning',
  wcag: '3.2.1',
  impact: 'autoFocus moves focus unexpectedly, disorienting screen reader users and disrupting keyboard navigation flow',
  url: 'https://www.w3.org/WAI/WCAG21/Understanding/on-focus.html',

  check(element) {
    const hasAutoFocus = 'autoFocus' in element.attributes ||
                         'autofocus' in element.attributes ||
                         'autoFocus' in element.hasAttributes ||
                         'autofocus' in element.hasAttributes;

    if (!hasAutoFocus) return null;

    return {
      ruleId: this.id,
      severity: this.severity,
      message: `<${element.rawName}> uses autoFocus which disrupts screen reader and keyboard navigation`,
      line: element.line,
      sourceLine: element.sourceLine,
      fix: 'Remove the autoFocus attribute. If focus management is needed, use a ref with useEffect for controlled focus.',
      copilotPrompt: `Look at line ${element.line}. The <${element.rawName}> element uses autoFocus which is an accessibility anti-pattern — it disrupts screen reader announcements and confuses keyboard-only users who expect focus to start at the top of the page. Remove the autoFocus attribute. If you need to manage focus (e.g., in a modal or after navigation), replace it with a React ref and useEffect to focus the element after mount, with a comment explaining why focus management is needed.`,
    };
  },
};
