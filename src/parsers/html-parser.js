import { Parser } from 'htmlparser2';

/**
 * Parse HTML content and collect elements with their attributes and locations.
 * Since htmlparser2 doesn't track line numbers natively, we compute them from
 * the source by tracking character offsets.
 *
 * @param {string} html - HTML source code
 * @returns {object[]} Array of element info objects
 */
export function parseHTML(html) {
  const elements = [];
  const lines = html.split('\n');

  // Build a line offset map for position tracking
  const lineOffsets = [];
  let offset = 0;
  for (const line of lines) {
    lineOffsets.push(offset);
    offset += line.length + 1; // +1 for newline
  }

  function getLineFromIndex(index) {
    for (let i = lineOffsets.length - 1; i >= 0; i--) {
      if (index >= lineOffsets[i]) return i + 1; // 1-indexed
    }
    return 1;
  }

  // We need to track positions ourselves
  const tagStack = [];
  let currentIndex = 0;
  let lastOpenTag = null;

  const parser = new Parser(
    {
      onopentag(name, attribs) {
        // Find this tag in the source to get its line number
        const tagPattern = new RegExp(`<${escapeRegex(name)}[\\s>/]`, 'gi');
        let match;
        let bestMatch = null;

        // Find the match closest to (but after) current position
        while ((match = tagPattern.exec(html)) !== null) {
          if (match.index >= currentIndex) {
            bestMatch = match;
            break;
          }
        }

        const line = bestMatch ? getLineFromIndex(bestMatch.index) : 0;
        const sourceLine = line > 0 ? lines[line - 1]?.trim() || '' : '';

        if (bestMatch) {
          currentIndex = bestMatch.index + 1;
        }

        const element = {
          name: name.toLowerCase(),
          rawName: name,
          attributes: { ...attribs },
          hasAttributes: Object.fromEntries(
            Object.keys(attribs).map(k => [k, true])
          ),
          hasTextChildren: false,
          children: [],
          line,
          column: 0,
          sourceLine,
          selfClosing: false,
        };

        tagStack.push(element);
        lastOpenTag = element;
      },

      ontext(text) {
        if (tagStack.length > 0 && text.trim().length > 0) {
          tagStack[tagStack.length - 1].hasTextChildren = true;
        }
      },

      onclosetag(name) {
        if (tagStack.length > 0) {
          const element = tagStack.pop();
          elements.push(element);
        }
      },

      onselfclosingtag(name) {
        // Handled by onclosetag in htmlparser2
      },
    },
    {
      recognizeSelfClosing: true,
      lowerCaseTags: true,
      lowerCaseAttributeNames: true,
    }
  );

  parser.write(html);
  parser.end();

  return elements;
}

/**
 * Collect heading elements from parsed HTML elements
 * @param {object[]} elements
 * @returns {object[]} Heading elements with levels
 */
export function collectHTMLHeadings(elements) {
  return elements
    .filter(el => /^h[1-6]$/.test(el.name))
    .map(el => ({
      level: parseInt(el.name[1]),
      line: el.line,
      sourceLine: el.sourceLine,
    }));
}

function escapeRegex(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
