import chalk from 'chalk';
import gradientString from 'gradient-string';
import logSymbols from 'log-symbols';
import boxen from 'boxen';

// ─── Color Palette ───────────────────────────────────────────────────────────
const colors = {
  error: chalk.red,
  warning: chalk.yellow,
  success: chalk.green,
  info: chalk.cyan,
  dim: chalk.dim,
  bold: chalk.bold,
  file: chalk.cyan.bold,
  line: chalk.dim,
  rule: chalk.magenta,
  fix: chalk.green,
  count: chalk.white.bold,
};

// Custom gradient for the banner
const bannerGradient = gradientString('#00d4ff', '#7b2ff7', '#ff2d95');

// ─── Banner ──────────────────────────────────────────────────────────────────

const BANNER = `
   __ _ __ __  __            _ __      __
  / _\` /_ /_ \\/ /  ___  ___(_) /___  / /_
 / /_| || || / _ \\/ _ \\/ / | / / _ \\/ __/
 \\__,_|\\_,_/ / .__/\\___/_/  |_/_/\\___/\\__/
             /_/
`;

/**
 * Print the startup banner
 */
export function printBanner() {
  console.log(bannerGradient(BANNER));
  console.log(
    chalk.dim('  v1.0.0 — AI-powered accessibility scanner')
  );
  console.log(
    chalk.dim('  Powered by GitHub Copilot CLI ✦\n')
  );
}

/**
 * Print scanning progress
 * @param {number} fileCount - Number of files to scan
 */
export function printScanStart(fileCount) {
  console.log(
    `  ${chalk.cyan('⟳')} Scanning ${colors.count(fileCount)} file${fileCount !== 1 ? 's' : ''}...\n`
  );
}

/**
 * Format and print issues for a single file
 * @param {string} filePath - Relative file path
 * @param {object[]} issues - Issues found in this file
 */
export function printFileIssues(filePath, issues) {
  if (issues.length === 0) return;

  console.log(`  ${colors.file(filePath)}`);

  for (const issue of issues) {
    const icon = issue.severity === 'error'
      ? chalk.red('✖')
      : chalk.yellow('⚠');

    const lineNum = colors.line(`L${String(issue.line).padEnd(4)}`);
    const ruleId = colors.rule(issue.ruleId.padEnd(16));
    const message = issue.severity === 'error'
      ? colors.error(issue.message)
      : colors.warning(issue.message);

    console.log(`    ${icon}  ${lineNum} ${ruleId} ${message}`);
  }

  console.log('');
}

/**
 * Print the summary bar at the end
 * @param {object} summary - {errors, warnings, files, totalFiles, fixable}
 */
export function printSummary(summary) {
  const { errors, warnings, files, totalFiles } = summary;
  const total = errors + warnings;

  console.log(chalk.dim('  ' + '─'.repeat(65)));

  if (total === 0) {
    console.log('');
    console.log(
      boxen(
        chalk.green.bold('✨ No accessibility issues found! ✨') +
        '\n\n' +
        chalk.dim(`Scanned ${totalFiles} file${totalFiles !== 1 ? 's' : ''} — all clear!`),
        {
          padding: 1,
          margin: { left: 2 },
          borderColor: 'green',
          borderStyle: 'round',
        }
      )
    );
    return;
  }

  const parts = [];
  if (errors > 0) parts.push(colors.error(`${errors} error${errors !== 1 ? 's' : ''}`));
  if (warnings > 0) parts.push(colors.warning(`${warnings} warning${warnings !== 1 ? 's' : ''}`));

  console.log('');
  console.log(
    `  ${logSymbols.error} Found ${colors.count(total)} issue${total !== 1 ? 's' : ''} ` +
    `(${parts.join(', ')}) ` +
    `in ${colors.count(files)} file${files !== 1 ? 's' : ''} ` +
    colors.dim(`(${totalFiles} scanned)`)
  );
  console.log('');
}

/**
 * Print the fix prompt for a single issue (used with --fix flag)
 * @param {string} filePath
 * @param {object} issue
 */
export function printFixPrompt(filePath, issue) {
  const icon = issue.severity === 'error' ? chalk.red('✖') : chalk.yellow('⚠');

  console.log(`  ${colors.file(filePath)}:${issue.line}  ${colors.rule(issue.ruleId)}`);
  console.log(`  ${icon} ${issue.message}`);
  console.log('');
  const prompt = `In file "${filePath}" at line ${issue.line}, fix this accessibility issue: ${issue.message}. ${issue.copilotPrompt} Only modify the minimum code necessary.`;
  console.log(
    boxen(
      chalk.cyan('copilot ') + chalk.dim('"') +
      chalk.white(prompt) +
      chalk.dim('"'),
      {
        padding: { left: 1, right: 1, top: 0, bottom: 0 },
        margin: { left: 2 },
        borderColor: 'cyan',
        borderStyle: 'round',
        title: '💡 Copilot CLI Fix',
        titleAlignment: 'left',
      }
    )
  );
  console.log('');
}

/**
 * Print auto-fix progress
 * @param {string} filePath
 * @param {object} issue
 * @param {'start'|'success'|'error'} status
 * @param {string} [errorMsg]
 */
export function printAutoFixStatus(filePath, issue, status, errorMsg) {
  const prefix = `  ${colors.file(filePath)}:${issue.line}`;

  switch (status) {
    case 'start':
      console.log(`  ${chalk.cyan('⟳')} Fixing ${colors.rule(issue.ruleId)} in ${colors.file(filePath)}:${issue.line}...`);
      break;
    case 'success':
      console.log(`  ${chalk.green('✔')} Fixed ${colors.rule(issue.ruleId)} in ${colors.file(filePath)}:${issue.line}`);
      break;
    case 'error':
      console.log(`  ${chalk.red('✘')} Failed to fix ${colors.rule(issue.ruleId)} in ${colors.file(filePath)}:${issue.line}`);
      if (errorMsg) {
        console.log(`    ${colors.dim(errorMsg)}`);
      }
      break;
  }
}

/**
 * Print auto-fix summary
 * @param {number} fixed
 * @param {number} failed
 * @param {number} total
 */
export function printAutoFixSummary(fixed, failed, total) {
  console.log('');
  console.log(chalk.dim('  ' + '─'.repeat(65)));
  console.log('');

  if (failed === 0) {
    console.log(
      boxen(
        chalk.green.bold(`✨ All ${fixed} issue${fixed !== 1 ? 's' : ''} fixed with Copilot CLI! ✨`) +
        '\n\n' +
        chalk.dim('Review the changes and commit when satisfied.'),
        {
          padding: 1,
          margin: { left: 2 },
          borderColor: 'green',
          borderStyle: 'round',
        }
      )
    );
  } else {
    console.log(
      `  ${chalk.green('✔')} ${colors.count(fixed)} fixed  ` +
      `${chalk.red('✘')} ${colors.count(failed)} failed  ` +
      colors.dim(`(${total} total)`)
    );
  }
  console.log('');
}

/**
 * Print the rules list
 * @param {object[]} rules
 */
export function printRulesList(rules) {
  printBanner();
  console.log(chalk.bold('  Available Rules:\n'));

  for (const rule of rules) {
    const severityBadge = rule.severity === 'error'
      ? chalk.bgRed.white.bold(` ${rule.severity.toUpperCase()} `)
      : chalk.bgYellow.black.bold(` ${rule.severity.toUpperCase()} `);

    console.log(`  ${colors.rule(rule.id.padEnd(18))} ${severityBadge}`);
    console.log(`  ${chalk.white(rule.description)}`);
    console.log(`  ${colors.dim(`WCAG ${rule.wcag} — ${rule.impact}`)}`);
    console.log(`  ${colors.dim(rule.url)}`);
    console.log('');
  }
}

/**
 * Print a JSON report
 * @param {object} report
 */
export function printJSON(report) {
  console.log(JSON.stringify(report, null, 2));
}

/**
 * Print error message
 * @param {string} message
 */
export function printError(message) {
  console.error(`\n  ${logSymbols.error} ${chalk.red(message)}\n`);
}

/**
 * Print info message
 * @param {string} message
 */
export function printInfo(message) {
  console.log(`  ${logSymbols.info} ${chalk.cyan(message)}`);
}

/**
 * Print the copilot bridge header
 */
export function printCopilotBridgeHeader() {
  console.log('');
  console.log(
    boxen(
      bannerGradient.multiline('  🤖 Copilot CLI Auto-Fix Mode  ') +
      '\n' +
      chalk.dim('  Invoking GitHub Copilot CLI to fix accessibility issues...'),
      {
        padding: { left: 1, right: 1, top: 0, bottom: 0 },
        margin: { left: 2 },
        borderColor: 'cyan',
        borderStyle: 'double',
      }
    )
  );
  console.log('');
}
