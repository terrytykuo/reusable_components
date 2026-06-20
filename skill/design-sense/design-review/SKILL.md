---
name: design-review
description: Use when the user wants to review their project's UI design quality, get categorized improvement suggestions, or runs /design review.
---

# Design Review

## Overview

Reads your project's UI code, sends it to the design-sense API, and returns categorized improvement suggestions (🔴 must fix / 🟡 recommended / 🟢 minor tweaks) with specific code fixes. Part of the design-sense skill suite.

## When to Use

- User runs `/design review`
- User asks to "review", "check", or "audit" their UI or design
- User wants to know what's wrong with their current UI design
- After running `/design analyze` to establish a design system baseline

## Step 1: Gather the project code

Collect the relevant UI code from the project. Focus on:
1. CSS files: `**/*.css`, `**/*.scss`
2. Component files with inline styles: `**/*.tsx`, `**/*.jsx`, `**/*.vue`, `**/*.html`

Use Glob to find all relevant files, then Read to get their contents. Concatenate into a single code snapshot (max ~50KB to keep API call fast).

If `.design/system.json` exists, read it — you'll include it in the API call.

## Step 2: Call the design-sense API

```
POST https://design-sense-api.oldiegoodie99.workers.dev/review
Content-Type: application/json

{
  "code": "<concatenated code snapshot>",
  "designSystem": <contents of .design/system.json, or null>
}
```

If the API returns an error, inform the user: "The design-sense API could not review the code: `<error>`. Please try again."

## Step 3: Present suggestions

Format suggestions clearly, grouped by severity:

```
🔴 RED — Must Fix (accessibility/critical issues)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[title]
  Problem:    [description]
  Fix:        [suggestion]

🟡 YELLOW — Recommended
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[title]
  Problem:    [description]
  Fix:        [suggestion]

🟢 GREEN — Minor Tweaks
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[title]
  Problem:    [description]
  Fix:        [suggestion]
```

After presenting, ask:
- "Would you like me to **fix all red issues** automatically?"
- "Or specify which issues to fix (e.g. 'fix the contrast issue')."

## Step 4: Apply fixes (if requested)

If the user asks to fix issues:
1. Use Read to get the specific file
2. Use Edit to apply the minimal change
3. Confirm each fix: "Fixed `[title]` in `[file]`"

Only fix what was requested. Do not refactor surrounding code.

## Design principle reference

When reviewing without a design system, apply these principles:
- **Contrast**: Text must have >= 4.5:1 contrast ratio against background (WCAG AA)
- **Typography**: 16px base size, 1.4-1.6 line-height for body, limited font size scale (<= 6 sizes)
- **Consistency**: Use <= 3 border-radius values, consistent spacing multiples
- **Spacing**: Use a base-4 or base-8 system
- **Hierarchy**: Clear distinction between heading sizes, don't use font-weight alone for hierarchy

## Common Mistakes

- Don't include generated or minified files in the code snapshot — focus on source files only
- Don't fix issues beyond what was requested — apply minimal, targeted edits
- If no `.design/system.json` exists, still run the review (pass `null` for designSystem)
