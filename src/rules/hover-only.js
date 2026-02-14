/**
 * Rule: hover-only
 * UI elements with mouse hover interactions must have keyboard/focus equivalents.
 * WCAG 2.1.1 — Keyboard (Level A)
 * WCAG 1.4.13 — Content on Hover or Focus (Level AA)
 */
export default {
  id: 'hover-only',
  description: 'Elements with hover interactions must also respond to keyboard focus',
  severity: 'error',
  wcag: '2.1.1, 1.4.13',
  impact: 'Keyboard and touch users cannot access UI that only appears or activates on mouse hover',
  url: 'https://www.w3.org/WAI/WCAG21/Understanding/content-on-hover-or-focus.html',

  check(element) {
    if (element.hasAttributes['...spread']) return null;

    const has = element.hasAttributes;

    // Check for hover-only patterns
    const hasMouseEnter = has['onMouseEnter'] || has['onmouseenter'];
    const hasMouseOver = has['onMouseOver'] || has['onmouseover'];
    const hasMouseLeave = has['onMouseLeave'] || has['onmouseleave'];
    const hasHover = hasMouseEnter || hasMouseOver || hasMouseLeave;

    if (!hasHover) return null;

    // Check for focus/blur equivalents
    const hasFocus = has['onFocus'] || has['onfocus'];
    const hasBlur = has['onBlur'] || has['onblur'];
    const hasFocusEquivalent = hasFocus || hasBlur;

    if (!hasFocusEquivalent) {
      const hoverType = hasMouseEnter ? 'onMouseEnter' : hasMouseOver ? 'onMouseOver' : 'onMouseLeave';
      return {
        ruleId: this.id,
        severity: this.severity,
        message: `<${element.rawName}> has ${hoverType} but no onFocus/onBlur equivalent for keyboard users`,
        line: element.line,
        sourceLine: element.sourceLine,
        fix: 'Add onFocus and onBlur handlers that mirror the hover behavior',
        copilotPrompt: `Look at line ${element.line}. The <${element.rawName}> element has mouse hover handlers (${hoverType}) but no keyboard focus equivalents. Keyboard and touch users cannot trigger hover interactions. Add onFocus and onBlur handlers that provide the same behavior as onMouseEnter/onMouseLeave. For example, if hovering shows a tooltip or dropdown, the same should happen on focus. Also ensure the element is focusable with tabIndex={0} if it isn't natively focusable.`,
      };
    }

    return null;
  },
};
