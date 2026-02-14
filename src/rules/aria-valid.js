/**
 * Rule: aria-valid
 * Validates ARIA roles, states, and properties.
 * WCAG 4.1.2 — Name, Role, Value (Level A)
 */

const VALID_ROLES = new Set([
  'alert', 'alertdialog', 'application', 'article', 'banner', 'button',
  'cell', 'checkbox', 'columnheader', 'combobox', 'complementary',
  'contentinfo', 'definition', 'dialog', 'directory', 'document',
  'feed', 'figure', 'form', 'grid', 'gridcell', 'group', 'heading',
  'img', 'link', 'list', 'listbox', 'listitem', 'log', 'main',
  'marquee', 'math', 'menu', 'menubar', 'menuitem', 'menuitemcheckbox',
  'menuitemradio', 'meter', 'navigation', 'none', 'note', 'option',
  'presentation', 'progressbar', 'radio', 'radiogroup', 'region',
  'row', 'rowgroup', 'rowheader', 'scrollbar', 'search', 'searchbox',
  'separator', 'slider', 'spinbutton', 'status', 'switch', 'tab',
  'table', 'tablist', 'tabpanel', 'term', 'textbox', 'timer',
  'toolbar', 'tooltip', 'tree', 'treegrid', 'treeitem',
]);

const VALID_ARIA_ATTRS = new Set([
  'aria-activedescendant', 'aria-atomic', 'aria-autocomplete',
  'aria-braillelabel', 'aria-brailleroledescription', 'aria-busy',
  'aria-checked', 'aria-colcount', 'aria-colindex', 'aria-colindextext',
  'aria-colspan', 'aria-controls', 'aria-current', 'aria-describedby',
  'aria-description', 'aria-details', 'aria-disabled', 'aria-dropeffect',
  'aria-errormessage', 'aria-expanded', 'aria-flowto', 'aria-grabbed',
  'aria-haspopup', 'aria-hidden', 'aria-invalid', 'aria-keyshortcuts',
  'aria-label', 'aria-labelledby', 'aria-level', 'aria-live',
  'aria-modal', 'aria-multiline', 'aria-multiselectable', 'aria-orientation',
  'aria-owns', 'aria-placeholder', 'aria-posinset', 'aria-pressed',
  'aria-readonly', 'aria-relevant', 'aria-required', 'aria-roledescription',
  'aria-rowcount', 'aria-rowindex', 'aria-rowindextext', 'aria-rowspan',
  'aria-selected', 'aria-setsize', 'aria-sort', 'aria-valuemax',
  'aria-valuemin', 'aria-valuenow', 'aria-valuetext',
]);

// Elements that should NOT have role="presentation" or role="none" if they are interactive
const INTERACTIVE_ELEMENTS = new Set([
  'a', 'button', 'input', 'select', 'textarea',
]);

export default {
  id: 'aria-valid',
  description: 'Validates ARIA roles, states, and properties for correct usage',
  severity: 'error',
  wcag: '4.1.2',
  impact: 'Invalid ARIA attributes confuse screen readers and can make content completely inaccessible',
  url: 'https://www.w3.org/WAI/WCAG21/Understanding/name-role-value.html',

  check(element) {
    if (element.hasAttributes['...spread']) return null;

    const attrs = element.attributes;
    const has = element.hasAttributes;

    // Check 1: Invalid role value
    const role = attrs['role'];
    if (role && role !== '{expression}' && !VALID_ROLES.has(role.toLowerCase())) {
      return {
        ruleId: this.id,
        severity: 'error',
        message: `Invalid ARIA role="${role}" on <${element.rawName}>`,
        line: element.line,
        sourceLine: element.sourceLine,
        fix: `Use a valid ARIA role. Common roles: button, link, navigation, dialog, alert, status`,
        copilotPrompt: `Look at line ${element.line}. The <${element.rawName}> element has an invalid ARIA role="${role}". Replace it with a valid ARIA role that matches the element's purpose, or remove the role attribute entirely and use a semantic HTML element instead.`,
      };
    }

    // Check 2: role="presentation" or role="none" on interactive elements
    if (role && (role === 'presentation' || role === 'none') && INTERACTIVE_ELEMENTS.has(element.name)) {
      return {
        ruleId: this.id,
        severity: 'error',
        message: `role="${role}" on interactive <${element.rawName}> removes its semantics from the accessibility tree`,
        line: element.line,
        sourceLine: element.sourceLine,
        fix: `Remove role="${role}" from interactive elements — it strips their accessibility semantics`,
        copilotPrompt: `Look at line ${element.line}. The <${element.rawName}> element has role="${role}" which removes it from the accessibility tree. Interactive elements like <${element.rawName}> must not have role="presentation" or role="none". Remove the role attribute so screen readers can properly interact with this element.`,
      };
    }

    // Check 3: Invalid aria-* attributes
    for (const attr of Object.keys(attrs)) {
      if (attr.startsWith('aria-') && !VALID_ARIA_ATTRS.has(attr.toLowerCase())) {
        return {
          ruleId: this.id,
          severity: 'error',
          message: `Invalid ARIA attribute "${attr}" on <${element.rawName}>`,
          line: element.line,
          sourceLine: element.sourceLine,
          fix: `Remove or replace "${attr}" with a valid ARIA attribute`,
          copilotPrompt: `Look at line ${element.line}. The <${element.rawName}> element has an invalid ARIA attribute "${attr}". This attribute is not recognized by assistive technologies. Remove it or replace it with the correct ARIA attribute for the intended behavior.`,
        };
      }
    }

    // Check 4: Conflicting aria-hidden="true" with aria-label
    if (attrs['aria-hidden'] === 'true' && (has['aria-label'] || has['aria-labelledby'])) {
      return {
        ruleId: this.id,
        severity: 'warning',
        message: `<${element.rawName}> has aria-hidden="true" with aria-label — the label will be ignored`,
        line: element.line,
        sourceLine: element.sourceLine,
        fix: `Remove either aria-hidden or the aria-label — they conflict`,
        copilotPrompt: `Look at line ${element.line}. The <${element.rawName}> has both aria-hidden="true" and an aria-label. This is contradictory — aria-hidden hides the element from screen readers, so the label serves no purpose. Remove one: if the element should be hidden, remove aria-label; if it should be labelled, remove aria-hidden.`,
      };
    }

    return null;
  },
};
