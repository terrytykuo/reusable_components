# UX Assets — Index

Self-contained galleries of **non-functional** UX assets: inline-SVG illustrations and
CSS-animated micro-motions whose only job is emotional/sentimental design, plus a `lottie/`
folder of genuine Lottie JSON animation files for app/web Lottie players. Every HTML asset is
dependency-free (pure SVG + CSS), honors `prefers-reduced-motion`, and can be copied or downloaded
as a standalone self-animating `.svg` straight from its gallery.

Open any `*.html` file in a browser. Each gallery offers journey-stage filters and three preview
toggles — **Pause motion**, **Dark stage**, and **Reduce motion** — plus per-asset **Replay**,
**Copy SVG**, and **Download** controls. The `lottie/` files drop straight into `lottie-react-native`
or a web Lottie player, and `lottie/gallery.html` previews all of them playing in the browser.

---

## `mewguard.html` — MewGuard sentimental-design kit

Asset kit for **MewGuard** (`~/Workspace/mewguard/cat_toxin_app/`), the app that helps cat owners
check whether a substance is toxic to their cat. A high-anxiety domain, so the assets carry the
*feeling* of each moment: calm for a worried owner, warmth for a clear verdict, a steady hand for
an emergency. Palette and tone follow the app theme in `cat_toxin_app/constants/colors.ts`
(warm cream surfaces, forest-green primary, coral accent, safe/cautious/toxic severity colors).
A recurring cat mascot is the face of "we've got you."

**Status:** 40 of 40 assets — complete. **Tag:** every asset carries the `mewguard` brand tag.

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
| 21 | Never heard of that one | Search | Empty state | Curious head-tilt keeps a "no results" screen from feeling like a dead end |
| 22 | Scan the label | Search | Action | Scanning frame invites the faster input mode when a worried hand can't type |
| 23 | How much matters | Verdict | Nuance | Tipping scale frames toxicity as dose-dependent, easing panic over a tiny nibble |
| 24 | Stay hydrated | Care | Reminder | Rippling water bowl makes a hydration nudge caring rather than naggy |
| 25 | Feeling better, day by day | Recovery | Tracking | Climbing line turns symptom logging into a hopeful, not clinical, ritual |
| 26 | Call your vet now | Emergency | Action | Warm pulsing handset makes the one critical action unmissable without red alarm |
| 27 | Brave little patient | Recovery | Reassurance | Bandaged, healing cat closes a scare with warmth and pride |
| 28 | With love, from us | Delight | Gratitude | Cat blowing a kiss returns affection after a review, rating, or referral |
| 29 | Saved for later | Search | Saved | Bookmark + heartbeat lets an owner keep a substance handy without re-searching |
| 30 | Your account, ready | Onboarding | Account | Cat-avatar profile badge turns sign-up into a personal welcome, not a form |
| 31 | Reminder set | Care | Reminder | Bell that rings then settles confirms MewGuard is keeping watch on meds/vet visits |
| 32 | Four days strong | Care | Streak | Filling calendar dots + a star celebrate a care streak without nagging |
| 33 | Home is where the cat is | Delight | Ambient | Cozy house with a cat in the window gives the My Home tab a belonging-here identity |
| 34 | Spread the word | Delight | Referral | Connected hearts frame sharing as protecting more cats, not marketing |
| 35 | All clear | Emergency | Resolved | Shield-check with a soft ripple closes a recall scare with calming reassurance |
| 36 | Reviewed by vets | Verdict | Trust | Vet-reviewed rosette anchors trust in the verdict at the moment certainty matters |
| 37 | Picking up where you left off | Search | History | Clock badge over recent checks lets an owner resume a frantic search without retyping |
| 38 | Back to chasing toys | Recovery | Milestone | Cat batting yarn marks full recovery and closes the worry loop on a joyful note |
| 39 | While you wait | Emergency | Guidance | First-aid step checklist channels panic into calm action before reaching the vet |
| 40 | Rate your peace of mind | Delight | Feedback | Stars framed as "peace of mind" invite warm feedback at a calm emotional high point |

**Journey stages:** onboarding (5) · search (6) · verdict (5) · care (8) · recovery (5) · emergency (5) · delight (6).

---

## `lottie/` — MewGuard Lottie animation files

Genuine, schema-valid **Lottie JSON** animations (Bodymovin v5.5, 240×240, 30 fps) that pair the
SVG/CSS gallery above with the real `.json` format a React Native / Expo app drops into
`lottie-react-native` or any web player. Every file is **non-functional** — pure emotional/sentimental
design — uses the same `cat_toxin_app/constants/colors.ts` palette, and carries the `mewguard` brand
tag inside its `meta.k` (keywords) field along with author, description, and `theme_color`. All loop
seamlessly. Files are produced by `lottie/_build.py` with the `python-lottie` object model (so output
is guaranteed valid) and can be re-generated with `python3 lottie/_build.py`.

**Status:** 10 Lottie files — a reusable core subset of the 40-asset gallery's highest-traffic
moments, now spanning **all seven journey stages**.
**Tag:** every file carries the `mewguard` brand tag in its metadata keywords.

| File | Stage | Motion | UX payoff |
|------|-------|--------|-----------|
| `mw-wave-hello.json` | Onboarding · Welcome | Mascot waves, head bobs | Builds trust and warmth before a worried owner's first search |
| `mw-paw-loading.json` | Search | Paw-pad dots pulse in sequence | Branded loader reframes toxin-database latency as active care |
| `mw-safe-check.json` | Verdict · Safe | Ring fills, check draws in | Green ring + self-drawing check delivers instant relief on a safe verdict |
| `mw-heartbeat.json` | Verdict · Toxic / Emergency | Double-thump heart pulse | Steady coral heartbeat holds a worried owner's nerve — urgent, not panic |
| `mw-water-ripple.json` | Care · Reminder | Ripples spread across a bowl | Makes a hydration nudge caring rather than naggy |
| `mw-recovery-arc.json` | Recovery · Tracking | Climbing line draws up, dots rise | Turns symptom logging into a hopeful recovery ritual, not a clinical chart |
| `mw-bell-recall.json` | Emergency · Alert | Bell rings then settles | Flags a product recall as important, not catastrophic |
| `mw-heart-pop.json` | Delight | Heart scales in + sparkle burst | Rewards saving a substance to a cat's profile |
| `mw-star-rating.json` | Delight · Feedback | Five stars pop in one by one | Invites warm feedback framed as peace of mind |
| `mw-purr-cat.json` | Delight · Ambient | Mascot breathes + blinks | Resting cat is visual proof that all is well |

**Preview:** open `lottie/gallery.html` in a browser to see all 10 animations playing side by side
with **Pause/Replay all**, a **Dark stage** toggle, and a **Speed** slider. Each animation is inlined
into the page (so it works straight from `file://`, no server needed); only the `lottie-web` player
is loaded from a CDN. The gallery is generated from the `.json` files by `lottie/_build_gallery.py`
(re-run `python3 lottie/_build_gallery.py` after editing any Lottie file).

**Usage:** load any file with `lottie-react-native` (`<LottieView source={require('./mw-heartbeat.json')} autoPlay loop />`),
the `lottie-web`/`@lottiefiles/lottie-player` web player, or import into After Effects / LottieFiles. No external
dependencies are baked into the JSON.

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
  `a-orbit`, `a-rise`, `a-twinkle`, `a-heartbeat`, plus MewGuard's `a-purr` / `a-tailwag` / `a-swipe`
  / `a-nod` / `a-ripple` / `a-scan` / `a-ring` / `a-shine`; one-shots use the `draw` / `pop` / `conf`
  (confetti) helpers.
- **Accessibility** — every stage `<svg>` has a descriptive `role="img"` + `aria-label`; all motion
  collapses to a static resting frame under `prefers-reduced-motion: reduce`.
- **Export** — **Copy SVG** / **Download** embed the needed `@keyframes` inside the SVG, so a pasted
  or saved asset stays self-animating with zero external dependencies.
