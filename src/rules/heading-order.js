/**
 * Rule: heading-order
 * Heading levels should not skip (e.g., h1 → h3 without h2).
 * WCAG 1.3.1 — Info and Relationships (Level A)
 *
 * This rule is special — it operates on ALL headings in a file, not individual elements.
 */
export default {
  id: 'heading-order',
  description: 'Heading levels should increase sequentially without skipping',
  severity: 'warning',
  wcag: '1.3.1',
  impact: 'Screen reader users rely on heading hierarchy to navigate and understand page structure',
  url: 'https://www.w3.org/WAI/WCAG21/Understanding/info-and-relationships.html',

  /**
   * This rule doesn't check individual elements — it uses checkFile instead.
   */
  check() {
    return null;
  },

  /**
   * Check heading order across an entire file
   * @param {object[]} headings - Array of {level, line, sourceLine}
   * @returns {object[]} Array of issues
   */
  checkHeadings(headings) {
    if (headings.length === 0) return [];

    const issues = [];
    let prevLevel = 0;

    for (const heading of headings) {
      if (prevLevel > 0 && heading.level > prevLevel + 1) {
        issues.push({
          ruleId: this.id,
          severity: this.severity,
          message: `Heading level skipped: <h${prevLevel}> → <h${heading.level}> (missing <h${prevLevel + 1}>)`,
          line: heading.line,
          sourceLine: heading.sourceLine,
          fix: `Change this to <h${prevLevel + 1}> or add the missing heading levels`,
          copilotPrompt: `Look at line ${heading.line}. The heading level jumps from h${prevLevel} to h${heading.level}, skipping h${prevLevel + 1}. This breaks the document outline for screen reader users. Adjust the heading level to h${prevLevel + 1} to maintain a proper heading hierarchy. Check the surrounding headings in the file to ensure the entire heading structure is sequential.`,
        });
      }
      prevLevel = heading.level;
    }

    return issues;
  },
};
