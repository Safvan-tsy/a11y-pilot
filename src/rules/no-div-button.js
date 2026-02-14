/**
 * Rule: no-div-button
 * Interactive elements should use semantic HTML, not divs/spans with click handlers.
 * WCAG 4.1.2 — Name, Role, Value (Level A)
 * WCAG 2.1.1 — Keyboard (Level A)
 */
export default {
  id: 'no-div-button',
  description: 'Non-interactive elements (<div>, <span>) with click handlers should use <button> or <a>',
  severity: 'error',
  wcag: '4.1.2, 2.1.1',
  impact: 'Keyboard users cannot interact with div/span elements. Screen readers do not announce them as interactive.',
  url: 'https://www.w3.org/WAI/WCAG21/Understanding/keyboard.html',

  check(element) {
    const nonInteractive = ['div', 'span', 'section', 'article', 'li', 'td'];
    if (!nonInteractive.includes(element.name)) return null;
    if (element.hasAttributes['...spread']) return null;

    // Check for click handler (JSX: onClick, HTML: onclick)
    const hasClick = 'onClick' in element.attributes ||
                     'onclick' in element.attributes ||
                     'onKeyDown' in element.attributes ||
                     'onkeydown' in element.attributes ||
                     'onKeyUp' in element.attributes ||
                     'onkeyup' in element.attributes ||
                     'onKeyPress' in element.attributes ||
                     'onkeypress' in element.attributes;

    if (!hasClick) return null;

    const hasRole = 'role' in element.attributes;
    const hasTabIndex = 'tabIndex' in element.attributes || 'tabindex' in element.attributes;

    // Issue if has click but missing role AND tabIndex
    if (!hasRole || !hasTabIndex) {
      const missing = [];
      if (!hasRole) missing.push('role');
      if (!hasTabIndex) missing.push('tabIndex');

      return {
        ruleId: this.id,
        severity: this.severity,
        message: `<${element.rawName}> has a click handler but is missing ${missing.join(' and ')}. Use a <button> instead.`,
        line: element.line,
        sourceLine: element.sourceLine,
        fix: `Replace this <${element.rawName}> with a <button> element, or add role="button" and tabIndex={0}`,
        copilotPrompt: `Look at line ${element.line}. There is a <${element.rawName}> element with a click handler (onClick) but it is not keyboard-accessible. This is a serious accessibility violation. Replace the <${element.rawName}> with a <button> element. Move the onClick to the button. Remove any role or tabIndex attributes — native buttons handle this automatically. Make sure to preserve the styling by adding className or style if needed. If the element is meant to navigate, use <a> instead.`,
      };
    }

    return null;
  },
};
