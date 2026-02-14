# Publishing a11y-pilot to npm

> Complete guide to publishing and maintaining a11y-pilot on the npm registry.

---

## Prerequisites

### 1. npm Account

You need an npm account. Create one at https://www.npmjs.com/signup

```bash
# Or create from the terminal
npm adduser
```

### 2. Login to npm

```bash
npm login
# Enter username, password, email, and OTP (if 2FA enabled)

# Verify you're logged in
npm whoami
```

### 3. Fill in package.json fields

Before publishing, update these fields in `package.json`:

```json
{
  "author": "Your Name <your@email.com>",
  "repository": {
    "type": "git",
    "url": "https://github.com/YOUR_USERNAME/a11y-pilot.git"
  },
  "homepage": "https://github.com/YOUR_USERNAME/a11y-pilot#readme",
  "bugs": {
    "url": "https://github.com/YOUR_USERNAME/a11y-pilot/issues"
  }
}
```

---

## Publishing Checklist

Before running `npm publish`, verify:

- [ ] `package.json` → `name` is unique (check: `npm search a11y-pilot`)
- [ ] `package.json` → `version` is correct
- [ ] `package.json` → `author` is filled in
- [ ] `package.json` → `repository.url` points to your GitHub repo
- [ ] `package.json` → `homepage` and `bugs.url` are set
- [ ] `bin/a11y-pilot.js` has the shebang (`#!/usr/bin/env node`)
- [ ] `bin/a11y-pilot.js` is executable (`chmod +x bin/a11y-pilot.js`)
- [ ] `README.md` is up-to-date with usage instructions
- [ ] `LICENSE` file exists (MIT)
- [ ] `.npmignore` or `files` field limits what gets published
- [ ] The CLI works: `node bin/a11y-pilot.js scan test/fixtures/`

---

## How to Publish

### First-time publish

```bash
# 1. Make sure everything works
node bin/a11y-pilot.js scan test/fixtures/
node bin/a11y-pilot.js --help

# 2. Preview what will be published
npm pack --dry-run

# 3. Publish!
npm publish
```

### After publishing — users can install/use it

```bash
# Install globally
npm install -g a11y-pilot
a11y-pilot scan ./src

# Or use without installing (npx)
npx a11y-pilot scan ./src
npx a11y-pilot fix ./src
npx a11y-pilot rules
```

---

## Updating / New Versions

```bash
# Bump version (pick one)
npm version patch   # 1.0.0 → 1.0.1 (bug fixes)
npm version minor   # 1.0.0 → 1.1.0 (new features)
npm version major   # 1.0.0 → 2.0.0 (breaking changes)

# Publish the new version
npm publish
```

---

## Verify your package

After publishing:

```bash
# Check it exists on npm
npm view a11y-pilot

# Test npx works
npx a11y-pilot --help

# Check what files were included
npm pack --dry-run
```

Visit https://www.npmjs.com/package/a11y-pilot to see your package page.

---

## The `files` field (what gets published)

In `package.json`, the `files` array controls what's included in the npm package:

```json
{
  "files": [
    "bin/",
    "src/",
    "LICENSE",
    "README.md"
  ]
}
```

These files are **always included** regardless of the `files` field:
- `package.json`
- `README.md` (or `README`)
- `LICENSE` (or `LICENCE`)
- The file specified in `main`

These are **always excluded**:
- `node_modules/`
- `.git/`
- `.npm/`

### Preview published package contents

```bash
npm pack --dry-run
```

This shows exactly which files will be in the tarball — check this before publishing!

---

## Scoped packages (optional)

If `a11y-pilot` is taken, you can publish under your npm scope:

```bash
# Change name in package.json
{
  "name": "@yourusername/a11y-pilot"
}

# Publish as public scoped package
npm publish --access public

# Users install with scope
npx @yourusername/a11y-pilot scan ./src
```

---

## Unpublishing / Deprecating

```bash
# Unpublish (only within 72 hours of publishing)
npm unpublish a11y-pilot --force

# Deprecate a version (preferred over unpublishing)
npm deprecate a11y-pilot@1.0.0 "Use v2.0.0 instead"
```

---

## Quick Reference

| Command | What it does |
|---------|-------------|
| `npm login` | Authenticate with npm |
| `npm whoami` | Check logged-in user |
| `npm pack --dry-run` | Preview published files |
| `npm publish` | Publish to npm |
| `npm version patch/minor/major` | Bump version |
| `npm view a11y-pilot` | Check package info |
| `npm unpublish a11y-pilot --force` | Remove from npm (72h window) |
| `npm deprecate a11y-pilot@x.x.x "msg"` | Mark version deprecated |

---

## Troubleshooting

### "Package name too similar to existing package"
Use a scoped name: `@yourusername/a11y-pilot`

### "You must be logged in to publish"
Run `npm login` first.

### "Cannot publish over existing version"
Bump the version: `npm version patch` then `npm publish`.

### "Missing README"
Ensure `README.md` exists at the project root.

### ERR 402 — Payment Required
Scoped packages are private by default. Add `--access public`:
```bash
npm publish --access public
```
