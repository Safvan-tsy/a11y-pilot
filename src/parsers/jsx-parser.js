import { parse } from '@babel/parser';
import _traverse from '@babel/traverse';

// Handle ESM default export quirk with @babel/traverse
const traverse = _traverse.default || _traverse;

/**
 * Parse JSX/TSX content into a Babel AST
 * @param {string} code - Source code content
 * @param {string} filePath - File path (used for error context)
 * @returns {object|null} Babel AST or null on parse failure
 */
export function parseJSX(code, filePath) {
  try {
    const ast = parse(code, {
      sourceType: 'module',
      plugins: [
        'jsx',
        'typescript',
        'decorators-legacy',
        'classProperties',
        'optionalChaining',
        'nullishCoalescingOperator',
        'dynamicImport',
        'exportDefaultFrom',
      ],
      errorRecovery: true, // Don't crash on minor syntax issues
    });
    return ast;
  } catch (err) {
    // Silently skip unparseable files
    return null;
  }
}

/**
 * Walk the AST and collect JSX elements with their attributes and location info
 * @param {object} ast - Babel AST
 * @param {string} code - Original source code
 * @returns {object[]} Array of element info objects
 */
export function collectJSXElements(ast, code) {
  const elements = [];
  const lines = code.split('\n');

  traverse(ast, {
    JSXOpeningElement(path) {
      const node = path.node;
      const name = getElementName(node.name);
      if (!name) return;

      const attributes = {};
      const hasAttributes = {};

      for (const attr of node.attributes) {
        if (attr.type === 'JSXAttribute') {
          const attrName = attr.name?.name || '';
          hasAttributes[attrName] = true;

          if (attr.value) {
            if (attr.value.type === 'StringLiteral') {
              attributes[attrName] = attr.value.value;
            } else if (attr.value.type === 'JSXExpressionContainer') {
              attributes[attrName] = '{expression}'; // placeholder
            }
          } else {
            attributes[attrName] = true; // boolean attribute
          }
        } else if (attr.type === 'JSXSpreadAttribute') {
          hasAttributes['...spread'] = true;
        }
      }

      // Get children info
      const parent = path.parentPath?.node;
      const children = parent?.children || [];
      const hasTextChildren = children.some(
        child =>
          (child.type === 'JSXText' && child.value.trim().length > 0) ||
          child.type === 'JSXExpressionContainer' ||
          child.type === 'JSXElement'
      );

      const line = node.loc?.start?.line || 0;
      const column = node.loc?.start?.column || 0;
      const sourceLine = lines[line - 1] || '';

      elements.push({
        name: name.toLowerCase(),
        rawName: name,
        attributes,
        hasAttributes,
        hasTextChildren,
        children,
        line,
        column,
        sourceLine: sourceLine.trim(),
        selfClosing: node.selfClosing,
      });
    },
  });

  return elements;
}

/**
 * Extract element name from JSX name node
 */
function getElementName(nameNode) {
  if (!nameNode) return null;
  if (nameNode.type === 'JSXIdentifier') return nameNode.name;
  if (nameNode.type === 'JSXMemberExpression') {
    return `${getElementName(nameNode.object)}.${nameNode.property?.name}`;
  }
  if (nameNode.type === 'JSXNamespacedName') {
    return `${nameNode.namespace?.name}:${nameNode.name?.name}`;
  }
  return null;
}

/**
 * Collect heading elements in order for heading-order rule
 * @param {object[]} elements - Collected JSX elements
 * @returns {object[]} Heading elements with their levels
 */
export function collectHeadings(elements) {
  return elements
    .filter(el => /^h[1-6]$/.test(el.name))
    .map(el => ({
      level: parseInt(el.name[1]),
      line: el.line,
      sourceLine: el.sourceLine,
    }));
}
