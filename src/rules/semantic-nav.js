/**
 * Rule: semantic-nav
 * Navigation links should be wrapped in a <nav> landmark element.
 * WCAG 1.3.1 — Info and Relationships (Level A)
 * WCAG 2.4.1 — Bypass Blocks (Level A)
 *
 * This rule checks for groups of links inside non-semantic containers.
 */
export default {
  id: 'semantic-nav',
  description: 'Groups of navigation links should be wrapped in a <nav> element',
  severity: 'warning',
  wcag: '1.3.1, 2.4.1',
  impact: 'Screen reader users cannot identify and skip navigation blocks without <nav> landmarks',
  url: 'https://www.w3.org/WAI/WCAG21/Understanding/bypass-blocks.html',

  /**
   * This rule doesn't check individual elements.
   * It uses checkFile to analyze link patterns.
   */
  check() {
    return null;
  },

  /**
   * Check for navigation-like patterns without <nav>
   * Looks for divs/uls containing multiple anchor links
   * @param {object[]} elements - All parsed elements
   * @param {string} code - Original source code
   * @returns {object[]} Array of issues
   */
  checkNavPatterns(elements, code) {
    const issues = [];
    const lines = code.split('\n');

    // Simple heuristic: look for lines with multiple <a> or <Link> in sequence
    // inside a <div> or <ul> but not inside a <nav>
    let inNav = false;
    let consecutiveLinks = 0;
    let linkStartLine = 0;

    // Check if code contains <nav> at all
    const hasNav = elements.some(el => el.name === 'nav');

    // If there's already a <nav>, skip this check (simplified heuristic)
    if (hasNav) return issues;

    // Count anchor elements — if there are 3+ links and no <nav>, flag it
    const anchorElements = elements.filter(el => el.name === 'a' && 'href' in el.attributes);

    if (anchorElements.length >= 3) {
      // Check if anchors are close together (within 10 lines of each other)
      for (let i = 0; i < anchorElements.length - 2; i++) {
        const a1 = anchorElements[i];
        const a2 = anchorElements[i + 1];
        const a3 = anchorElements[i + 2];

        if (a3.line - a1.line <= 15) {
          issues.push({
            ruleId: this.id,
            severity: this.severity,
            message: `Found ${anchorElements.length} navigation links without a <nav> landmark wrapper`,
            line: a1.line,
            sourceLine: a1.sourceLine,
            fix: 'Wrap these navigation links in a <nav> element with an aria-label',
            copilotPrompt: `Look around line ${a1.line}. There are multiple navigation links (<a> tags) grouped together but not wrapped in a <nav> element. Wrap the group of navigation links in a <nav aria-label="Main navigation"> element (or another appropriate label). This helps screen reader users identify and skip past navigation blocks. Keep the existing structure inside, just add the <nav> wrapper.`,
          });
          break; // Only report once per file
        }
      }
    }

    return issues;
  },
};
