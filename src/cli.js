import { Command } from 'commander';
import path from 'path';
import chalk from 'chalk';
import { walkDir, readFileSafe, getFileType, relativePath } from './scanner.js';
import { parseJSX, collectJSXElements, collectHeadings } from './parsers/jsx-parser.js';
import { parseHTML, collectHTMLHeadings } from './parsers/html-parser.js';
import { allRules, getRules } from './rules/index.js';
import {
  printBanner,
  printScanStart,
  printFileIssues,
  printSummary,
  printFixPrompt,
  printRulesList,
  printJSON,
  printError,
  printInfo,
} from './reporter.js';
import { autoFixAll, generateFixCommand } from './copilot-bridge.js';

/**
 * Analyze a single file and return all issues found
 * @param {string} filePath - Absolute file path
 * @param {object[]} rules - Rules to check
 * @returns {object[]} Issues found
 */
function analyzeFile(filePath, rules) {
  const code = readFileSafe(filePath);
  if (!code) return [];

  const fileType = getFileType(filePath);
  let elements = [];
  let headings = [];

  // Parse based on file type
  if (fileType === 'jsx') {
    const ast = parseJSX(code, filePath);
    if (!ast) return [];
    elements = collectJSXElements(ast, code);
    headings = collectHeadings(elements);
  } else if (fileType === 'html') {
    elements = parseHTML(code);
    headings = collectHTMLHeadings(elements);
  } else {
    return [];
  }

  const issues = [];

  // Run element-level rules
  for (const element of elements) {
    for (const rule of rules) {
      const issue = rule.check(element);
      if (issue) {
        issues.push(issue);
      }
    }
  }

  // Run file-level rules
  for (const rule of rules) {
    // Heading order check
    if (rule.id === 'heading-order' && rule.checkHeadings) {
      const headingIssues = rule.checkHeadings(headings);
      issues.push(...headingIssues);
    }

    // Semantic nav check
    if (rule.id === 'semantic-nav' && rule.checkNavPatterns) {
      const navIssues = rule.checkNavPatterns(elements, code);
      issues.push(...navIssues);
    }
  }

  // Sort by line number
  issues.sort((a, b) => a.line - b.line);

  return issues;
}

/**
 * Main CLI entry point
 * @param {string[]} argv
 */
export function cli(argv) {
  const program = new Command();

  program
    .name('a11y-pilot')
    .description(
      'AI-powered accessibility scanner that uses GitHub Copilot CLI to auto-fix a11y issues'
    )
    .version('1.0.0');

  // ─── scan command ──────────────────────────────────────────────────────────
  program
    .command('scan')
    .description('Scan files for accessibility issues')
    .argument('[path]', 'Path to scan (file or directory)', '.')
    .option('-r, --rules <rules>', 'Comma-separated list of rule IDs to check')
    .option('-f, --format <format>', 'Output format: text or json', 'text')
    .option('--fix', 'Show Copilot CLI fix commands for each issue')
    .option('--auto-fix', 'Automatically invoke Copilot CLI to fix issues')
    .option('--dry-run', 'Show what auto-fix would do without executing')
    .option('--one-by-one', 'Fix issues one at a time (instead of batching per file)')
    .action(async (targetPath, options) => {
      const absolutePath = path.resolve(process.cwd(), targetPath);

      // Get rules
      const ruleIds = options.rules ? options.rules.split(',').map(s => s.trim()) : null;
      const rules = getRules(ruleIds);

      if (rules.length === 0) {
        printError('No matching rules found. Run `a11y-pilot rules` to see available rules.');
        process.exit(1);
      }

      // JSON format doesn't get the banner
      if (options.format !== 'json') {
        printBanner();
      }

      // Discover files
      const files = walkDir(absolutePath);

      if (files.length === 0) {
        if (options.format !== 'json') {
          printError(`No scannable files found in ${targetPath}`);
          printInfo('Supported extensions: .html, .htm, .jsx, .tsx, .vue, .astro, .svelte');
        }
        process.exit(1);
      }

      if (options.format !== 'json') {
        printScanStart(files.length);
      }

      // Analyze all files
      const allIssues = new Map(); // filePath → issues[]
      let totalErrors = 0;
      let totalWarnings = 0;
      let filesWithIssues = 0;

      for (const file of files) {
        const issues = analyzeFile(file, rules);

        if (issues.length > 0) {
          allIssues.set(file, issues);
          filesWithIssues++;
          totalErrors += issues.filter(i => i.severity === 'error').length;
          totalWarnings += issues.filter(i => i.severity === 'warning').length;
        }
      }

      // ─── Output results ─────────────────────────────────────────────────
      if (options.format === 'json') {
        const report = {
          version: '1.0.0',
          timestamp: new Date().toISOString(),
          summary: {
            filesScanned: files.length,
            filesWithIssues,
            totalErrors,
            totalWarnings,
            totalIssues: totalErrors + totalWarnings,
          },
          files: {},
        };

        for (const [filePath, issues] of allIssues) {
          report.files[relativePath(filePath)] = issues.map(i => ({
            ruleId: i.ruleId,
            severity: i.severity,
            message: i.message,
            line: i.line,
            fix: i.fix,
            copilotCommand: generateFixCommand(filePath, i),
          }));
        }

        printJSON(report);
        process.exit(totalErrors > 0 ? 1 : 0);
        return;
      }

      // Text output
      if (options.autoFix || options.fix) {
        // Show issues first
        for (const [filePath, issues] of allIssues) {
          printFileIssues(relativePath(filePath), issues);
        }

        printSummary({
          errors: totalErrors,
          warnings: totalWarnings,
          files: filesWithIssues,
          totalFiles: files.length,
        });
      }

      // Auto-fix mode (Option B — the main event!)
      if (options.autoFix) {
        if (allIssues.size === 0) {
          // Nothing to fix
          process.exit(0);
          return;
        }

        const { totalFixed, totalFailed } = await autoFixAll(allIssues, {
          dryRun: options.dryRun,
          oneByOne: options.oneByOne,
        });

        process.exit(totalFailed > 0 ? 1 : 0);
        return;
      }

      // --fix mode: show copilot CLI commands
      if (options.fix) {
        if (allIssues.size > 0) {
          console.log('');
          printInfo('Copilot CLI fix commands:\n');

          for (const [filePath, issues] of allIssues) {
            for (const issue of issues) {
              printFixPrompt(relativePath(filePath), issue);
            }
          }
        }

        process.exit(totalErrors > 0 ? 1 : 0);
        return;
      }

      // Default: just show issues
      for (const [filePath, issues] of allIssues) {
        printFileIssues(relativePath(filePath), issues);
      }

      printSummary({
        errors: totalErrors,
        warnings: totalWarnings,
        files: filesWithIssues,
        totalFiles: files.length,
      });

      process.exit(totalErrors > 0 ? 1 : 0);
    });

  // ─── rules command ─────────────────────────────────────────────────────────
  program
    .command('rules')
    .description('List all available accessibility rules')
    .action(() => {
      printRulesList(allRules);
    });

  // ─── fix command (convenience alias) ───────────────────────────────────────
  program
    .command('fix')
    .description('Scan and auto-fix issues using GitHub Copilot CLI')
    .argument('[path]', 'Path to scan (file or directory)', '.')
    .option('-r, --rules <rules>', 'Comma-separated list of rule IDs to check')
    .option('--dry-run', 'Show what would be fixed without executing')
    .option('--one-by-one', 'Fix issues one at a time')
    .action(async (targetPath, options) => {
      // Delegate to scan with --auto-fix
      const absolutePath = path.resolve(process.cwd(), targetPath);
      const ruleIds = options.rules ? options.rules.split(',').map(s => s.trim()) : null;
      const rules = getRules(ruleIds);

      printBanner();

      const files = walkDir(absolutePath);
      if (files.length === 0) {
        printError(`No scannable files found in ${targetPath}`);
        process.exit(1);
      }

      printScanStart(files.length);

      const allIssuesMap = new Map();
      let totalErrors = 0;
      let totalWarnings = 0;
      let filesWithIssues = 0;

      for (const file of files) {
        const issues = analyzeFile(file, rules);
        if (issues.length > 0) {
          allIssuesMap.set(file, issues);
          filesWithIssues++;
          totalErrors += issues.filter(i => i.severity === 'error').length;
          totalWarnings += issues.filter(i => i.severity === 'warning').length;
        }
      }

      // Print issues
      for (const [filePath, issues] of allIssuesMap) {
        printFileIssues(relativePath(filePath), issues);
      }

      printSummary({
        errors: totalErrors,
        warnings: totalWarnings,
        files: filesWithIssues,
        totalFiles: files.length,
      });

      if (allIssuesMap.size === 0) {
        process.exit(0);
        return;
      }

      // Auto-fix
      const { totalFixed, totalFailed } = await autoFixAll(allIssuesMap, {
        dryRun: options.dryRun,
        oneByOne: options.oneByOne,
      });

      process.exit(totalFailed > 0 ? 1 : 0);
    });

  program.parse(argv);
}
