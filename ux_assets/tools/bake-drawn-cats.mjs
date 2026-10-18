#!/usr/bin/env node
// Bake the hand-drawn cat avatar cards of mewguard.html (#cat-avatar) from the
// app's split path data, and splice them between the two marker comments
//
//   <!-- hand-drawn-cats:begin -->  …  <!-- hand-drawn-cats:end -->
//
//   node ux_assets/tools/bake-drawn-cats.mjs            # APP_DIR defaults to ~/Workspace/MewGuard/cat_toxin_app
//   APP_DIR=/path/to/cat_toxin_app node ux_assets/tools/bake-drawn-cats.mjs
//
// Sources (read only):
//   cat_toxin_app/components/cat-avatar/drawnCatData.ts   — sit pose: BODY_D / TAIL_D / pivots / per-cat overlays
//   cat_toxin_app/components/cat-avatar/drawnCatPoses.ts  — lying + stretch: per-pose box, paths, pivots, per-cat overlays
//   (both are themselves generated from assets/cat-avatar/hand-drawn/**/*.svg, Terry's drawings)
// Timings: cat_toxin_app/components/cat-avatar/presets.ts ANIM (sit) and
//   DrawnCatPose.tsx LYING / STRETCH (docs/plans/2026-10-18-cat-poses-design.md §3).
//
// Every card is a standalone, self-animating SVG: colours inline, one <style>
// with only the keyframes that pose needs, pivots written as inline
// transform-origin in the drawing's own user units (CSS resolves px origins in
// the element's local coordinate system, so the trio's translate/scale wrappers
// do not disturb them). Every animated group carries `hd-a` so the page's
// Reduce-motion toggle and prefers-reduced-motion can switch all of them off.

import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { homedir } from 'node:os';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const HTML = join(HERE, '..', 'mewguard.html');
const APP = process.env.APP_DIR || join(homedir(), 'Workspace/MewGuard/cat_toxin_app');
const CAT_DIR = join(APP, 'components/cat-avatar');

const BEGIN = '<!-- hand-drawn-cats:begin -->';
const END = '<!-- hand-drawn-cats:end -->';

// ---------------------------------------------------------------- source data
function readTs(file) { return readFileSync(join(CAT_DIR, file), 'utf8'); }
function jsonAfter(src, name) {
  const m = src.match(new RegExp(`export const ${name}[^=]*=\\s*(\\{[\\s\\S]*?\\n\\});`));
  if (!m) throw new Error(`${name} not found`);
  return JSON.parse(m[1]);
}
function strConst(src, name) {
  const m = src.match(new RegExp(`export const ${name} = ['"]([^'"]+)['"]`));
  if (!m) throw new Error(`${name} not found`);
  return m[1];
}
function pivotConst(src, name) {
  const m = src.match(new RegExp(`export const ${name} = \\{ x: ([\\d.]+), y: ([\\d.]+) \\}`));
  if (!m) throw new Error(`${name} not found`);
  return { x: Number(m[1]), y: Number(m[2]) };
}

const sitSrc = readTs('drawnCatData.ts');
const SIT = {
  viewBox: strConst(sitSrc, 'DRAWN_VIEWBOX'),
  headViewBox: strConst(sitSrc, 'DRAWN_HEAD_VIEWBOX'),
  bodyD: strConst(sitSrc, 'BODY_D'),
  tailD: strConst(sitSrc, 'TAIL_D'),
  pivots: {
    tail: pivotConst(sitSrc, 'DRAWN_TAIL_PIVOT'),
    breath: pivotConst(sitSrc, 'DRAWN_BREATH_PIVOT'),
    blink: pivotConst(sitSrc, 'DRAWN_BLINK_PIVOT'),
  },
  cats: jsonAfter(sitSrc, 'DRAWN_CATS'),
};
const POSES = jsonAfter(readTs('drawnCatPoses.ts'), 'DRAWN_POSES');

const CATS = [
  { id: 'tabby',   zh: '虎斑', en: 'Orange tabby' },
  { id: 'black',   zh: '黑貓', en: 'Black' },
  { id: 'grey',    zh: '灰貓', en: 'Grey' },
  { id: 'calico',  zh: '三花', en: 'Calico' },
  { id: 'tuxedo',  zh: '賓士', en: 'Tuxedo' },
  { id: 'siamese', zh: '暹羅', en: 'Siamese' },
];

// ---------------------------------------------------------------- animation css
// Blink: the app schedules a random 2.6–6 s wait, 120/30/120 ms close-hold-open,
// 16 % double blinks. A CSS loop cannot be random, so one 9.6 s cycle carries a
// single blink at 42 % and a double at 88 % (same 120/30/120 + 240 ms gap / 130 ms).
const BLINK = '@keyframes hdBlink{0%,42%,44.81%,88%,90.81%,93.31%,94.67%,100%{transform:scaleY(1)}43.25%,43.56%,89.25%,89.56%,93.99%{transform:scaleY(.07)}}' +
  '.hd-blink{animation:hdBlink 9.6s ease-in-out infinite}';
const REDUCED = '@media (prefers-reduced-motion:reduce){.hd-a{animation:none}}';

const CSS = {
  sit: '@keyframes hdBreathSit{0%,100%{transform:scaleY(1)}50%{transform:scaleY(1.014)}}' +
    '@keyframes hdTailSit{from{transform:rotate(-4deg)}to{transform:rotate(3.5deg)}}' +
    '.hd-breath-sit{animation:hdBreathSit 3.4s ease-in-out infinite}' +
    '.hd-tail-sit{animation:hdTailSit 3.8s ease-in-out infinite alternate}' + BLINK,
  // lying: slower everything; every 9 s a 180 ms peek held 900 ms, shut in 160 ms
  lying: '@keyframes hdBreathLie{0%,100%{transform:scaleY(1)}50%{transform:scaleY(1.012)}}' +
    '@keyframes hdTailLie{from{transform:rotate(-2.5deg)}to{transform:rotate(2.5deg)}}' +
    '@keyframes hdPeekShut{0%,80%,93.8%,100%{transform:scaleY(1)}82%,92%{transform:scaleY(0)}}' +
    '@keyframes hdPeekOpen{0%,80%,93.8%,100%{transform:scaleY(0)}82%,92%{transform:scaleY(1)}}' +
    '.hd-breath-lie{animation:hdBreathLie 4.4s ease-in-out infinite}' +
    '.hd-tail-lie{animation:hdTailLie 4.6s ease-in-out infinite alternate}' +
    '.hd-peek-shut{animation:hdPeekShut 9s ease-out infinite}' +
    '.hd-peek-open{animation:hdPeekOpen 9s ease-out infinite}',
  // stretch: 7 s cycle — tail lifts 7° at 35 % (back-out), body elongates from the
  // planted hind paw at 38 % (the tail leads by ~140 ms), both hold, both relax
  stretch: '@keyframes hdBreathStr{0%,100%{transform:scaleY(1)}50%{transform:scaleY(1.01)}}' +
    '@keyframes hdTailStr{from{transform:rotate(-3deg)}to{transform:rotate(3.5deg)}}' +
    '@keyframes hdLift{0%,35%{transform:rotate(0);animation-timing-function:cubic-bezier(.34,1.56,.64,1)}54%,72%{transform:rotate(7deg);animation-timing-function:ease-in-out}90%,100%{transform:rotate(0)}}' +
    '@keyframes hdStretch{0%,38%{transform:scale(1,1);animation-timing-function:cubic-bezier(.4,0,.2,1)}57%,70%{transform:scale(1.035,.985);animation-timing-function:ease-in-out}86%,100%{transform:scale(1,1)}}' +
    '.hd-breath-str{animation:hdBreathStr 3.6s ease-in-out infinite}' +
    '.hd-tail-str{animation:hdTailStr 3.3s ease-in-out infinite alternate}' +
    '.hd-lift{animation:hdLift 7s linear infinite}' +
    '.hd-stretch{animation:hdStretch 7s linear infinite}' + BLINK,
};

// ---------------------------------------------------------------- svg pieces
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;');
function path(p) {
  let a = `d="${p.d}" fill="${p.fill}"`;
  if (p.stroke) {
    a += ` stroke="${p.stroke}"`;
    if (p.strokeWidth != null) a += ` stroke-width="${p.strokeWidth}"`;
    if (p.strokeLinecap) a += ` stroke-linecap="${p.strokeLinecap}"`;
    if (p.strokeLinejoin) a += ` stroke-linejoin="${p.strokeLinejoin}"`;
  }
  return `<path ${a}/>`;
}
const paths = (list) => list.map(path).join('');
const origin = (pt) => `transform-origin:${pt.x}px ${pt.y}px`;
const g = (cls, style, inner) => `<g class="hd-a ${cls}" style="${style}">${inner}</g>`;

/** The sit cat: breath ⊃ [ tail(sway) , body , overlays , eyes(blink) ]. */
function sitBody(id) {
  const c = SIT.cats[id];
  return g('hd-breath-sit', origin(SIT.pivots.breath),
    g('hd-tail-sit', origin(SIT.pivots.tail), path({ d: SIT.tailD, fill: c.fill }) + paths(c.tailOverlays)) +
    path({ d: SIT.bodyD, fill: c.fill }) + paths(c.bodyOverlays) +
    g('hd-blink', origin(SIT.pivots.blink), paths(c.eyes)));
}

/** Lying: breath ⊃ [ tail(sway) , body , overlays , shut arcs (scale away) , open eyes (scale in) ]. */
function lyingBody(id) {
  const p = POSES.lying, c = p.cats[id];
  const eye = (i) => g('hd-peek-shut', origin(i ? p.pivots.eyeR : p.pivots.eyeL), path(c.eyes[i]));
  const open = (i) => {
    const e = c.eyesOpen[i];
    return g('hd-peek-open', origin(i ? p.pivots.eyeR : p.pivots.eyeL) + ';transform:scaleY(0)',
      `<ellipse cx="${e.cx}" cy="${e.cy}" rx="${e.rx}" ry="${e.ry}" fill="${e.fill}"/>`);
  };
  return g('hd-breath-lie', origin(p.pivots.breath),
    g('hd-tail-lie', origin(p.pivots.tail), path({ d: p.tailD, fill: c.fill }) + paths(c.tailOverlays)) +
    path({ d: p.bodyD, fill: c.fill }) + paths(c.bodyOverlays) +
    eye(0) + eye(1) + open(0) + open(1));
}

/** Stretch: breath ⊃ elongate ⊃ [ lift ⊃ tail(sway) , body , overlays , eyeL(blink) , eyeR(blink) ]. */
function stretchBody(id) {
  const p = POSES.stretch, c = p.cats[id];
  return g('hd-breath-str', origin(p.pivots.breath),
    g('hd-stretch', origin(p.pivots.stretch),
      g('hd-lift', origin(p.pivots.tail),
        g('hd-tail-str', origin(p.pivots.tail), path({ d: p.tailD, fill: c.fill }) + paths(c.tailOverlays))) +
      path({ d: p.bodyD, fill: c.fill }) + paths(c.bodyOverlays) +
      g('hd-blink', origin(p.pivots.eyeL), path(c.eyes[0])) +
      g('hd-blink', origin(p.pivots.eyeR), path(c.eyes[1]))));
}

function svg(viewBox, label, css, inner, extraAttrs = '') {
  return `<svg viewBox="${viewBox}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${esc(label)}"${extraAttrs}>` +
    `<style>${css}${REDUCED}</style>${inner}</svg>`;
}

// ---------------------------------------------------------------- the trio
// Same geometry as the app's hero panel (components/my-cats/heroPoses.ts): the
// sit cat's render box is the unit, a lying / stretching cat draws ×1.5 as wide
// (POSE_WIDTH_FACTOR) and shares the sit cat's ground line (paws at y = 254.5).
const SIT_BOX = { w: 236, h: 265, minX: -4, minY: -6, ground: 254.5 };
function trio(id, cat) {
  const GAP = 14, FACTOR = 1.5;
  const parseVB = (s) => s.split(' ').map(Number);
  let x = 0;
  const parts = [];
  const place = (pose) => {
    if (pose === 'sit') {
      const b = { w: SIT_BOX.w, h: SIT_BOX.h, minX: SIT_BOX.minX, minY: SIT_BOX.minY, groundFrac: (SIT_BOX.ground - SIT_BOX.minY) / SIT_BOX.h, s: 1 };
      return { ...b, body: sitBody(id) };
    }
    const p = POSES[pose];
    const [minX, minY] = parseVB(p.viewBox);
    const w = SIT_BOX.w * FACTOR * (p.width / p.art.width);
    const h = w * p.height / p.width;
    return { w, h, minX, minY, groundFrac: p.groundFrac, s: w / p.width, body: pose === 'lying' ? lyingBody(id) : stretchBody(id) };
  };
  const boxes = ['sit', 'lying', 'stretch'].map(place);
  const groundY = Math.max(...boxes.map((b) => b.groundFrac * b.h));
  const height = Math.ceil(Math.max(...boxes.map((b) => groundY - b.groundFrac * b.h + b.h)));
  for (const b of boxes) {
    const top = groundY - b.groundFrac * b.h;
    const tx = x - b.minX * b.s, ty = top - b.minY * b.s;
    parts.push(`<g transform="translate(${tx.toFixed(2)} ${ty.toFixed(2)}) scale(${b.s.toFixed(5)})">${b.body}</g>`);
    x += b.w + GAP;
  }
  const width = Math.ceil(x - GAP);
  return svg(`0 0 ${width} ${height}`, `${cat.zh} / ${cat.en} — hand-drawn cat, sitting, lying and stretching`,
    CSS.sit + CSS.lying + CSS.stretch, parts.join(''));
}

// ---------------------------------------------------------------- cards
const DESC = {
  tabby:   'The default avatar (<code>DEFAULT_AVATAR_ID</code>). Orange <code>#E3994E</code> silhouette under 15 ochre <code>#AD712E</code> stripes, plus four more inside the tail group so they ride the sway; white muzzle, navy eyes. Also the orange / ginger / Maine Coon breed fallback.',
  black:   'Near-black <code>#030303</code> silhouette — the whole cat is one fill — given form only by seven pale <code>#FCF8F7</code> fur strokes down the flank, a white nose and white eyes. The hardest coat to read on a dark stage; check it there.',
  grey:    'Slate <code>#7E8894</code> silhouette with eight charcoal <code>#4A4A4A</code> fur strokes down the flank and a navy nose. Where British / Russian / Korat / Chartreux and any “blue” or 灰 breed land.',
  calico:  'Off-white <code>#F8F6F3</code> silhouette with three ginger <code>#F08C30</code> patches and three dark ones, a ginger tail tip in the tail group, and odd eyes — one navy, one white where it sits on a dark patch. Also the tortie fallback.',
  tuxedo:  'Black silhouette with the white <code>#FCF8F7</code> bib, blaze, three socks and a white tail tip painted on top. Legacy <code>socks:black</code> cats map here too — black with white feet <i>is</i> this drawing.',
  siamese: 'Cream <code>#FFF1D8</code> silhouette with taupe <code>#6D4E3F</code> points — mask, ears, paws and the tail tip — and the only coat whose overlays use a stroke (two paths). Himalayan / Ragdoll / Birman and any “point” breed share it.',
};

function coatCard(cat) {
  const c = SIT.cats[cat.id];
  const layers = 2 + c.bodyOverlays.length + c.tailOverlays.length + c.eyes.length;
  return `      <article class="card" data-cat="cat-avatar" data-coat="${cat.id}" style="--c:var(--green)">
        <div class="stage">${svg(SIT.viewBox, `${cat.zh} / ${cat.en} — hand-drawn cat, sitting`, CSS.sit, sitBody(cat.id))}</div>
        <div class="body">
          <div class="kind">Cat avatar · Hand-drawn · <code>${cat.id}</code></div>
          <div class="name">${cat.zh} · ${cat.en}</div>
          <p class="goal">${DESC[cat.id]} <small>${layers} paths.</small></p>
          <div class="tags"><span class="tag brand">mewguard</span><span class="tag">cat-avatar</span><span class="tag">${cat.id}</span></div>
        </div>
      </article>
`;
}

function posesCard(cat) {
  return `      <article class="card" data-cat="cat-avatar" style="--c:var(--green)">
        <div class="stage trio">${trio(cat.id, cat)}</div>
        <div class="body">
          <div class="kind">Cat avatar · Poses</div>
          <div class="name">Sit, lying &amp; stretch</div>
          <p class="goal">One cat, three drawings — each pose has its own silhouette and art box, laid out here exactly as the My Cats hero seats them: a lying or stretching cat is <b>×1.5</b> the sit cat's width and shares its <b>ground line</b>. Lying breathes slowly and <b>peeks</b> every ~9&nbsp;s; stretch runs a <b>7&nbsp;s loop</b> — tail lifts 7°, then the body elongates 3.5% from the planted hind paw.</p>
          <div class="tags"><span class="tag brand">mewguard</span><span class="tag">cat-avatar</span><span class="tag">poses</span></div>
        </div>
      </article>
`;
}

const cards = CATS.map(coatCard).join('') + posesCard(CATS[0]);

// ---------------------------------------------------------------- splice
const html = readFileSync(HTML, 'utf8');
const a = html.indexOf(BEGIN), b = html.indexOf(END);
if (a < 0 || b < 0 || b < a) throw new Error('markers not found in mewguard.html');
const out = html.slice(0, a + BEGIN.length) + '\n' + cards + '      ' + html.slice(b);
writeFileSync(HTML, out);

const kb = (s) => (Buffer.byteLength(s) / 1024).toFixed(1) + ' KB';
console.log(`baked ${CATS.length} sit cards + 1 poses card into ${HTML}`);
for (const cat of CATS) console.log(`  ${cat.id.padEnd(8)} ${kb(svg(SIT.viewBox, '', CSS.sit, sitBody(cat.id)))}`);
console.log(`  poses    ${kb(trio(CATS[0].id, CATS[0]))}`);
console.log(`  head crop viewBox for the legibility mock: ${SIT.headViewBox}`);
