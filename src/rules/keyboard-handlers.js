/**
 * Rule: keyboard-handlers
 * Interactive elements with onClick must also handle keyboard events (Enter/Space).
 * WCAG 2.1.1 — Keyboard (Level A)
 * WCAG 2.1.3 — Keyboard (No Exception) (Level AAA)
 */
export default {
  id: 'keyboard-handlers',
  description: 'Elements with click handlers must also have keyboard event handlers',
  severity: 'error',
  wcag: '2.1.1',
  impact: 'Keyboard-only users cannot activate elements that only respond to mouse clicks',
  url: 'https://www.w3.org/WAI/WCAG21/Understanding/keyboard.html',

  check(element) {
    if (element.hasAttributes['...spread']) return null;

    // Native interactive elements handle keyboard events automatically
    const nativeInteractive = new Set(['button', 'a', 'input', 'select', 'textarea', 'summary', 'details']);
    if (nativeInteractive.has(element.name)) return null;

    const has = element.hasAttributes;

    // Check if element has click handler
    const hasClick = has['onClick'] || has['onclick'];
    if (!hasClick) return null;

    // Check for keyboard handlers
    const hasKeyDown = has['onKeyDown'] || has['onkeydown'];
    const hasKeyUp = has['onKeyUp'] || has['onkeyup'];
    const hasKeyPress = has['onKeyPress'] || has['onkeypress'];
    const hasKeyHandler = hasKeyDown || hasKeyUp || hasKeyPress;

    // Has role="button" or role="link" but no keyboard handler
    const role = element.attributes['role'];
    const hasInteractiveRole = role === 'button' || role === 'link' || role === 'menuitem' || role === 'tab' || role === 'switch' || role === 'checkbox' || role === 'radio';

    if (!hasKeyHandler) {
      return {
        ruleId: this.id,
        severity: this.severity,
        message: `<${element.rawName}> has onClick but no onKeyDown/onKeyUp handler for keyboard users`,
        line: element.line,
        sourceLine: element.sourceLine,
        fix: 'Add an onKeyDown handler that triggers on Enter and Space keys',
        copilotPrompt: `Look at line ${element.line}. The <${element.rawName}> element has an onClick handler but no keyboard event handler. Keyboard users cannot activate this element. Add an onKeyDown handler that calls the same action when Enter or Space is pressed. Example: onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); /* same action as onClick */ } }}. Also ensure the element has tabIndex={0} and an appropriate role if not already present.`,
      };
    }

    return null;
  },
};
