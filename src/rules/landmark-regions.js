/**
 * Rule: landmark-regions
 * Pages should use landmark regions (<main>, <header>, <footer>, etc.).
 * WCAG 1.3.1 — Info and Relationships (Level A)
 * WCAG 2.4.1 — Bypass Blocks (Level A)
 *
 * This rule is file-level — it checks for the presence of landmark elements.
 */
export default {
  id: 'landmark-regions',
  description: 'Pages should include landmark regions (<main>, <header>, <footer>)',
  severity: 'warning',
  wcag: '1.3.1, 2.4.1',
  impact: 'Screen reader users rely on landmark regions to navigate and understand page structure',
  url: 'https://www.w3.org/WAI/WCAG21/Understanding/bypass-blocks.html',

  check() {
    return null; // File-level rule
  },

  /**
   * Check for missing landmark regions in a file
   * @param {object[]} elements - All parsed elements
   * @param {string} code - Original source code
   * @returns {object[]} Array of issues
   */
  checkLandmarks(elements, code) {
    const issues = [];
    const lines = code.split('\n');

    // Collect present landmarks
    const presentLandmarks = new Set();
    const presentRoles = new Set();

    for (const el of elements) {
      presentLandmarks.add(el.name);
      if (el.attributes['role']) {
        presentRoles.add(el.attributes['role'].toLowerCase());
      }
    }

    // Only check files that look like full pages/layouts
    // Heuristic: has <body>, <html>, or DOCTYPE
    const isPageLike =
      presentLandmarks.has('body') ||
      presentLandmarks.has('html') ||
      code.toLowerCase().includes('<!doctype');

    if (!isPageLike) return issues;

    // Check for <main> or role="main"
    const hasMain = presentLandmarks.has('main') || presentRoles.has('main');
    if (!hasMain) {
      issues.push({
        ruleId: this.id,
        severity: 'warning',
        message: 'Page is missing a <main> landmark — screen readers cannot identify the primary content',
        line: 1,
        sourceLine: lines[0]?.trim() || '',
        fix: 'Wrap the primary content in a <main> element',
        copilotPrompt: `This file appears to be a page or layout component but is missing a <main> landmark element. Identify the primary content area and wrap it in a <main> element. The <main> element should contain the dominant content — not headers, footers, or sidebars. There should be only one <main> per page.`,
      });
    }

    // Check for <header> or role="banner"
    const hasHeader = presentLandmarks.has('header') || presentRoles.has('banner');
    if (!hasHeader && (presentLandmarks.has('nav') || presentLandmarks.has('body'))) {
      issues.push({
        ruleId: this.id,
        severity: 'warning',
        message: 'Page is missing a <header> landmark for site-wide navigation and branding',
        line: 1,
        sourceLine: lines[0]?.trim() || '',
        fix: 'Add a <header> element wrapping the site navigation and branding',
        copilotPrompt: `This file is missing a <header> landmark. Add a <header> element around the top section that contains navigation, logo, or site branding. This helps screen reader users identify the page header region.`,
      });
    }

    // Check for <footer> or role="contentinfo"
    const hasFooter = presentLandmarks.has('footer') || presentRoles.has('contentinfo');
    if (!hasFooter && presentLandmarks.has('body')) {
      issues.push({
        ruleId: this.id,
        severity: 'warning',
        message: 'Page is missing a <footer> landmark for page/site footer content',
        line: 1,
        sourceLine: lines[0]?.trim() || '',
        fix: 'Add a <footer> element wrapping the page footer content',
        copilotPrompt: `This file is missing a <footer> landmark. If there is footer content (copyright, links, contact info), wrap it in a <footer> element. This helps screen reader users quickly navigate to footer information.`,
      });
    }

    return issues;
  },
};
