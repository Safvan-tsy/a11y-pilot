# a11y-copilot — Project Plan

> AI-powered CLI that scans frontend codebases for accessibility issues and leverages GitHub Copilot CLI to fix them.

**Deadline:** February 15, 2026 — 11:59 PM PST
**Challenge:** GitHub Copilot CLI Challenge on dev.to

---

## 1. Core Concept

A CLI tool you run inside any frontend project directory (like ESLint) that:

1. **Scans** HTML / JSX / TSX files for accessibility violations
2. **Reports** issues with file, line number, severity, and explanation
3. **Bridges to Copilot CLI** to auto-fix or guide fixes using AI

**Name:** `a11y-pilot`
**Tagline:** _"Your accessibility co-pilot for the terminal."_

---

## 2. Tech Stack

| Layer | Choice | Why |
|-------|--------|-----|
| Runtime | Node.js 18+ | Universal, fast to ship, npm-publishable |
| CLI framework | `commander` | Lightweight, intuitive subcommands |
| AST parsing | `@babel/parser` + `@babel/traverse` | Handles JSX/TSX natively |
| HTML parsing | `htmlparser2` | Fast, streaming HTML parser |
| Terminal output | `chalk` + `ora` | Colored output, spinners |
| Testing | `vitest` | Fast, zero-config |
| Bundling | None (raw Node.js) | Keep it simple |

---

## 3. A11y Rules (MVP Scope — 8 Rules)

These are high-impact, commonly violated rules:

| # | Rule ID | What it catches | Severity |
|---|---------|----------------|----------|
| 1 | `img-alt` | `<img>` without `alt` attribute | error |
| 2 | `button-content` | Empty `<button>` with no text/aria-label | error |
| 3 | `no-div-button` | `<div>` or `<span>` with `onClick` but no `role`/`tabIndex` | error |
| 4 | `form-label` | `<input>` without associated `<label>` or `aria-label` | error |
| 5 | `heading-order` | Skipped heading levels (h1 → h3) | warning |
| 6 | `anchor-content` | `<a>` with no text content or `aria-label` | error |
| 7 | `no-autofocus` | Usage of `autoFocus` attribute (anti-pattern) | warning |
| 8 | `semantic-nav` | Navigation links in `<div>` instead of `<nav>` | warning |

Each rule includes:
- **What's wrong** (explanation)
- **Why it matters** (impact on users)
- **How to fix** (code suggestion)
- **Copilot CLI prompt** (ready-to-paste command)

---

## 4. CLI Interface Design

### Commands

```bash
# Scan current directory
npx a11y-pilot scan

# Scan specific path
npx a11y-pilot scan ./src/components

# Scan single file
npx a11y-pilot scan ./src/App.tsx

# Scan with specific rules only
npx a11y-pilot scan --rules img-alt,no-div-button

# Scan and output JSON (for CI)
npx a11y-pilot scan --format json

# Scan and show Copilot CLI fix prompts
npx a11y-pilot scan --fix

# Show all available rules
npx a11y-pilot rules
```

### Sample Terminal Output

```
  a11y-pilot v1.0.0 — Accessibility Scanner

  Scanning 23 files...

  src/components/Hero.tsx
    ✖  L12  img-alt        <img> missing alt attribute                    error
    ✖  L34  no-div-button  <div onClick> should be <button>              error

  src/components/Nav.tsx
    ⚠  L8   semantic-nav   Navigation links should be wrapped in <nav>   warning

  src/pages/Login.tsx
    ✖  L22  form-label     <input> has no associated label               error
    ⚠  L45  no-autofocus   Avoid autoFocus — disrupts screen readers     warning

  ──────────────────────────────────────────────
  Found 5 issues (3 errors, 2 warnings) in 3 files
  Run with --fix to get Copilot CLI fix commands
```

### Sample `--fix` Output

```
  src/components/Hero.tsx:12  img-alt
  ✖ <img> missing alt attribute

  💡 Fix with Copilot CLI:
  ┌──────────────────────────────────────────────────────────────────┐
  │ copilot "In src/components/Hero.tsx at line 12, add a           │
  │ descriptive alt attribute to the <img> tag. If the image is     │
  │ decorative, use alt=\"\". If meaningful, describe the content."  │
  └──────────────────────────────────────────────────────────────────┘
```

---

## 5. Architecture Options

---

### Option A — Scanner + Copilot CLI Prompt Generator (Recommended)

**How it works:**
1. Tool scans files → finds issues → reports them
2. With `--fix` flag, it generates **ready-to-run Copilot CLI commands** for each issue
3. User copies/runs the `copilot "..."` commands to fix issues
4. In the article, you also show heavy Copilot CLI usage during development (screenshots of building the tool itself with Copilot CLI)

**Copilot CLI integration points:**
- Generated prompts per issue (user runs them)
- A `--fix-all` flag that generates a single combined Copilot CLI prompt for all issues in a file
- Development of the tool itself using Copilot CLI (documented in article)

**Pros:**
- ✅ Ship-ready in hours — no dependency on Copilot CLI's internal behavior
- ✅ Works regardless of Copilot CLI's interactive mode limitations
- ✅ Clean separation: your tool = detection, Copilot CLI = fixing
- ✅ User stays in control of what gets changed
- ✅ Easy to demo in the article

**Cons:**
- ❌ Less "wow factor" — user has to manually run the copilot commands
- ❌ Copilot CLI integration is indirect (prompt generation, not invocation)

**Estimated build time:** 6-8 hours

---

### Option B — Scanner + Automated Copilot CLI Invocation

**How it works:**
1. Tool scans files → finds issues → reports them
2. With `--fix` flag, the tool **programmatically invokes** `copilot` CLI for each issue
3. Copilot CLI directly edits the files
4. Optionally show a diff of changes for user approval

**Copilot CLI integration points:**
- Direct `child_process.spawn('copilot', [...])` invocation
- Passes context-rich prompts with file path, line number, issue type
- Captures output, shows progress in terminal
- Optional interactive approval mode (show diff before applying)

**Implementation approach:**
```javascript
// Invoke copilot CLI programmatically
const { spawn } = require('child_process');
const copilot = spawn('copilot', [
  `In file ${filePath} at line ${line}, fix this accessibility issue: ${description}. 
   Apply the fix directly to the file.`
]);
```

**Pros:**
- ✅ Maximum "wow factor" — fully automated a11y fixing
- ✅ Copilot CLI is deeply, visibly central to the tool
- ✅ Judges see real agentic Copilot CLI usage in the tool itself
- ✅ Stronger narrative: "Copilot CLI IS the fix engine"

**Cons:**
- ❌ Risky — Copilot CLI may not support non-interactive piped invocations cleanly
- ❌ Debugging Copilot CLI subprocess behavior eats into precious time
- ❌ Each `copilot` invocation takes time (API calls) — UX may feel slow
- ❌ Harder to demo reliably (LLM output is non-deterministic)

**Estimated build time:** 10-14 hours (includes debugging subprocess behavior)

**Risk mitigation:** Build Option A first, then attempt Option B as an upgrade. Fall back to A if B doesn't work cleanly.

---

### Option A+B Hybrid (Best of Both Worlds)

Build Option A as the foundation. Add an `--auto-fix` flag that attempts Option B (direct invocation). If Copilot CLI invocation works, great. If not, the tool still works perfectly in prompt-generation mode.

```bash
a11y-pilot scan --fix        # Show copilot CLI commands to run (Option A)
a11y-pilot scan --auto-fix   # Invoke copilot CLI directly (Option B)
```

---

## 6. Project Structure

```
a11y-pilot/
├── bin/
│   └── a11y-pilot.js            # CLI entry point (#!/usr/bin/env node)
├── src/
│   ├── cli.js                   # Commander setup, arg parsing
│   ├── scanner.js               # File discovery + orchestration
│   ├── parsers/
│   │   ├── jsx-parser.js        # JSX/TSX parsing with Babel
│   │   └── html-parser.js       # HTML parsing with htmlparser2
│   ├── rules/
│   │   ├── index.js             # Rule registry
│   │   ├── img-alt.js           # Each rule = one file
│   │   ├── button-content.js
│   │   ├── no-div-button.js
│   │   ├── form-label.js
│   │   ├── heading-order.js
│   │   ├── anchor-content.js
│   │   ├── no-autofocus.js
│   │   └── semantic-nav.js
│   ├── reporter.js              # Terminal output formatting
│   ├── copilot-bridge.js        # Copilot CLI prompt/command generation
│   └── utils.js                 # Helpers (file walking, etc.)
├── test/
│   ├── fixtures/                # Sample files with a11y issues
│   │   ├── bad-images.tsx
│   │   ├── bad-buttons.tsx
│   │   ├── bad-forms.html
│   │   └── good-component.tsx
│   └── rules/
│       ├── img-alt.test.js
│       └── ...
├── package.json
├── README.md
├── LICENSE                      # MIT
└── .gitignore
```

---

## 7. Build Order (Time-Boxed)

| Phase | Task | Time |
|-------|------|------|
| **1** | Project scaffold: package.json, deps, bin setup, CLI skeleton | 30 min |
| **2** | File scanner: walk directories, filter .html/.jsx/.tsx files | 30 min |
| **3** | JSX/TSX parser: parse files into AST | 45 min |
| **4** | HTML parser: parse .html files | 30 min |
| **5** | Implement 8 rules (detection logic) | 2-3 hrs |
| **6** | Reporter: pretty terminal output with chalk | 45 min |
| **7** | Copilot bridge: generate fix prompts per issue | 45 min |
| **8** | CLI flags: --fix, --format json, --rules filter | 30 min |
| **9** | Test fixtures + basic tests | 30 min |
| **10** | README with usage, screenshots | 30 min |
| **11** | **[Option B only]** Copilot CLI direct invocation | 2-4 hrs |
| **12** | Polish, edge cases, final testing | 1 hr |
| **TOTAL** | | **~8-12 hrs** |

---

## 8. Article Strategy

The dev.to submission article is as important as the code. Structure:

### Article Outline

1. **Hook** — "What if ESLint could fix your accessibility issues with AI?"
2. **What I Built** — a11y-pilot overview, demo GIF/video
3. **Why Accessibility** — The problem (95%+ of websites fail WCAG), why devs skip it
4. **How Copilot CLI Powered the Build** — Terminal screenshots showing:
   - Using `copilot` to scaffold the project
   - Using `copilot` to write parsing logic
   - Using `copilot` to generate rule implementations
   - Using `copilot` to debug issues
5. **How It Works** — Architecture diagram, rule examples
6. **Demo** — Running on a real project, before/after
7. **Copilot CLI as the Fix Engine** — Show the generated prompts, run them live
8. **What I Learned** — Reflections on Copilot CLI
9. **Try It** — npm install instructions, GitHub repo link

### Key Article Assets Needed
- [ ] Terminal recording / GIF of scanning a project
- [ ] Terminal screenshots of Copilot CLI usage during development
- [ ] Before/after code snippets
- [ ] Architecture diagram (simple box diagram)

---

## 9. What Makes This a Winner

| Criteria | How we score |
|----------|-------------|
| **Use of Copilot CLI** | Tool generates Copilot CLI commands as output + built using Copilot CLI (documented) |
| **Usability & UX** | Beautiful terminal output, zero-config, works like ESLint, npm-installable |
| **Originality** | No one else is building an a11y scanner that bridges to Copilot CLI |

### Unique selling points:
1. **Real-world utility** — Developers will actually use this
2. **Copilot CLI is central** — Not a gimmick, it's the fix engine
3. **NPM-publishable** — Judges can `npx a11y-pilot scan` in their own projects
4. **Accessibility is important** — Shows social awareness, not just tech skill

---

## 10. Decision Required

**Which approach do you want to go with?**

- **Option A** — Scanner + Prompt Generator (safe, shippable, 6-8 hrs)
- **Option B** — Scanner + Automated Copilot CLI Invocation (impressive but risky, 10-14 hrs)
- **Option A+B Hybrid** — Build A first, attempt B as upgrade (best of both, 8-12 hrs)

**Reply with your choice and I'll start building immediately.**
