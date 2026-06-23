# UX Assets — Index

Self-contained galleries of **non-functional** UX assets: inline-SVG illustrations and
CSS-animated, Lottie-style micro-motions whose only job is emotional/sentimental design.
Every asset is dependency-free (pure SVG + CSS), honors `prefers-reduced-motion`, and can be
copied or downloaded as a standalone self-animating `.svg` straight from its gallery.

Open any `*.html` file in a browser. Each gallery offers journey-stage filters and three preview
toggles — **Pause motion**, **Dark stage**, and **Reduce motion** — plus per-asset **Replay**,
**Copy SVG**, and **Download** controls.

---

## `mewguard.html` — MewGuard sentimental-design kit

Asset kit for **MewGuard** (`~/Workspace/mewguard/cat_toxin_app/`), the app that helps cat owners
check whether a substance is toxic to their cat. A high-anxiety domain, so the assets carry the
*feeling* of each moment: calm for a worried owner, warmth for a clear verdict, a steady hand for
an emergency. Palette and tone follow the app theme in `cat_toxin_app/constants/colors.ts`
(warm cream surfaces, forest-green primary, coral accent, safe/cautious/toxic severity colors).
A recurring cat mascot is the face of "we've got you."

**Status:** 20 of 40 planned assets. **Tag:** every asset carries the `mewguard` brand tag.

| # | Asset | Stage | Kind | UX payoff |
|---|-------|-------|------|-----------|
| 1 | Meet your guardian | Onboarding | Welcome | Waving cat builds trust at first launch |
| 2 | Name your cat | Onboarding | Empty state | Blank collar tag turns an empty "My Cats" list into an invitation |
| 3 | On the scent | Search | Loading | Sniffing nose reframes lookup latency as active care |
| 4 | Checking the database | Search | Spinner | Branded paw spinner keeps the brand present during Firestore fetch |
| 5 | All clear | Verdict · Safe | Result | Drawn check in a green shield delivers instant relief |
| 6 | Worth a second look | Verdict · Caution | Result | Raised-paw cat signals middle-ground risk without crying wolf |
| 7 | Keep this away | Verdict · Toxic | Result | Serious red verdict with a steady heartbeat — urgent, not panic-inducing |
| 8 | Steady — we'll prep this for the vet | Emergency | Reassurance | Calm cat + slow pulse holds the owner's nerve during a crisis |
| 9 | Nothing in the bowl | Recovery | No-results | Empty bowl softens a zero-result search |
| 10 | Lost the thread | Recovery | Offline | Tangled-yarn cat frames a dropped connection as fixable, not the user's fault |
| 11 | Saved to My Cats | Delight | Feedback | Heart pop + purr rewards saving a substance to a cat's profile |
| 12 | Resting easy | Delight | Ambient | Sleeping cat is visual proof that all is well |
| 13 | Mealtime logged | Care | Feedback | Full bowl + heart rewards logging a feeding in the care tracker |
| 14 | Step on the scale | Care | Empty state | Cat-on-a-scale makes the empty weight timeline approachable, not clinical |
| 15 | Time for meds | Care | Reminder | Soft-pulsing capsule nudges on-time dosing without alarm |
| 16 | Fresh claws | Care | Feedback | Tidy paw + sparkle gives grooming/claw-trim logs a small payoff |
| 17 | Vet day booked | Care | Confirmation | Stamped calendar with a check closes the loop on care planning |
| 18 | Recall watch | Emergency | Alert | Friendly ringing bell flags a product recall as important, not catastrophic |
| 19 | Guardian+ unlocked | Onboarding | Premium | Crowned mascot frames the paywall as richer care, not a wall |
| 20 | Swipe to explore | Onboarding | Intro | Sweeping paw teaches the onboarding carousel gesture without words |

**Journey stages:** onboarding · search · verdict · care · recovery · emergency · delight.

---

## `index.html` — "Mood" generic emotional-design kit

A product-agnostic kit of 10 emotional-design assets mapped to common journey moments
(empty states, success, errors, loading, recovery, delight). Built in an earlier run; kept as the
general-purpose reference companion to the app-specific MewGuard kit above.

**Journey stages:** onboarding · waiting · feedback · recovery · delight.

---

## Conventions shared by every gallery

- **Format** — pure inline `<svg>` + a small `<style>` of `@keyframes`; no JS framework, no build step.
- **Animation classes** — `a-float`, `a-blink`, `a-sway`, `a-pop`, `a-spin`, `a-pulse`, `a-wiggle`,
  `a-orbit`, `a-rise`, `a-twinkle`, `a-heartbeat`, plus MewGuard's `a-purr` / `a-tailwag` / `a-swipe`;
  one-shots use the `draw` / `pop` / `conf` (confetti) helpers.
- **Accessibility** — every stage `<svg>` has a descriptive `role="img"` + `aria-label`; all motion
  collapses to a static resting frame under `prefers-reduced-motion: reduce`.
- **Export** — **Copy SVG** / **Download** embed the needed `@keyframes` inside the SVG, so a pasted
  or saved asset stays self-animating with zero external dependencies.
