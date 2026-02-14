/**
 * Rule: img-alt
 * Images must have an alt attribute for screen readers.
 * WCAG 1.1.1 — Non-text Content (Level A)
 */
export default {
  id: 'img-alt',
  description: '<img> elements must have an alt attribute',
  severity: 'error',
  wcag: '1.1.1',
  impact: 'Screen readers cannot describe the image to visually impaired users',
  url: 'https://www.w3.org/WAI/WCAG21/Understanding/non-text-content.html',

  /**
   * @param {object} element - Parsed element info
   * @returns {object|null} Issue object or null
   */
  check(element) {
    if (element.name !== 'img') return null;

    // Skip if spread attributes (might contain alt)
    if (element.hasAttributes['...spread']) return null;

    const hasAlt = 'alt' in element.attributes;

    if (!hasAlt) {
      return {
        ruleId: this.id,
        severity: this.severity,
        message: '<img> is missing the `alt` attribute',
        line: element.line,
        sourceLine: element.sourceLine,
        fix: 'Add alt="descriptive text" or alt="" if the image is decorative',
        copilotPrompt: `Look at line ${element.line}. There is an <img> tag without an alt attribute. Add a descriptive alt attribute based on the surrounding context. If the image appears to be decorative (like an icon next to text), use alt="". Make sure the alt text is meaningful and concise.`,
      };
    }

    return null;
  },
};
