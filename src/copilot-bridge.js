import { spawn, execFileSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import chalk from 'chalk';
import {
  printAutoFixStatus,
  printAutoFixSummary,
  printCopilotBridgeHeader,
  printError,
  printInfo,
} from './reporter.js';
import { relativePath } from './scanner.js';

/**
 * Resolve the full path to the copilot CLI binary.
 * Checks common install locations and PATH.
 * @returns {string|null}
 */
function resolveCopilotPath() {
  // Try which/where first
  try {
    const result = execFileSync('which', ['copilot'], { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] }).trim();
    if (result) return result;
  } catch { /* not in PATH */ }

  // Check VS Code global storage (common install location)
  const homeDir = process.env.HOME || process.env.USERPROFILE || '';
  const vscodeLocations = [
    path.join(homeDir, 'Library/Application Support/Code/User/globalStorage/github.copilot-chat/copilotCli/copilot'),
    path.join(homeDir, '.local/share/Code/User/globalStorage/github.copilot-chat/copilotCli/copilot'),
    path.join(homeDir, 'AppData/Roaming/Code/User/globalStorage/github.copilot-chat/copilotCli/copilot.exe'),
  ];

  for (const loc of vscodeLocations) {
    if (fs.existsSync(loc)) return loc;
  }

  return null;
}

// Cache the resolved path
let _copilotPath = undefined;

/**
 * Get the copilot CLI path (cached)
 * @returns {string|null}
 */
function getCopilotPath() {
  if (_copilotPath === undefined) {
    _copilotPath = resolveCopilotPath();
  }
  return _copilotPath;
}

/**
 * Check if GitHub Copilot CLI is installed and available
 * @returns {Promise<boolean>}
 */
export async function isCopilotCLIAvailable() {
  const copilotPath = getCopilotPath();
  if (!copilotPath) return false;

  return new Promise((resolve) => {
    const proc = spawn(copilotPath, ['--version'], {
      stdio: 'pipe',
      timeout: 10000,
    });

    proc.on('error', () => resolve(false));
    proc.on('close', (code) => resolve(code === 0));

    setTimeout(() => {
      try { proc.kill(); } catch {}
      resolve(false);
    }, 10000);
  });
}

/**
 * Invoke GitHub Copilot CLI to fix a single accessibility issue in a file.
 *
 * Strategy:
 * 1. Build a precise, context-rich prompt for Copilot CLI
 * 2. Spawn `copilot` with the prompt
 * 3. Let Copilot edit the file directly
 * 4. Return success/failure status
 *
 * @param {string} filePath - Absolute path to the file
 * @param {object} issue - Issue object from a rule check
 * @param {object} [options] - Options
 * @param {boolean} [options.dryRun] - If true, print the command but don't execute
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function fixWithCopilot(filePath, issue, options = {}) {
  const relPath = relativePath(filePath);

  // Build the prompt — this is critical for quality fixes
  const prompt = buildFixPrompt(relPath, issue);

  if (options.dryRun) {
    return { success: true, dryRun: true, prompt };
  }

  const copilotPath = getCopilotPath();
  if (!copilotPath) {
    return { success: false, error: 'Copilot CLI binary not found' };
  }

  return new Promise((resolve) => {
    // Use --prompt for non-interactive mode + --allow-all-tools for auto-approval
    const args = [
      '--prompt', prompt,
      '--allow-all-tools',
    ];

    const proc = spawn(copilotPath, args, {
      cwd: process.cwd(),
      stdio: ['pipe', 'pipe', 'pipe'],
      timeout: 120000, // 2 min timeout per fix
      env: {
        ...process.env,
        TERM: process.env.TERM || 'xterm-256color',
      },
    });

    let stdout = '';
    let stderr = '';

    proc.stdout?.on('data', (data) => {
      stdout += data.toString();
    });

    proc.stderr?.on('data', (data) => {
      stderr += data.toString();
    });

    proc.on('error', (err) => {
      resolve({
        success: false,
        error: `Failed to spawn copilot: ${err.message}`,
      });
    });

    proc.on('close', (code) => {
      if (code === 0) {
        resolve({ success: true, output: stdout });
      } else {
        resolve({
          success: false,
          error: stderr || stdout || `Copilot CLI exited with code ${code}`,
        });
      }
    });

    // Hard timeout
    setTimeout(() => {
      try {
        proc.kill('SIGTERM');
      } catch { /* already dead */ }
      resolve({
        success: false,
        error: 'Copilot CLI timed out (120s)',
      });
    }, 120000);
  });
}

/**
 * Build a precise fix prompt for Copilot CLI
 * @param {string} relPath - Relative file path
 * @param {object} issue - Issue object
 * @returns {string} The prompt string
 */
function buildFixPrompt(relPath, issue) {
  return [
    `In file "${relPath}" at line ${issue.line},`,
    `fix this accessibility issue: ${issue.message}.`,
    issue.copilotPrompt,
    `Only modify the minimum code necessary. Do not change functionality or styling.`,
    `Do not add comments explaining the change.`,
  ].join(' ');
}

/**
 * Fix all issues in a file by batching them into a single Copilot CLI call
 * @param {string} filePath - Absolute file path
 * @param {object[]} issues - Issues in this file
 * @param {object} [options]
 * @returns {Promise<{fixed: number, failed: number}>}
 */
export async function fixFileIssues(filePath, issues, options = {}) {
  const relPath = relativePath(filePath);
  let fixed = 0;
  let failed = 0;

  // Strategy: batch all issues for one file into a single copilot call
  // This is more efficient and gives copilot better context
  if (issues.length > 1 && !options.oneByOne) {
    const batchResult = await fixBatchWithCopilot(filePath, issues, options);
    return batchResult;
  }

  // Single issue per call fallback
  for (const issue of issues) {
    printAutoFixStatus(relPath, issue, 'start');

    const result = await fixWithCopilot(filePath, issue, options);

    if (result.success) {
      printAutoFixStatus(relPath, issue, 'success');
      fixed++;
    } else {
      printAutoFixStatus(relPath, issue, 'error', result.error);
      failed++;
    }
  }

  return { fixed, failed };
}

/**
 * Batch fix: send all issues for a file in one Copilot CLI call
 * @param {string} filePath
 * @param {object[]} issues
 * @param {object} [options]
 * @returns {Promise<{fixed: number, failed: number}>}
 */
async function fixBatchWithCopilot(filePath, issues, options = {}) {
  const relPath = relativePath(filePath);

  // Build a comprehensive prompt for all issues
  const issueDescriptions = issues
    .map((issue, i) => `${i + 1}. Line ${issue.line}: ${issue.message}. ${issue.copilotPrompt}`)
    .join('\n');

  const prompt = [
    `In file "${relPath}", fix the following ${issues.length} accessibility issues:`,
    issueDescriptions,
    `Fix all issues. Only modify the minimum code necessary.`,
    `Do not change functionality or visual styling.`,
    `Do not add comments explaining the changes.`,
  ].join('\n');

  if (options.dryRun) {
    for (const issue of issues) {
      printAutoFixStatus(relPath, issue, 'start');
      console.log(chalk.dim(`    [dry-run] Would send to Copilot CLI`));
    }
    return { fixed: issues.length, failed: 0 };
  }

  // Print start for all issues
  for (const issue of issues) {
    printAutoFixStatus(relPath, issue, 'start');
  }

  const result = await fixWithCopilot(filePath, { ...issues[0], copilotPrompt: prompt, message: `${issues.length} accessibility issues` }, options);

  if (result.success) {
    for (const issue of issues) {
      printAutoFixStatus(relPath, issue, 'success');
    }
    return { fixed: issues.length, failed: 0 };
  } else {
    // Batch failed — try one by one
    printInfo('Batch fix failed, trying individual fixes...');
    let fixed = 0;
    let failed = 0;

    for (const issue of issues) {
      const singleResult = await fixWithCopilot(filePath, issue, options);
      if (singleResult.success) {
        printAutoFixStatus(relPath, issue, 'success');
        fixed++;
      } else {
        printAutoFixStatus(relPath, issue, 'error', singleResult.error);
        failed++;
      }
    }

    return { fixed, failed };
  }
}

/**
 * Run auto-fix on all issues across all files
 * @param {Map<string, object[]>} issuesByFile - Map of filePath → issues[]
 * @param {object} [options]
 * @returns {Promise<{totalFixed: number, totalFailed: number}>}
 */
export async function autoFixAll(issuesByFile, options = {}) {
  printCopilotBridgeHeader();

  // Check if copilot CLI is available
  const available = await isCopilotCLIAvailable();
  if (!available) {
    printError(
      'GitHub Copilot CLI is not installed or not in PATH.\n' +
      '  Install it: https://github.com/github/copilot-cli\n' +
      '  Then run: copilot auth login'
    );
    return { totalFixed: 0, totalFailed: 0 };
  }

  printInfo(`Copilot CLI detected ${chalk.green('✔')}\n`);

  let totalFixed = 0;
  let totalFailed = 0;

  for (const [filePath, issues] of issuesByFile) {
    const { fixed, failed } = await fixFileIssues(filePath, issues, options);
    totalFixed += fixed;
    totalFailed += failed;
  }

  const total = totalFixed + totalFailed;
  printAutoFixSummary(totalFixed, totalFailed, total);

  return { totalFixed, totalFailed };
}

/**
 * Generate fix prompts (Option A fallback) without invoking Copilot CLI
 * @param {string} filePath
 * @param {object} issue
 * @returns {string} The copilot CLI command
 */
export function generateFixCommand(filePath, issue) {
  const relPath = relativePath(filePath);
  const prompt = buildFixPrompt(relPath, issue);
  return `copilot "${prompt}"`;
}
