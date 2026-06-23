# gnhf run: build-an-asset-of-no-065138

Objective: see .gnhf/runs/build-an-asset-of-no-065138/prompt.md

## Iteration Log

### Iteration 1

**Summary:** Built "Mood", a self-contained emotional-design asset kit: an HTML gallery showcasing 6 non-functional animated SVG/CSS assets, each mapped to an emotional moment in a product journey with its UX payoff, and verified it renders cleanly in a browser.

**Changes:**
- Created ux_assets/index.html — a dependency-free gallery page that presents 6 emotional-design assets in a responsive card grid, each documenting its emotional goal, UX benefit, and use-case tags, framed by Don Norman's visceral/behavioral/reflective principles
- Authored 6 original non-functional inline-SVG assets with subtle CSS keyframe animation: friendly empty-state box, success check with confetti burst, reassuring unplugged-cable error mascot, orbiting patience loader, waving welcome mascot, and a whimsical 404 paper plane
- Matched the repo's existing overview.html light-mode design language and palette, added a per-emotion accent color scheme, and gated all motion behind prefers-reduced-motion for accessibility

**Learnings:**
- The working dir ux_assets/ started empty (only .gnhf); the parent repo is a cross-project reusable-component library with an existing overview.html establishing a reusable light-mode design system and palette (--accent #e07b39 etc.) worth matching for visual consistency
- agent-browser screenshot saves relative to an unpredictable cwd — pass an absolute path ("$(pwd)/file.png") to reliably locate the output
- Notes.md is empty so this is genuinely iteration 1; future iterations could expand the kit (more assets, a copy-to-clipboard SVG export, or downloadable .svg files) and add it to the parent overview.html navigation

### Iteration 2

**Summary:** Added one-click "Copy SVG" to each asset card that exports self-animating, standalone SVG markup, turning the emotional-design gallery from a display-only page into an actually reusable asset library.

**Changes:**
- Added a per-card 'Copy SVG' button (styled with each card's emotion accent color) plus a bottom toast, with a 'Copied!' success state on click
- Copy logic clones the card's SVG and injects an embedded <style> containing only the animation keyframes/classes the asset uses, so pasted SVGs stay self-animating in any project while honoring prefers-reduced-motion
- Implemented navigator.clipboard with an execCommand textarea fallback so copy works under restricted contexts like file://
- Updated the footer copy to describe the new self-contained copy capability instead of telling users to hand-grab the <svg>

**Learnings:**
- The iteration-1 page already shipped 6 polished assets and rendered cleanly, so the highest-value increment was usability (extraction) rather than adding more assets
- Embedding the animation CSS as an SVG-namespaced <style> inside the cloned SVG is what makes copied assets drop-in functional — without it the .a-* classes are dead outside this page
- agent-browser's 'find text click' confirms success ('Done') but clipboard read isn't directly exposed; visual screenshot + zero console errors + correct aria-labels were sufficient to verify the feature

### Iteration 3

**Summary:** Expanded the "Mood" emotional-design kit from 6 to 9 assets by adding self-animating Saved/Synced cloud, Achievement medal, and Appreciation heart SVGs, fully wired into the existing Copy-SVG export, and verified clean browser rendering with no errors.

**Changes:**
- Added 3 new non-functional animated SVG assets covering previously-missing emotional moments: a cloud-with-check 'Saved · Synced' (trust/autosave), a sparkling medal+star 'Achievement · Pride' (milestone/gamification), and a beating-heart 'Appreciation · Delight' (like/thank-you/renewal), each with emotional goal, UX benefit, and use-case tags matching the existing card schema
- Introduced two new CSS keyframe animations (twinkle, heartbeat) with a-twinkle/a-heartbeat classes and added them to the prefers-reduced-motion guard so the new assets respect accessibility settings
- Extended the Copy-SVG ANIM_CSS export array with the twinkle/heartbeat keyframes, classes, and reduced-motion rule so the 3 new assets stay self-animating when copied into any project, keeping the export feature consistent across all 9 cards

**Learnings:**
- Adding any new asset animation requires three synchronized edits to keep the kit consistent: the page <style> block, the prefers-reduced-motion list (in both <style> and ANIM_CSS), and the JS ANIM_CSS export array — missing the export array would make copied assets render statically
- The grid (auto-fill minmax(330px,1fr)) cleanly absorbed 9 cards into a balanced 3x3 layout with no layout changes needed, so the kit can keep growing without touching CSS structure
- Hand-computed 5-point star path coordinates (outer r=13 / inner r=5.2 around center 60,52) produced a clean medal star without needing a path-generation library

### Iteration 4

**Summary:** Added a journey-stage filter bar that maps the 9 emotional-design assets to product-journey moments (Onboarding/Waiting/Feedback/Recovery/Delight) with live per-stage counts, making the growing asset library navigable while reinforcing the emotional-design narrative.

**Changes:**
- Added a dependency-free filter bar with one chip per journey stage (All + 5 stages), each showing its asset count, styled to match the existing light-mode design language with the accent color as the active state
- Tagged all 9 asset cards with data-cat journey-stage categories and added JS that filters cards on chip click, toggles aria-pressed for accessibility, updates a live result count, and shows an empty-state note when a stage has no assets
- Verified in-browser: chips render with correct counts, Feedback filter shows exactly its 3 cards, All restores all 9, and there are zero console errors

**Learnings:**
- Multiple cards shared identical style="--c:var(--...)" attributes (e.g. two --warm, two --joy, two --calm), so editing the card opening tags required matching on the preceding HTML comment as unique context rather than the style attribute alone
- Mapping the 9 existing assets onto 5 emotional journey stages produced a naturally balanced, meaningful taxonomy (Feedback being the largest at 3), so the filter doubles as narrative reinforcement rather than just a utility

### Iteration 5

**Summary:** Added a per-card "Download .svg" button alongside Copy SVG, letting designers save each emotional-design asset as a standalone, self-animating SVG file — turning the kit into a fully take-away asset library.

**Changes:**
- Added a per-card download button next to Copy SVG (restructured into an .actions flex row), tinted with each card's emotion accent, exporting a standalone .svg file with XML prolog, xmlns, and embedded animation <style> via Blob + object URL
- Derived friendly kebab-case filenames from each asset's display name (e.g. 'Nothing here — yet' -> nothing-here-yet.svg) and surfaced a 'Downloaded ...' toast confirmation
- Updated footer copy to describe both clipboard-copy and file-download take-away paths

**Learnings:**
- The existing buildSvg() helper already produced fully self-animating standalone markup, so the download feature reused it verbatim — only an XML prolog and Blob/object-URL plumbing were new, keeping copy and download exports identical and DRY
- Verified the exported file with xmllint --noout (well-formed XML) in addition to browser checks; agent-browser's find-text on a transient toast fails because the toast is covered/faded, so a downloaded-file inspection is the reliable verification path for download features

### Iteration 6

**Summary:** Added a global play/pause motion toggle to the Mood asset kit that freezes every asset animation in place for inspection while reinforcing the kit's accessibility narrative.

**Changes:**
- Added a right-aligned motion-toggle button to the journey-stage filter bar that flips between 'Pause motion' (⏸) and 'Play motion' (▷) icon+label states, tinted with the accent color when active
- Added a `body.motion-paused .stage svg *` rule using `animation-play-state: paused` so toggling freezes all asset animations in place (current frame preserved) rather than restarting or removing them
- Wired a JS click handler that toggles the `motion-paused` body class and keeps aria-pressed/aria-label in sync for accessibility

**Learnings:**
- `animation-play-state: paused` applied via a body-level class freezes the current frame without restart, which is the right primitive for an inspect-a-frame feature (vs. `animation: none` which resets); a single `.stage svg *` selector covers every per-asset animation class at once without enumerating them
- The filterbar's `.fb-count` used `margin-left:auto` to push right; inserting another right-aligned control required moving the `auto` margin onto the new toggle and giving the count a fixed small margin, since only one flex child can claim the auto margin
- agent-browser's `find text` is a reliable toggle-state verifier here: 'Pause motion' then 'Play motion' both resolving to clickable elements confirms the label/state actually flipped, unlike transient toasts which fade before they can be asserted

### Iteration 7

**Summary:** Added a per-asset hover "Replay" control to the Mood kit that restarts each asset's animation from frame 0, letting designers re-watch the one-shot success/medal/cloud animations that previously only played once on load.

**Changes:**
- Added a Replay pill button to every asset stage (hover/focus-revealed, tinted with the card's emotion accent, with a full aria-label) that re-runs the asset's animation on click
- Implemented a replayAnimations() helper using the animation:none → forced-reflow → restore trick via a single .anim-off class on the SVG, restarting all of an asset's animations (one-shots and infinites) without enumerating animation names
- Verified in-browser: all 9 Replay buttons generate correctly, clicking re-triggers the one-shot draw/confetti animation, and there are zero console errors

**Learnings:**
- The kit's .a-pop and .draw animations are one-shot (fire once on load then sit static), so for an inspect-the-asset library a replay affordance was the highest-value remaining gap — copy/download/filter/pause were already shipped in iterations 2-6
- The restart trick needs a forced reflow between removing and re-adding animations; reading svg.getBoundingClientRect() after toggling .anim-off (which sets animation:none !important on all SVG descendants) reliably flushes layout so the animations restart instead of being coalesced away
- A single '.stage svg.anim-off *' selector covers every per-asset animation class at once — same one-selector pattern the iteration-6 pause toggle used — so replay needed no per-animation wiring

### Iteration 8

**Summary:** Added a "Dark stage" preview toggle to the Mood asset kit that flips every asset stage to a dark product surface, letting designers verify how each illustration reads on dark-mode backgrounds before shipping.

**Changes:**
- Added a 'Dark stage / Light stage' toggle button to the filter bar (moon/sun icons, accent-tinted active state, full aria-label) that switches all asset stages between light and dark backgrounds for inspection
- Added body.stage-dark CSS that repaints every .stage with a dark gradient and re-tints the hover Replay pill for contrast, leaving card bodies light to simulate an illustration zone within a light UI
- Refactored the shared toggle styling into a reusable .fb-toggle class (consumed by both the new stage toggle and the existing motion toggle) and moved the right-group auto-margin onto the new first control
- Wired a JS click handler that toggles the stage-dark body class and keeps aria-pressed/aria-label in sync

**Learnings:**
- For an illustration/asset library, dark-surface preview is a genuine production concern: the 9 existing assets already used self-colored fills, so they read with strong contrast on a dark stage with zero per-asset edits — only the stage background and the white Replay pill needed dark variants
- The iteration-6 right-grouped flex pattern generalizes cleanly: extracting a shared .fb-toggle class and putting margin-left:auto on whichever control is first in the right group lets new toggles be added without re-juggling per-button margins
- Keeping card bodies light while only the stage goes dark realistically mirrors how an illustration sits inside a light app shell, which is a more useful preview than darkening the whole page

### Iteration 9

**Summary:** Added a "Reduce motion" preview toggle to the Mood asset kit that forces every asset into its prefers-reduced-motion resting state, letting designers verify the static accessibility fallback reads as intentional before shipping.

**Changes:**
- Added a 'Reduce motion / Full motion' toggle button to the filter bar (accessibility/activity icons, accent-tinted active state, full aria-label) that flips every asset into its prefers-reduced-motion static fallback for inspection
- Added body.motion-reduced CSS that reuses the existing reduced-motion rules (animation:none on all infinite animations, stroke-dashoffset:0 on draw animations) so the still state matches exactly what reduced-motion users see — distinct from the iteration-6 pause toggle which freezes a mid-frame
- Wired a JS click handler that toggles the motion-reduced body class and keeps aria-pressed/aria-label in sync, and updated footer copy to point at the new control as the way to preview the accessibility fallback

**Learnings:**
- The kit had a pause toggle (freeze current frame) but no way to preview the prefers-reduced-motion RESTING state — these are genuinely different (mid-frame vs. completed/static fallback), so a reduce-motion preview was a non-redundant, on-narrative gap given the kit's heavy accessibility framing
- The existing @media (prefers-reduced-motion) rule could be replicated verbatim under a body.motion-reduced class, but the .draw animation needed both stroke-dashoffset:0 AND animation:none with !important to force the completed check immediately rather than re-running the one-shot draw
- agent-browser 'find text' clicking 'Reduce motion' then resolving 'Full motion' on the next click is the reliable verifier for this toggle's label/state flip, same pattern as the prior pause/dark toggles; the screenshot confirmed the success check renders fully-drawn in the static state
