---
name: design-style
description: Use when the user wants to analyze a website's icon or illustration style, generate AI image prompts matching a site's visual style, or runs /design style.
---

# Design Style

## Overview

Takes a full-page screenshot of a website using `agent-browser`, visually analyzes icons and illustrations, and generates AI-ready text prompts saved to `.design/style-prompts.json`. Use these prompts with Midjourney, DALL-E, or Stable Diffusion to create new assets in the same visual style. Part of the design-sense skill suite.

## When to Use

- User runs `/design style <url>`
- User asks to analyze a site's icon style, illustration style, or visual language
- User wants to generate AI image prompts matching a reference site's aesthetic
- User wants to create new assets in the same style as an existing site

## Step 1: Parse the command

The syntax is: `/design style <url> [--icons | --illustrations]`

- `--icons` — analyze icons only
- `--illustrations` — analyze illustrations only
- No flag — analyze both (default)

If no URL is provided, ask: "Which website would you like to analyze? Please provide the URL."

## Step 2: Take a full-page screenshot

Use the `agent-browser` skill to capture the page. Instruct it to:

1. Navigate to `<url>`
2. Wait for the page to fully load (wait for network idle)
3. Take a full-page screenshot
4. Save it to a temp file (e.g. `/tmp/design-style-screenshot.png`)
5. Return the file path

If the browser agent fails or the URL is inaccessible, inform the user: "Could not capture a screenshot of `<url>`. Please check that the URL is publicly accessible and try again."

## Step 3: Analyze the screenshot

Read the screenshot file using the Read tool, then analyze it visually. Look for:

### For icons (if `--icons` or no flag):

Examine icons visible on the page (navigation icons, feature icons, UI controls, social links, etc.) and determine:

- **style**: `outlined` / `filled` / `duotone` / `flat` / `3d`
- **stroke_width**: estimated stroke width (e.g. `"1px"`, `"1.5px"`, `"2px"`)
- **corner_style**: `sharp` / `rounded` / `circular`
- **complexity**: `simple` / `medium` / `detailed`
- **color_mode**: `monochrome` / `duotone` / `multicolor` / `gradient`
- **colors**: list of hex colors used in icons (pull from the design system if `.design/system.json` exists)
- **prompt**: a detailed text prompt for generating new icons in this style

### For illustrations (if `--illustrations` or no flag):

Examine any illustrations, hero graphics, spot illustrations, or decorative graphics and determine:

- **style**: `flat vector` / `isometric` / `hand-drawn` / `3d render` / `photographic`
- **complexity**: `simple` / `medium` / `detailed`
- **color_mode**: `monochrome` / `duotone` / `multicolor` / `gradient`
- **colors**: list of hex colors used
- **mood**: describe the emotional tone (e.g. `"friendly, professional"`, `"bold, energetic"`, `"calm, minimal"`)
- **prompt**: a detailed text prompt for generating new illustrations in this style

If you cannot find icons or illustrations on the page, note it in the output and set the relevant section to `null`.

## Step 4: Save to .design/style-prompts.json

Create the `.design/` directory if it doesn't exist, then write `.design/style-prompts.json`:

```json
{
  "source": "<hostname>",
  "analyzedAt": "<ISO timestamp>",
  "icons": {
    "style": "outlined",
    "stroke_width": "1.5px",
    "corner_style": "rounded",
    "complexity": "simple",
    "color_mode": "monochrome",
    "colors": ["#635BFF"],
    "prompt": "minimalist outlined icons, 1.5px stroke, rounded caps, monochrome purple #635BFF, simple geometric shapes, flat style, 24x24 grid"
  },
  "illustrations": {
    "style": "flat vector",
    "complexity": "medium",
    "color_mode": "duotone",
    "colors": ["#635BFF", "#00D4AA"],
    "mood": "friendly, professional",
    "prompt": "flat vector illustrations, duotone purple and teal palette, rounded organic shapes, friendly professional mood, minimal detail, soft gradients"
  }
}
```

If only `--icons` was specified, omit the `illustrations` field. If only `--illustrations`, omit the `icons` field.

If icons or illustrations were not found on the page, set the field to `null` with a `note` explaining why.

## Step 5: Report to the user

Present a summary like this:

```
✓ Style analysis complete for stripe.com

Icons:
  Style:      Outlined, 1.5px stroke, rounded corners
  Complexity: Simple
  Colors:     Monochrome #635BFF
  AI Prompt:  "minimalist outlined icons, 1.5px stroke, rounded caps,
               monochrome purple #635BFF, simple geometric shapes, flat
               style, 24x24 grid"

Illustrations:
  Style:      Flat vector
  Complexity: Medium
  Colors:     Duotone — #635BFF + #00D4AA
  Mood:       Friendly, professional
  AI Prompt:  "flat vector illustrations, duotone purple and teal palette,
               rounded organic shapes, friendly professional mood, minimal
               detail, soft gradients"

Saved to .design/style-prompts.json

Use these prompts with Midjourney, DALL-E, or Stable Diffusion to generate
assets in the same style.
```

## Multi-site merge

If the user provides multiple URLs (e.g. `/design style stripe.com linear.app`), analyze each one and ask: "Which site's icon style should I use? Which illustration style?" Merge based on their preference.

## Using the prompts

After generating, the user can:
- Copy the `prompt` directly into Midjourney, DALL-E 3, Stable Diffusion, etc.
- Refine the prompt by asking: "Make the icons more playful" or "Add gradient to the illustrations"
- Re-run with `--icons` or `--illustrations` to focus on just one category

## Common Mistakes

- Don't skip the screenshot step and try to analyze from memory or HTML — visual analysis requires seeing the rendered page
- If no icons or illustrations are found, set the field to `null` with a note — don't guess or fabricate values
- Don't omit the `agent-browser` skill call — the screenshot is required for accurate style analysis
