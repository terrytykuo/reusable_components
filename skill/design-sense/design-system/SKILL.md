---
name: design-system
description: Use when the user wants to view, edit, or export their design system tokens, or runs /design system.
---

# Design System

## Overview

Reads `.design/system.json` (created by `/design analyze`) and lets you view tokens in a readable format, edit individual values, or export them to Pencil.dev via Pencil MCP. Part of the design-sense skill suite.

## When to Use

- User runs `/design system`
- User asks to "show", "view", "edit", or "export" their design system
- User wants to change a specific token (e.g. "change primary color to #7C3AED")
- User wants to export tokens to Pencil.dev

**When NOT to use:** If `.design/system.json` doesn't exist, stop and tell the user to run `/design analyze <url>` first.

## Step 1: Check for .design/system.json

Use the Read tool to read `.design/system.json`.

If the file does not exist, stop and tell the user:
> "No design system found. Run `/design analyze <url>` first to extract a design system from a reference website."

If it exists, continue.

## Step 2: Parse the command

Supported syntax:
- `/design system` — show full design system
- `/design system --colors` — show only colors
- `/design system --typography` — show only typography
- `/design system --spacing` — show only spacing
- `/design system --shadows` — show only shadows
- `/design system --effects` — show only effects
- `/design system --components` — show only components
- `/design system export` — export to Pencil.dev

If no flag is given, show the full design system.

## Step 3: Display the design system

Present the tokens in a clean, readable format. Show all fields present in `.design/system.json`:

```
Design System — <source>
(last analyzed: <analyzedAt date, formatted as YYYY-MM-DD>)

COLORS
  Primary:      <colors.primary>  ████
  Secondary:    <colors.secondary>  ████
  Accent:       <colors.accent>  ████
  Background:   <colors.background>  ████
  Text:         <colors.text>  ████
  Text-Heading: <colors["text-heading"]>  ████

TYPOGRAPHY
  Heading: <typography["font-heading"]>
  Body:    <typography["font-body"]>
  Scale:   <typography.scale joined with " → ">px
  Weights: <typography.weights joined with ", ">

SPACING  (base unit: <spacing.unit>px)
  Scale: <spacing.scale joined with ", ">px

RADIUS
  sm: <radius[0]>px  md: <radius[1]>px  lg: <radius[2] if exists, else omit>px

SHADOWS
  <for each shadows entry>: <shadow value>
  (if shadows array is empty or missing, show "None detected")

EFFECTS
  Backdrop:     <effects.backdropFilters joined with ", " — or "None" if empty>
  Filters:      <effects.filters joined with ", " — or "None" if empty>
  Transitions:  <effects.transitions joined with ", " — or "None" if empty>
  Animations:   <effects.animations joined with ", " — or "None" if empty>
  (if entire effects object is missing, skip this section)

COMPONENTS
  <for each component key>: <list each property>
```

Only show sections that exist in the JSON. If a field is missing, skip that line silently.

Then offer:
```
Options:
  • "change [token] to [value]" — edit a specific value
  • "/design system export" — export to Pencil.dev
  • "/design analyze <url>" — re-analyze from a new website
```

## Step 4: Handle filtered views

If a flag was given (`--colors`, `--typography`, `--spacing`, `--shadows`, `--effects`, `--components`), show only that section, using the same format as Step 3.

## Step 5: Handle edits

If the user asks to change a value (e.g. "change primary color to #7C3AED"):

1. Read the current `.design/system.json`
2. Identify the correct JSON path for the change:
   - "primary color" → `colors.primary`
   - "secondary color" → `colors.secondary`
   - "accent color" → `colors.accent`
   - "background color" → `colors.background`
   - "text color" → `colors.text`
   - "heading color" or "text-heading" → `colors["text-heading"]`
   - "font" or "body font" → `typography["font-body"]`
   - "heading font" → `typography["font-heading"]`
   - "spacing unit" → `spacing.unit`
   - "small radius" or "radius sm" → `radius[0]`
   - "medium radius" or "radius md" → `radius[1]`
   - "large radius" or "radius lg" → `radius[2]`
3. Apply the change
4. Write back to `.design/system.json` using the Write tool (preserve all other fields)
5. Confirm: "Updated `<json.path>` to `<new value>` in `.design/system.json`"

If the requested field is not recognized, tell the user:
> "I can edit these fields: primary/secondary/accent/background/text/text-heading color, body font, heading font, spacing unit, small/medium/large radius. Which would you like to change?"

## Step 6: Export to Pencil.dev

If the user runs `/design system export`:

1. Read `.design/system.json`
2. Map the tokens to Pencil MCP variable format. Export these structural tokens:
   - `$color-primary` → `colors.primary`
   - `$color-secondary` → `colors.secondary`
   - `$color-accent` → `colors.accent`
   - `$color-background` → `colors.background`
   - `$color-text` → `colors.text`
   - `$font-heading` → `typography["font-heading"]`
   - `$font-body` → `typography["font-body"]`
   - `$spacing-unit` → `spacing.unit`
   - `$radius-sm` → `radius[0]`
   - `$radius-md` → `radius[1]`
   - `$radius-lg` → `radius[2]` (if exists)

   Note: `text-heading` is intentionally omitted — it is a derived alias of `secondary`.

3. Call the Pencil MCP `set_variables` tool with the mapped variables
4. Confirm: "Design system exported to Pencil.dev ✓"

If Pencil MCP is not available, tell the user:
> "Pencil MCP is not connected. To export, ensure the Pencil MCP server is running and try again."

If `.design/system.json` is missing or malformed, stop and tell the user to run `/design analyze` first.

## Common Mistakes

- If `system.json` is missing, don't guess values — always tell the user to run `/design analyze` first
- When editing, preserve ALL other fields — only change the requested value using Write tool
- `text-heading` is intentionally excluded from Pencil export (it's a derived alias) — don't add it
