---
name: design-analyze
description: Use when the user wants to analyze a website's design system, extract design tokens from a URL, or runs /design analyze.
---

# Design Analyze

## Overview

Fetches HTML/CSS from any public URL via the design-sense API, extracts design tokens (colors, typography, spacing, radius, shadows, effects, components), and saves them to `.design/system.json`. Part of the design-sense skill suite.

## When to Use

- User provides a website URL and asks to "analyze", "extract", or "get the design system"
- User runs `/design analyze <url>`
- User wants to capture a reference site's visual style as reusable tokens
- User references an inspiration site they want to match

## Step 1: Validate input

The user should provide one or more URLs. If no URL is given, ask: "Which website would you like to analyze? Please provide the URL."

## Step 2: Call the design-sense API

For each URL provided, make a POST request to the API:

```
POST https://design-sense-api.oldiegoodie99.workers.dev/analyze
Content-Type: application/json

{ "url": "<the url provided by the user>" }
```

Use the WebFetch tool or Bash curl to call the API. Do NOT attempt to fetch and parse the website yourself.

If the API returns an error, inform the user clearly: "The design-sense API could not analyze `<url>`: `<error message>`. Please check that the URL is publicly accessible and try again."

## Step 3: Refine and interpret the tokens

The API returns raw design tokens. Use your judgment to:
- Identify the most important colors (primary, secondary, accent, background, text)
- Select a clean font size scale (remove duplicates, sort ascending)
- Determine the base spacing unit (usually 4px or 8px)

## Step 4: Save to .design/system.json

Create the `.design/` directory if it doesn't exist, then write `.design/system.json` with this structure:

```json
{
  "source": "<hostname>",
  "analyzedAt": "<ISO timestamp>",
  "colors": {
    "primary": "#...",
    "secondary": "#...",
    "background": "#...",
    "text": "#..."
  },
  "typography": {
    "font-heading": "...",
    "font-body": "...",
    "scale": [14, 16, 20, 24, 32, 48]
  },
  "spacing": {
    "unit": 4,
    "scale": [4, 8, 12, 16, 24, 32, 48, 64]
  },
  "radius": [4, 8, 12],
  "shadows": [
    "0 1px 3px rgba(0,0,0,0.12)",
    "0 4px 12px rgba(0,0,0,0.08)"
  ],
  "effects": {
    "backdropFilters": ["blur(8px)"],
    "filters": [],
    "transitions": ["all 0.2s ease"],
    "animations": ["fadeIn"]
  },
  "components": {
    "button-primary": {
      "bg": "#...",
      "color": "#fff",
      "radius": 8,
      "padding": "12px 24px",
      "font-weight": 600
    }
  }
}
```

## Step 5: Report to the user

Present a summary like this:

```
✓ Design system extracted from stripe.com

Colors:
  Primary:    #635BFF
  Background: #FFFFFF
  Text:       #425466

Typography:
  Font: Sohne, sans-serif
  Scale: 14 → 16 → 20 → 24 → 32 → 48px

Spacing: 4px base unit (4, 8, 12, 16, 24, 32, 48, 64)
Radius:  4px, 8px, 12px

Shadows:
  0 1px 3px rgba(0,0,0,0.12)
  0 4px 12px rgba(0,0,0,0.08)

Effects:
  Backdrop: blur(8px)
  Transitions: all 0.2s ease

Saved to .design/system.json

Run /design review to check your current UI against this design system.
```

## Multi-site merge

If the user provides multiple URLs (e.g. "analyze stripe.com and linear.app"), analyze each one separately, then ask: "I found design systems for both sites. Which site's colors should I use as the primary palette? Which typography?" Merge based on their preference.

## Common Mistakes

- Don't fetch or parse the website yourself — always route through the design-sense API
- If multiple URLs are given, analyze them separately before asking about merging preferences
- Always write to `.design/system.json` — don't use a different path
