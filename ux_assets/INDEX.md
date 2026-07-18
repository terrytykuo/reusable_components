# UX Assets — Index

Self-contained galleries of **non-functional** UX assets: inline-SVG illustrations and
CSS-animated micro-motions whose only job is emotional/sentimental design, plus a `lottie/`
folder of genuine Lottie JSON animation files for app/web Lottie players. Every HTML asset is
dependency-free (pure SVG + CSS), honors `prefers-reduced-motion`, and can be copied or downloaded
as a standalone self-animating `.svg` straight from its gallery. One deliberate exception:
`mewguard-raster/` is a 1:1 PNG mirror of the MewGuard app's shipped raster assets, previewed by
`mewguard.html`'s App raster archive section (that section needs the folder alongside the HTML).

Open any `*.html` file in a browser. Each gallery offers journey-stage filters and three preview
toggles — **Pause motion**, **Dark stage**, and **Reduce motion** — plus per-asset **Replay**,
**Copy SVG**, and **Download** controls. The `lottie/` files drop straight into `lottie-react-native`
or a web Lottie player, and `lottie/gallery.html` previews all of them playing in the browser.

---

## `bopomofo.html` — 注音樂園 (Bopomofo Land) design-system reference

The **design-system / design-tokens** reference page for **注音樂園 (Bopomofo Land)**
(`~/Workspace/bopomofo/`), a website that teaches 注音符號 (Zhuyin/Bopomofo) to 3–7-year-old
children of Taiwanese families living abroad (e.g. Denmark) who already understand spoken Mandarin.
A low-stimulation, kid-first kit: low-chroma cream surfaces, soft accents, rounded shapes, huge
symbols and ≥64px touch targets, and gentle motion that fully collapses under
`prefers-reduced-motion`.

It is the visual preview of the project's CSS design tokens (the `:root` here mirrors
`~/Workspace/bopomofo/styles/tokens.css`, the canonical source) **plus** the first mascot SVGs.
It documents the palette (cream surfaces + forest-green/sky-blue/sakura-pink/warm-orange accents),
the four-tone color set, the five Taiwanese-animal mascot brand colors (Formosan black bear, leopard
cat, serow, landlocked salmon, macaque), type scale, radii/touch/shadow specs, and motion timings.
It now also includes the **idle-state SVG mascots** for all five animals (pure inline SVG + CSS,
each carrying its signature feature — bear's white V chest, leopard cat's forehead stripes & ear
spots, serow's short horns & beard, salmon's oval side-spots, macaque's red face — with a gentle
float + blink that collapses under `prefers-reduced-motion`). It now also adds the **cheer-state
SVG mascots** (answer-correct celebration) for all five — a springy squash-and-stretch bounce,
smiling squinted `^^` eyes and a burst of gold/sakura sparkle stars, all reusing the same animal
bodies and tokens and likewise stilled under `prefers-reduced-motion`. It now also adds the
**demonstrate-state SVG mascots** (gentle teaching demo) for all five — a soft nod-and-lean with an
open "speaking" mouth and attentive open eyes, plus a per-animal bopomofo speech bubble (ㄅ/ㄆ/ㄇ/ㄚ/ㄋ,
tinted to each animal's brand color) that softly pulses, again stilled under `prefers-reduced-motion`.
It now also adds the first **stroke-order writing guide** ("寫" / tracing) assets — ㄚ (two strokes:
橫撇 + 捺) and ㄧ (one horizontal stroke) — where each stroke is drawn in order inside a pale tracing
channel, with a numbered start dot and a direction arrow per stroke. Under `prefers-reduced-motion`
the animation stops and every stroke shows fully drawn, so it still works as a static stroke-order
chart. It now also adds the **picture-association "看" (look & remember) cards** for the same ㄚ/ㄧ —
a single "sound sprite" face demonstrates the mouth shape that produces each vowel (ㄚ = wide-open
mouth, ㄧ = flat smile, whose horizontal line literally *is* the ㄧ stroke), linked by a dotted cue
to the softly pulsing symbol so children map a known sound to the symbol's look; the pulse stills
under `prefers-reduced-motion`. It now also adds the **audio-demo "聽" (listen & repeat) cards** for
the same ㄚ/ㄧ — the sound sprite vocalises the symbol while three sound-wave arcs ripple outward
from its mouth toward the symbol (the three arcs pulse in sequence so the sound reads as travelling
out), with a "聽我說" play button inviting a tap to replay (audio is pre-recorded, no auto-scoring,
per the foundation doc); under `prefers-reduced-motion` the waves rest as static decorative arcs and
the button stops pulsing. It now also adds the **speak-along "換你說 · 說" (record-and-repeat) cards**
(the Formosan macaque, the playful one) for the same ㄚ — completing the full 看＋聽＋寫＋說 four-skill set
of a single learning unit: the macaque first demonstrates the sound, then invites the child to **tap the
mic and repeat** (pulsing mic), records it (mic glowing with expanding ripples + a pulsing red record dot
while the child's sound waves travel in), and finally **plays it back for a parent to "like"** (playback
button + waveform + a beating heart). Per foundation §5 there is deliberately **no auto-scoring** for young
children — a low-pressure record→playback→parent-likes loop; under `prefers-reduced-motion` the ripples,
record dot and heart all rest while staying clear. It now also adds the **listen-discriminate "聽辨" quiz card** (roadmap step 5, the leopard-cat "sound
detective" game): tap the "聽我說" play button, then pick the right symbol from a 3-choice row (ㄚ/ㄧ/ㄇ).
Three cards show the same question's three interaction states — answering, correct (the right tile
lights a green ring + check badge and gently bounces while the others fade), and a no-punishment wrong
state (the tapped tile only gives a soft shake while a pulsing green ring + down arrow gently points
to the correct answer to invite a retry). Under `prefers-reduced-motion` the bounce/shake/pulse all
rest and the green ring + arrow stay clearly visible. It now also adds the **reverse read-select
"讀選" quiz card** (roadmap step 5): read the prompt symbol at the top, then pick its sound from a
3-choice row of "聲音小精靈" mouth shapes (open mouth = ㄚ, flat smile = ㄧ, pressed lips = ㄇ),
reusing the same mouth vocabulary as the 看 unit and the same answering / correct / gentle-wrong
feedback as 聽辨. It now also adds the **daily 30-minute "能量果實" (energy-fruit) progress** assets
(roadmap step 6): the day's 30 minutes is drawn as a row of fruits on a vine (≈5 min each) that get
eaten one by one as time is spent, the one being eaten softly pulsing so the child anticipates the
end; four cards show one day's arc — starting (all six full), mid-session (three eaten husks + the
fourth pulsing), last fruit (one pulsing fruit left), and done-for-today (all eaten, a crescent moon
rising to close gently). It is framed as a gentle wind-down, not punishment or a countdown timer
(foundation §6–§7); parent-facing copy shows the remaining minutes. Under `prefers-reduced-motion`
the pulse rests while still marking which fruit is current. It now also adds the **login / select-child
entry screens** (roadmap step 7): three cards covering the entry flow — a parent-login welcome (注音樂園
title + a waving Formosan black bear + Google/Email login buttons), a **cute empty state** for when no
child profile exists yet (a dashed circle with a softly pulsing green "+" inviting "新增第一個小朋友",
with a leopard cat peeking in — an inviting empty state, not a cold blank), and a populated **select-profile**
view (per-child avatar bubbles using mascot faces — 小宇/bear, 小恩/macaque — each with a name and
learning-progress stars, plus a dashed "+" bubble to add another child). Framed as "one parent account,
multiple children, independent progress" (foundation §10); data will be backed by Firebase Auth/Firestore.
Under `prefers-reduced-motion` the wave/float/pulse all rest. It now also adds the **blending "拼讀"
factory** assets (roadmap step 8, the Formosan landlocked salmon swimming upstream): the ultimate goal
of zhuyin — combining a learned initial + final + tone into one syllable. Four cards show the blending
arc — two separate sound tiles (ㄅ + ㄚ), the tiles sliding together to merge into ㄅㄚ, putting on the
third-tone "hat" (ˇ → ㄅㄚˇ), and the finished ㄅㄚˇ = 把 with the salmon leaping out of the water in
celebration. Under `prefers-reduced-motion` the merge/drop/leap all rest with the tiles joined and the
tone settled in place. It now also adds the first **gamification-shell piece — the level-complete
"星星評價" (star-rating) reward cards** (roadmap step 9): each level awards 1–3 stars by *completeness*
(not speed, no timer pressure), the earned stars lighting up left-to-right with a gentle pop while the
main partner (Formosan black bear) cheers; three cards show a one-/two-/three-star result, with parent-facing
encouragement copy that praises effort rather than competing (foundation §6). Under `prefers-reduced-motion`
the star pops and bear cheer rest while the earned stars stay clearly lit. It now also adds the
**animal-unlock "解鎖新動物" celebration cards** (locked mystery silhouette + star progress → unlock burst
with the new partner leaping out → welcome ribbon with the black bear greeting the newcomer, leopard cat as
the example) and the third gamification piece — the **achievement "成就貼紙簿" badge/sticker-book** (roadmap
step 9): learning achievements drawn as collectible round badge stickers (symbol-mastery ㄚ/ㄧ, first-complete
star, animal-friend bear face, blending-master 拼…), earned ones full-colour with a gentle pop, not-yet-earned
ones a dashed empty slot + "?"; three cards show one album going from "just started" (2/6) to "collecting" (4/6)
to the celebratory moment a **new sticker is earned** (badge popping in a glow with sparks). Deliberately no
leaderboard or loot box (collection motivation, foundation §6); under `prefers-reduced-motion` the badge pops
rest while earned stickers stay clearly lit. The fourth gamification piece is the **streak "連續天數 · 動物的家"
(animal-home) scene** (roadmap step 9): the consecutive-day streak drawn as a cozy tree-hollow home that *grows
livelier* rather than a cold number — three cards show day 1 (the black bear alone, just moved in, a sprouting
sapling) → 3-day streak (leopard cat visits, a lantern and flowers appear) → 7-day streak (the macaque joins too,
bunting/balloons/blooming flowers/sunshine/sparks fill the home), with a row of little leaves along the bottom
gently marking the days walked; emphasises persistence over competition, no punishment for breaking a streak.
It now also adds the **parent-mode "家長園地 · 共學建議" cards** (roadmap step 10): a grown-up-facing dashboard
of three cards — a **today's co-learning recap** (warm, affirming list of what the child played with today plus a
"that's enough for today" gentle close), **co-learning tips for tonight** (concrete off-screen activities: find the
ㄚ sound around the house, read a Chinese picture book together, sticky-note game on the fridge), and a **progress
overview** (a symbol map of learned / learning / not-yet-started, foregrounding "compare to yesterday's self, not
to other children", deliberately no inter-child leaderboard) — all in the spirit of foundation §6–§7 (30-min gentle
close + parent co-learning, no time/competition pressure). It now also adds the capstone **"完整學習單元 · 一個符號的旅程"
(complete-learning-unit) screens** that assemble the prior pieces into one consistent app screen: a top status bar
(child mascot avatar from step 7 + the energy-fruit time budget from step 6), a 看／聽／說／寫／玩 five-step progress
path (steps 4–5), the current activity in the centre, and a star rating on completion (step 9). Three cards walk the
symbol ㄚ through its full journey — unit start (big symbol + "開始囉" button, fruits full), in-progress (the "看"
activity embedded in the chrome with the step pulsing and one fruit eaten), and complete (all five steps checked, three
gold stars, the black bear cheering, and a gentle "今天到這裡就好，明天再玩 ㄧ" close). Built entirely by reusing the
lg avatar, ef fruit, look sound-sprite mouth, rw stars and bear cheer — zero new drawing; under `prefers-reduced-motion`
the current-step and symbol pulses rest. Subsequent runs will wire the budget/progress to local state then Firestore.
It now also adds the **adventure-map "注音冒險地圖 · 學習旅程"** — the macro view *above* the per-symbol capstone:
the whole curriculum drawn as a winding trail up a mountain, each stop = one zhuyin symbol. Learned stops light up
green and show their symbol, the current stop pulses orange with the child's avatar parked on it ("you are here"),
and not-yet-reached stops are dashed/faint with a little lock (but faintly preview the upcoming symbol). Three cards
walk the journey — setting off (stop 1 ㄅ), reaching stop 4 (ㄅㄆㄇ learned, ㄈ in progress), and summiting the first
peak (all six lit, a flag on top and the black bear cheering with sparks). It foregrounds "how far I've walked" over
ranking — no leaderboard, no comparison to other children (foundation §6); reuses the trail/avatar/star/bear-cheer
vocabulary with zero new drawing, and under `prefers-reduced-motion` the current stop's pulse rests. Tapping the
current stop is what opens the per-symbol capstone unit. Firestore per-symbol completeness will later drive which
stops light up, the current-stop position and the length of the walked (green) trail. It now also adds the
**tone-discrimination "聲調山坡 · 聽聲調" cards** — the tone dimension the earlier symbol games were missing, and the
hardest part for these Mandarin-hearing / Danish-speaking children (Danish has no tones, foundation §4). The four
tones are drawn as **hills the Formosan serow walks**: tone 1 a high flat ridge, tone 2 an uphill climb (low→high),
tone 3 a dip-then-rise valley (down then up), tone 4 a downhill slide (high→low), each in its tone colour with a tiny
serow standing where it walked to — turning abstract pitch contours into something visible. Examples use the four tones
of one syllable **ㄅㄚ** (八 ㄅㄚ / 拔 ㄅㄚˊ / 把 ㄅㄚˇ / 爸 ㄅㄚˋ, all kid-familiar words, 把 matching the blending card).
Three cards show learn-the-four-tones (four hills side by side), listen-and-pick correct (hear a tone → tap the matching
hill; the right one lights a green ring + check with the serow summiting and cheering, others fade) and a no-punishment
wrong state (the tapped hill only softly shakes with a coral ring while a pulsing green ring + down arrow gently points
to the correct tone to invite a re-listen). It is the serow's first starring role in a game; all motion reuses existing
play-button / wave / pop / shake / hint / spark animations (zero new keyframes), so it rests cleanly under
`prefers-reduced-motion`. Real audio playback and per-tone accuracy in Firestore are pending.

**Status:** design tokens + five idle-state, five cheer-state and five demonstrate-state mascot SVGs
(roadmap steps 2–3 complete) + picture-association "看", audio-demo "聽" and stroke-order "寫"
cards for ㄚ/ㄧ plus speak-along "換你說 · 說" record-and-repeat cards — the full 看＋聽＋寫＋說 four-skill
set of one learning unit (roadmap step 4 complete) + the
listen-discriminate "聽辨" and its reverse read-select "讀選" 3-choice quiz cards, each with their
answering / correct / gentle-wrong states (roadmap step 5 complete) + the daily 30-minute "能量果實"
(energy-fruit) progress, four cards covering one day's arc through to a gentle moon-rise wind-down
(roadmap step 6 started — visual done, local-state/Firestore wiring pending) + the **login / select-child
entry screens** (parent-login welcome, cute empty state, populated profile picker — roadmap step 7
started, visuals done, Firebase Auth/Firestore wiring pending) + the **blending "拼讀" factory** (salmon
swimming upstream, four cards taking ㄅ + ㄚ + ˇ through to ㄅㄚˇ = 把 — roadmap step 8 started, blending
mechanic visualised) + the first **gamification-shell piece, the level-complete "星星評價" reward cards**
(1–3 stars by completeness, bear cheering, three cards for one-/two-/three-star results) and the
**animal-unlock "解鎖新動物" celebration cards** (locked mystery silhouette with star progress →
unlock burst with the new partner leaping out → welcome ribbon with the black bear greeting the newcomer,
leopard cat as the example — roadmap step 9 continued, collection motivation, deliberately no leaderboard
or loot box) and the **achievement "成就貼紙簿" badge/sticker-book** (collectible round badge stickers for
symbol-mastery / first-complete / animal-friend / blending-master, three cards from "just started" 2/6 →
"collecting" 4/6 → a new sticker earned with a glow-and-spark pop — roadmap step 9 continued) and the
**streak "連續天數 · 動物的家" animal-home scene** (the streak drawn as a tree-hollow home that grows livelier —
day 1 bear alone → 3-day leopard cat visits + lantern/flowers → 7-day macaque joins + bunting/balloons/sparks,
with a leaf-path counting the days, persistence over competition — roadmap step 9 continued) and the
**parent-mode "家長園地 · 共學建議" cards** (a grown-up dashboard: today's co-learning recap, off-screen co-learning
tips for tonight, and a progress overview that compares to yesterday's self rather than other children — roadmap
step 10, deliberately no leaderboard, foundation §6–§7) + the capstone **"完整學習單元 · 一個符號的旅程"** screens that
chain the avatar + energy-fruit budget + 看／聽／說／寫／玩 step path + current activity + star rating into one app screen
(three cards: unit start → in-progress "看" → three-star complete, all reusing existing pieces) + the macro
**adventure-map "注音冒險地圖 · 學習旅程"** above the capstone (a winding mountain trail of symbol-stops: learned green,
current pulsing with the child's avatar, locked dashed — three cards from setting off → reaching stop 4 → summiting
the first peak, foregrounding "how far I've walked" over ranking) + the **tone-discrimination "聲調山坡 · 聽聲調" cards**
(the four tones drawn as hills the Formosan serow walks — tone 1 flat ridge, tone 2 uphill, tone 3 dip-then-rise, tone 4
downhill — using the ㄅㄚ syllable's four tones 八/拔/把/爸; three cards: learn the four tones → listen-and-pick correct with
the serow summiting → no-punishment wrong with a gentle pointer; the hardest skill for Danish-Mandarin bilingual kids,
foundation §4). Firebase Auth/Firestore progress wiring pending.
**Tag:** carries the `bopomofo` brand tag. Design rationale: `~/Workspace/bopomofo/docs/00-foundation.md`.

---

## `mewguard.html` — MewGuard sentimental-design kit

Asset kit for **MewGuard** (`~/Workspace/mewguard/cat_toxin_app/`), the app that helps cat owners
check whether a substance is toxic to their cat. A high-anxiety domain, so the assets carry the
*feeling* of each moment: calm for a worried owner, warmth for a clear verdict, a steady hand for
an emergency. Palette and tone follow the app theme in `cat_toxin_app/constants/colors.ts`
(warm cream surfaces, forest-green primary, coral accent, safe/cautious/toxic severity colors).
A recurring cat mascot is the face of "we've got you."

**品牌統一(2026-07):** 以 Wreath wordmark / Home-screen tabby 為基準,全 kit 吉祥物統一為
**品牌虎斑「Mew」= logo 貓本人**——奶油毛 `#EFDDB9`、赭金條紋 `#B28135`(額頭 M/側腹/尾環)、
綠杏仁眼+直立瞳孔 `#587848`、珊瑚腮紅 `#E7724F`、**紅領巾 `#EC5447`(MewGuard 制服,吉祥物
出場必帶)**;里程碑/慶祝類資產引用 wordmark 的葉飾(`#42644C`/`#5F8A5E`)與寶石花
(`#CA3B70`/`#F5C139`);Caution/Toxic 盾牌貓臉加白色 M 條紋(severity 功能色不動)。

**Status:** 32 journey assets + 8 cat-avatar breed presets(見下方 Cat avatar 區段)+ 14 raster-archive
cards(前期 PNG 檔案庫,見下方 App raster 區段). **Tag:** every asset carries the `mewguard` brand tag.

| # | Asset | Stage | Kind | UX payoff |
|---|-------|-------|------|-----------|
| 1 | On the scent | Search | Loading | Sniffing nose reframes lookup latency as active care |
| 2 | Checking the database | Search | Spinner | Branded paw spinner keeps the brand present during Firestore fetch |
| 3 | All clear | Verdict · Safe | Result | Drawn check in a green shield delivers instant relief |
| 4 | Worth a second look | Verdict · Caution | Result | Raised-paw cat signals middle-ground risk without crying wolf |
| 5 | Keep this away | Verdict · Toxic | Result | Serious red verdict with a steady heartbeat — urgent, not panic-inducing |
| 6 | Nothing in the bowl | Recovery | No-results | Empty bowl softens a zero-result search |
| 7 | Lost the thread | Recovery | Offline | Tangled-yarn cat frames a dropped connection as fixable, not the user's fault |
| 8 | Mealtime logged | Care | Feedback | Full bowl + heart rewards logging a feeding in the care tracker |
| 9 | Time for meds | Care | Reminder | Soft-pulsing capsule nudges on-time dosing without alarm |
| 10 | Fresh claws | Care | Feedback | Tidy paw + sparkle gives grooming/claw-trim logs a small payoff |
| 11 | Vet day booked | Care | Confirmation | Stamped calendar with a check closes the loop on care planning |
| 12 | Recall watch | Emergency | Alert | Friendly ringing bell flags a product recall as important, not catastrophic |
| 13 | Guardian+ unlocked | Onboarding | Premium | Crowned mascot frames the paywall as richer care, not a wall |
| 14 | Never heard of that one | Search | Empty state | Curious head-tilt keeps a "no results" screen from feeling like a dead end |
| 15 | Scan the label | Search | Action | Scanning frame invites the faster input mode when a worried hand can't type |
| 16 | Stay hydrated | Care | Reminder | Rippling water bowl makes a hydration nudge caring rather than naggy |
| 17 | Feeling better, day by day | Recovery | Tracking | Climbing line turns symptom logging into a hopeful, not clinical, ritual |
| 18 | Call your vet now | Emergency | Action | Warm pulsing handset makes the one critical action unmissable without red alarm |
| 19 | Brave little patient | Recovery | Reassurance | Bandaged, healing cat closes a scare with warmth and pride |
| 20 | With love, from us | Delight | Gratitude | Cat blowing a kiss returns affection after a review, rating, or referral |
| 21 | Saved for later | Search | Saved | Bookmark + heartbeat lets an owner keep a substance handy without re-searching |
| 22 | Your account, ready | Onboarding | Account | Cat-avatar profile badge turns sign-up into a personal welcome, not a form |
| 23 | Reminder set | Care | Reminder | Bell that rings then settles confirms MewGuard is keeping watch on meds/vet visits |
| 24 | Four days strong | Care | Streak | Filling calendar dots + a star celebrate a care streak without nagging |
| 25 | Spread the word | Delight | Referral | Connected hearts frame sharing as protecting more cats, not marketing |
| 26 | All clear | Emergency | Resolved | Shield-check with a soft ripple closes a recall scare with calming reassurance |
| 27 | Reviewed by vets | Verdict | Trust | Vet-reviewed rosette anchors trust in the verdict at the moment certainty matters |
| 28 | Picking up where you left off | Search | History | Clock badge over recent checks lets an owner resume a frantic search without retyping |
| 29 | Back to chasing toys | Recovery | Milestone | Cat batting yarn marks full recovery and closes the worry loop on a joyful note |
| 30 | While you wait | Emergency | Guidance | First-aid step checklist channels panic into calm action before reaching the vet |
| 31 | Rate your peace of mind | Delight | Feedback | Stars framed as "peace of mind" invite warm feedback at a calm emotional high point |
| 32 | Pill time | Care | Empty state | Amber bottle + floating capsule invites the first medication entry without guilt |
| 33 | Vet pulse | Care | Empty state | Stethoscope with a beating heart frames an empty vet history as care-in-waiting |
| 34 | Shield spark | Care | Empty state | Shield + twinkling syringe turns a blank vaccine list into "start protecting" |

**Journey stages:** onboarding (2) · search (6) · verdict (4) · care (10) · recovery (5) · emergency (4) · delight (3).

### Cat avatar — 參數化貓 avatar 系統(頁尾互動區段,tag `cat-avatar`)

`mewguard.html` 頁尾另有一個 **`Cat avatar` 互動區段**(錨點 `#cat-avatar`,篩選列有專屬
「Cat avatar」chip):MewGuard「add cat flow 情感化改造」的視覺驗證雛形。與 gallery 其他
靜態資產不同,這是**參數化 avatar 系統**的原型——貓由分層 SVG 即時生成,所有特徵(色盤/花紋、
耳型尖摺、體態、年齡比例)都是可存入 Firestore cat doc 的參數,對應永久 `<CatAvatar>`
元件(無照片時取代通用貓 icon)。造型語言遵循品牌基準:杏仁眼+直立瞳、常駐珊瑚腮紅
(幼貓加碼)、赭金虎斑筆觸、**紅領巾層(品牌制服,參數可關;preset 常駐、儀式於生成時繫上)**;
九色盤全面暖化(無冷藍灰),`orange` 色盤即 logo 貓本色。三個子區塊:①**創造儀式模擬**——依
flow 順序(名字→年齡→體重→性別→品種→生成)互動走完「剪影→命名甦醒(五官依序彈出、眨眼、
尾巴擺動)→體態成形→毛色花紋解鎖→魔法生成(**戴上紅領巾+wordmark 半圈花圈依序綻放**)」,
性別刻意不做外觀對應(避免刻板印象)改以動作回應;②**八個品種 preset 卡**——對應 app 現有
品種選項(Mixed/Not sure 預設黑貓,呼應開場剪影),是正規 gallery 卡片,**Copy SVG / Download
輸出的檔案自帶眨眼與尾巴動畫**;③**縮小可讀性測試**——52px 列表與 32px 條帶(領巾紅在小尺寸
即品牌識別點)。互動區段由 vanilla JS 驅動(仍零外部依賴),遵守頁面的 Pause / Dark stage /
Reduce motion 三個預覽開關與 `prefers-reduced-motion`。

**技術對應:** SVG 結構 ↔ `react-native-svg` 幾乎 1:1;transform 動畫 ↔ Reanimated;魔法粒子
建議換用現成 Lottie(見 `lottie/`)。
**Status:** 已 port 至 `cat_toxin_app/components/cat-avatar/`(品牌統一版含 bandana 參數);
app 端的生成花圈時刻尚未 port(follow-up)。
**Canonical source:** 此區段即唯一正本,後續迭代直接改 `mewguard.html`。
**Tag:** 區段與八張 preset 卡皆帶 `cat-avatar`(加上 `mewguard` 品牌 tag)。

### App raster — 前期 PNG 資產檔案庫(`mewguard-raster/`,tag `app-raster`)

`mewguard.html` 最尾端(Cat avatar 之後)另有 **`App raster` 區段**(錨點 `#app-raster`,篩選列
專屬「App raster」chip):app 前期實際 ship 的 raster 資產檔案庫,是 gallery「純 inline SVG」
原則的唯一例外。PNG 原檔 1:1 鏡像自 `cat_toxin_app/assets/`(含 @2x/@3x 密度變體,共 78 檔
約 20 MB)存於同層 `mewguard-raster/` 資料夾,依原始子目錄結構擺放;`.json`(Lottie)不鏡像
——`mw-cat-box`、`mw-sparkle-burst` 的正本本來就在 `lottie/`,`my-cats/cat.json` 為外部
LottieFiles 素材。14 張卡涵蓋:品牌識別(花圈 logo、app icon、手繪賓士貓 portrait、
**尚未客製的 icon placeholder 稽核卡**——adaptive/splash icon 仍是漣漪底、favicon 仍是 Expo
方塊)、onboarding 01–07(分層 hero 元件、三張功能導覽全屏 mock、通知權限、方案比較表、
paywall 套件)、兩代 splash 散景(白底扁平版 vs 現行透明色鉛筆版)、search demo 縮圖、
claw-trim 四掌、My Cats 房間底圖。兩代吉祥物並存:扁平虎斑(logo/icon/splash)與手繪賓士
(portrait/onboarding hero/search demo)。卡片圖可**點擊開原檔**,每卡附 **Copy app path**
按鈕(複製 `cat_toxin_app` 內路徑)、`files` 行列出檔名與尺寸;圖片皆 `loading="lazy"`。

**Status:** 14 cards / 78 mirrored PNGs — 檔案庫(archive),非設計提案;新增前期資產時同步
鏡像進 `mewguard-raster/` 並補卡。
**Tag:** 區段與 14 張卡皆帶 `app-raster`(加上 `mewguard` 品牌 tag)。

---

## `lottie/` — MewGuard Lottie animation files

Genuine, schema-valid **Lottie JSON** animations (Bodymovin v5.5, 240×240, 30 fps) that pair the
SVG/CSS gallery above with the real `.json` format a React Native / Expo app drops into
`lottie-react-native` or any web player. Every file is **non-functional** — pure emotional/sentimental
design — uses the same `cat_toxin_app/constants/colors.ts` palette, and carries the `mewguard` brand
tag inside its `meta.k` (keywords) field along with author, description, and `theme_color`. All loop
seamlessly. Files are produced by `lottie/_build.py` with the `python-lottie` object model (so output
is guaranteed valid) and can be re-generated with `python3 lottie/_build.py`. Mascot appearances
follow the **品牌統一(2026-07)** brand tabby「Mew」(see the mewguard.html section above): the
`_build.py` palette carries the full Mew color block (奶油毛 `#EFDDB9`、赭金條紋 `#B28135`、綠杏仁眼
+直立瞳 `#587848`/`#2A1F14`、腮紅 `#E7724F` .42、棕鼻 `#7A4A2E`、紅領巾 `#EC5447`/`#D64A3C`/`#C8402F`).

**Status:** 22 Lottie files — a reusable core subset of the 31-asset gallery's highest-traffic
moments, spanning **all seven journey stages**. 吉祥物已品牌統一(2026-07):`mw-cat-box` 探頭貓
=品牌虎斑 Mew(奶油毛+額頭 M+綠杏仁眼越過箱緣;領巾被紙箱遮擋,依盾牌臉慣例以 M 條紋帶品牌識別)、
`mw-on-the-scent` 掌印改赭金 `#B28135`(75%,對齊 gallery 同名資產)。
**Tag:** every file carries the `mewguard` brand tag in its metadata keywords.

| File | Stage | Motion | UX payoff |
|------|-------|--------|-----------|
| `mw-cat-box.json` | Onboarding · Empty state | Carton wobbles, flaps open, the brand tabby Mew peeks halfway out — M stripes and green almond eyes over the rim — then a "?" pops up | Invites an owner to add their first cat on an empty My Cats screen |
| `mw-sparkle-burst.json` | Onboarding · Add-cat generate | Radial burst of stars, dots and tiny hearts (transparent bg; loopable) | Masks the Firestore write + photo upload as the "magic generate" moment of the cat-avatar creation ritual |
| `mw-guardian-crown.json` | Onboarding · Premium | Gold crown settles in, sparkles pop | Frames the Guardian+ paywall as richer care unlocked, not a wall hit |
| `mw-paw-loading.json` | Search | Paw-pad dots pulse in sequence | Branded loader reframes toxin-database latency as active care |
| `mw-on-the-scent.json` | Search · Loading | Magnifier glides over paw prints that light up in sequence | Reframes a search-in-progress as the cat actively following the scent |
| `mw-scan-label.json` | Search · Action | Scan beam sweeps down a label card | Invites the faster scan input when a worried hand can't type |
| `mw-clock-history.json` | Search · History | Clock hands sweep backward, rewinding | Lets a worried owner resume a frantic search without retyping |
| `mw-safe-check.json` | Verdict · Safe | Ring fills, check draws in | Green ring + self-drawing check delivers instant relief on a safe verdict |
| `mw-heartbeat.json` | Verdict · Toxic / Emergency | Double-thump heart pulse | Steady coral heartbeat holds a worried owner's nerve — urgent, not panic |
| `mw-vet-rosette.json` | Verdict · Trust | Rosette pops in, check draws | Anchors trust in the verdict at the moment certainty matters most |
| `mw-meal-bowl.json` | Care · Feedback | Kibble drops into a bowl, heart pops | Rewards logging a feeding in the care tracker |
| `mw-water-ripple.json` | Care · Reminder | Ripples spread across a bowl | Makes a hydration nudge caring rather than naggy |
| `mw-meds-reminder.json` | Care · Reminder | Capsule pulses inside a breathing halo | Nudges on-time dosing without alarm |
| `mw-vet-calendar.json` | Care · Confirmation | A check stamps onto a calendar date | Closes the loop on care planning when a vet visit is booked |
| `mw-recovery-arc.json` | Recovery · Tracking | Climbing line draws up, dots rise | Turns symptom logging into a hopeful recovery ritual, not a clinical chart |
| `mw-chase-toy.json` | Recovery · Milestone | Yarn ball bounces and spins | Celebrates the milestone of a recovered cat back to play |
| `mw-brave-patient.json` | Recovery · Reassurance | Heart beats softly under a band-aid, healing ring expands | Closes a health scare with warmth and pride |
| `mw-bell-recall.json` | Emergency · Alert | Bell rings then settles | Flags a product recall as important, not catastrophic |
| `mw-call-vet.json` | Emergency · Action | Warm handset pulses, sound waves ring | Makes the one critical action unmissable without a red alarm |
| `mw-first-aid.json` | Emergency · Guidance | First-aid steps check off one by one | Channels panic into ordered, doable action while help is on the way |
| `mw-star-rating.json` | Delight · Feedback | Five stars pop in one by one | Invites warm feedback framed as peace of mind |
| `mw-spread-word.json` | Delight · Referral | Hearts pop out along threads from a central one | Frames sharing MewGuard as protecting more cats, not marketing |

**Preview:** open `lottie/gallery.html` in a browser to see all 22 animations playing side by side
with **Pause/Replay all**, a **Dark stage** toggle, and a **Speed** slider. Each animation is inlined
into the page (so it works straight from `file://`, no server needed); only the `lottie-web` player
is loaded from a CDN. The gallery is generated from the `.json` files by `lottie/_build_gallery.py`
(re-run `python3 lottie/_build_gallery.py` after editing any Lottie file).

**Usage:** load any file with `lottie-react-native` (`<LottieView source={require('./mw-heartbeat.json')} autoPlay loop />`),
the `lottie-web`/`@lottiefiles/lottie-player` web player, or import into After Effects / LottieFiles. No external
dependencies are baked into the JSON.

---

## Errand Pin (順路 / EnRoute) — Lottie kit (lives inside `index.html`)

8 genuine Lottie JSON animations for the **Errand Pin** location-todo app
(`~/Workspace/onmyway/`): a recurring **map-pin** motif, own palette (Pin `#2F6BF6` / done green /
alert amber), covering onboarding ×2, empty states ×2, geofence trigger, completion, time-reminder,
locating. Deliberately small to match the app's "極簡" positioning. Tag: `errandpin` / `enroute`.

The standalone source folder (`enroute-lottie/` — `python-lottie` build scripts + raw `.json`) was
removed; the kit now lives **only inlined inside `index.html`** as a third selectable kit
(Mood / MewGuard / Errand Pin). The raw animation JSON can be recovered from the
`<script id="er-lottie-data">` block in `index.html` if the source pipeline is ever needed again.

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
