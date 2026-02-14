import imgAlt from './img-alt.js';
import buttonContent from './button-content.js';
import noDivButton from './no-div-button.js';
import formLabel from './form-label.js';
import headingOrder from './heading-order.js';
import anchorContent from './anchor-content.js';
import noAutofocus from './no-autofocus.js';
import semanticNav from './semantic-nav.js';
import ariaValid from './aria-valid.js';
import keyboardHandlers from './keyboard-handlers.js';
import landmarkRegions from './landmark-regions.js';
import ariaHiddenFocus from './aria-hidden-focus.js';
import hoverOnly from './hover-only.js';
import disabledState from './disabled-state.js';
import tabindexPositive from './tabindex-positive.js';

/**
 * All available a11y rules.
 * Each rule exports: id, description, severity, check(element), and optional file-level checks.
 */
export const allRules = [
  imgAlt,
  buttonContent,
  noDivButton,
  formLabel,
  headingOrder,
  anchorContent,
  noAutofocus,
  semanticNav,
  ariaValid,
  keyboardHandlers,
  landmarkRegions,
  ariaHiddenFocus,
  hoverOnly,
  disabledState,
  tabindexPositive,
];

/**
 * Get rules filtered by IDs
 * @param {string[]|null} ruleIds - Rule IDs to include. null = all rules.
 * @returns {object[]}
 */
export function getRules(ruleIds = null) {
  if (!ruleIds) return allRules;
  const ids = new Set(ruleIds);
  return allRules.filter(r => ids.has(r.id));
}

/**
 * Get a single rule by ID
 * @param {string} id
 * @returns {object|undefined}
 */
export function getRule(id) {
  return allRules.find(r => r.id === id);
}
