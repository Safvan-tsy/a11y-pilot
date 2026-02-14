import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Recursively walk a directory and return file paths matching given extensions.
 * Respects common ignore patterns (node_modules, .git, dist, build, etc.)
 */
const IGNORE_DIRS = new Set([
  'node_modules', '.git', 'dist', 'build', '.next', '.nuxt',
  'coverage', '.cache', '.turbo', 'out', '.output', 'vendor',
  '__pycache__', '.svelte-kit', 'storybook-static'
]);

const SUPPORTED_EXTENSIONS = new Set([
  '.html', '.htm', '.jsx', '.tsx', '.vue', '.astro', '.svelte'
]);

/**
 * Walk directory tree and collect scannable files
 * @param {string} dir - Directory to walk
 * @param {string[]} [extensions] - File extensions to include
 * @returns {string[]} Array of absolute file paths
 */
export function walkDir(dir, extensions = null) {
  const allowedExts = extensions
    ? new Set(extensions.map(e => e.startsWith('.') ? e : `.${e}`))
    : SUPPORTED_EXTENSIONS;

  const results = [];

  function walk(currentDir) {
    let entries;
    try {
      entries = fs.readdirSync(currentDir, { withFileTypes: true });
    } catch {
      return; // skip unreadable dirs
    }

    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);

      if (entry.isDirectory()) {
        if (!IGNORE_DIRS.has(entry.name) && !entry.name.startsWith('.')) {
          walk(fullPath);
        }
      } else if (entry.isFile()) {
        const ext = path.extname(entry.name).toLowerCase();
        if (allowedExts.has(ext)) {
          results.push(fullPath);
        }
      }
    }
  }

  // If dir is actually a file, check it directly
  const stat = fs.statSync(dir);
  if (stat.isFile()) {
    const ext = path.extname(dir).toLowerCase();
    if (allowedExts.has(ext)) {
      return [path.resolve(dir)];
    }
    return [];
  }

  walk(dir);
  return results.sort();
}

/**
 * Read file content safely
 * @param {string} filePath
 * @returns {string|null}
 */
export function readFileSafe(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf-8');
  } catch {
    return null;
  }
}

/**
 * Determine file type from extension
 * @param {string} filePath
 * @returns {'jsx'|'html'|'vue'|'unknown'}
 */
export function getFileType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (['.jsx', '.tsx'].includes(ext)) return 'jsx';
  if (['.html', '.htm'].includes(ext)) return 'html';
  if (['.vue', '.svelte', '.astro'].includes(ext)) return 'html'; // template-based
  return 'unknown';
}

/**
 * Get relative path from cwd
 * @param {string} absolutePath
 * @returns {string}
 */
export function relativePath(absolutePath) {
  return path.relative(process.cwd(), absolutePath);
}
