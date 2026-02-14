/**
 * Rule: anchor-content
 * Anchor links must have discernible text.
 * WCAG 2.4.4 — Link Purpose in Context (Level A)
 * WCAG 4.1.2 — Name, Role, Value (Level A)
 */
export default {
  id: 'anchor-content',
  description: '<a> elements must have text content or aria-label',
  severity: 'error',
  wcag: '2.4.4, 4.1.2',
  impact: 'Screen readers announce "link" without a name, making navigation impossible',
  url: 'https://www.w3.org/WAI/WCAG21/Understanding/link-purpose-in-context.html',

  check(element) {
    if (element.name !== 'a') return null;
    if (element.hasAttributes['...spread']) return null;

    // Must have href to be a link (otherwise it might be an anchor target)
    const hasHref = 'href' in element.attributes;
    if (!hasHref) return null;

    const hasAriaLabel = 'aria-label' in element.attributes || 'ariaLabel' in element.attributes;
    const hasAriaLabelledBy = 'aria-labelledby' in element.attributes || 'ariaLabelledby' in element.attributes;
    const hasTitle = 'title' in element.attributes;
    const hasText = element.hasTextChildren;
    const hasAriaHidden = element.attributes['aria-hidden'] === 'true' || element.attributes['ariaHidden'] === 'true';

    // Skip if aria-hidden (intentionally hidden from screen readers)
    if (hasAriaHidden) return null;

    if (!hasAriaLabel && !hasAriaLabelledBy && !hasTitle && !hasText) {
      return {
        ruleId: this.id,
        severity: this.severity,
        message: '<a> element has no accessible name (no text content, aria-label, or title)',
        line: element.line,
        sourceLine: element.sourceLine,
        fix: 'Add text content inside the link, or add an aria-label attribute describing the link destination',
        copilotPrompt: `Look at line ${element.line}. There is an <a> (anchor/link) element without any accessible text. Screen readers will announce it as just "link" with no context. Add an aria-label attribute that describes where the link goes or what it does. If it wraps an image, make sure the image has appropriate alt text. If it's an icon link, add aria-label like "Open in new tab" or "Go to homepage".`,
      };
    }

    return null;
  },
};
