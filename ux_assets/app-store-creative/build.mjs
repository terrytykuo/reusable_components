#!/usr/bin/env node
// Build MewGuard's App Store "Product page header / Search results" creative
// (en + zh-TW) from template.html, with headless Chrome.
//
//   node ux_assets/app-store-creative/build.mjs                 # all variants + guide previews
//   node ux_assets/app-store-creative/build.mjs --only universal --lang zh-TW
//   APP_DIR=/path/to/cat_toxin_app CHROME=/path/to/chrome node build.mjs
//
// Reads (never writes) from the app checkout: the hand-drawn tabby
// (assets/cat-avatar/hand-drawn/tabby.svg) and the brand fonts in node_modules.
// Writes  header-universal-<lang>.png — the deliverables for ASC (3840×1646, RGB, no alpha)
//         out/<name>.png            — the 5244×2950 universal renders (optional alternative)
//         out/preview/<name>-guides.png — 25 % previews with Apple's safe area + crop frames
//         build/*.html              — intermediate pages (ignored by git)

import { readFileSync, writeFileSync, mkdirSync, existsSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { homedir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const HERE = dirname(fileURLToPath(import.meta.url));
const APP = process.env.APP_DIR || join(homedir(), 'Workspace/MewGuard/cat_toxin_app');
const CHROME = process.env.CHROME || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const OUT = join(HERE, 'out');
const PREVIEW = join(OUT, 'preview');
const BUILD = join(HERE, 'build');

const args = process.argv.slice(2);
const flag = (name) => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : null; };
const ONLY = flag('--only');
const LANG = flag('--lang');
const GUIDES_ONLY = args.includes('--guides');

// ---------------------------------------------------------------- canvases
// Safe areas are the "Art Safe Area" rectangles of Apple's creative-assets
// templates (developer.apple.com/go/?id=sketch-creative-assets-templates, read
// 2026-11-09); the universal one is also in the Photoshop universal template.
const VARIANTS = {
  universal: {
    W: 5244, H: 2950, safe: { x: 1921, y: 660, w: 1402, h: 962 },
    // Where the 16:9 universal image is cropped: 21:9 for the header, 3:2 for search results.
    crops: [
      { label: '21:9 product page header', x: 0, y: 351, w: 5244, h: 2247 },
      { label: '3:2 search results', x: 410, y: 0, w: 4425, h: 2950 },
    ],
    layout: {
      en:    { headlineSize: 130, headlineLine: 1.14, textW: 780, eyebrowSize: 58, eyebrowGap: 36 },
      'zh-TW': { headlineSize: 236, headlineLine: 1.22, textW: 780, eyebrowSize: 70, eyebrowGap: 40 },
      catH: 1350, catX: 2740, catY: 700,
      discD: 1450, discX: 2615, discY: 785,
    },
  },
  header: {
    W: 3840, H: 1646, safe: { x: 1097, y: 493, w: 1646, h: 661 },
    crops: [],
    // The deliverable App Store Connect takes for "標題和搜尋結果": written to the folder root as header-universal-<lang>.png
    deliverName: 'header-universal',
    layout: {
      en:    { headlineSize: 132, headlineLine: 1.14, textW: 1080, eyebrowSize: 58, eyebrowGap: 28 },
      'zh-TW': { headlineSize: 198, headlineLine: 1.22, textW: 1080, eyebrowSize: 68, eyebrowGap: 30 },
      catH: 1000, catX: 2250, catY: 510,
      discD: 1080, discX: 2155, discY: 560,
    },
  },
};

// ---------------------------------------------------------------- copy
// One idea per asset (Apple: "state the obvious", short, localized). No price,
// URL, ©, awards. "\n" = forced line break.
const COPY = {
  en: {
    appName: 'MewGuard',
    headline: 'Toxin lookup\n& daily care,\nin one place.',
    headlineFont: '"Playfair Display", Georgia, serif',
    letterSpacing: '-0.01em',
    eyebrowFont: '"DM Sans", -apple-system, sans-serif',
    eyebrowSpacing: '0.18em',
  },
  'zh-TW': {
    appName: '喵兵衛',
    headline: '查毒物\n記照護',
    headlineFont: '"PingFang TC", "Noto Sans TC", "Heiti TC", sans-serif',
    letterSpacing: '0.04em',
    eyebrowFont: '"PingFang TC", "Noto Sans TC", "Heiti TC", sans-serif',
    eyebrowSpacing: '0.22em',
  },
};

// ---------------------------------------------------------------- assets
function catSvg() {
  const file = join(APP, 'assets/cat-avatar/hand-drawn/tabby.svg');
  return readFileSync(file, 'utf8')
    .replace(/\s(width|height)="[^"]*"/g, '')      // size comes from CSS
    .replace(/id="(mask[^"]*)"/g, 'id="asc-$1"')    // namespace the mask id
    .replace(/url\(#(mask[^)]*)\)/g, 'url(#asc-$1)');
}
function fontData(rel) {
  const p = join(APP, 'node_modules/@expo-google-fonts', rel);
  return `data:font/ttf;base64,${readFileSync(p).toString('base64')}`;
}
const FONT_FILES = {
  'playfair-display/600SemiBold/PlayfairDisplay_600SemiBold.ttf': 'PF600',
  'playfair-display/700Bold/PlayfairDisplay_700Bold.ttf': 'PF700',
  'dm-sans/500Medium/DMSans_500Medium.ttf': 'DM500',
};

// ---------------------------------------------------------------- render
function fill(tpl, vars) {
  return tpl.replace(/\{\{(\w+)\}\}/g, (_, k) => {
    if (!(k in vars)) throw new Error(`template token {{${k}}} has no value`);
    return String(vars[k]);
  });
}
function esc(s) { return s.replace(/&/g, '&amp;').replace(/</g, '&lt;'); }

function pngInfo(file) {
  const b = readFileSync(file);
  if (b.toString('latin1', 1, 4) !== 'PNG') throw new Error(`${file}: not a PNG`);
  return { w: b.readUInt32BE(16), h: b.readUInt32BE(20), depth: b[24], colorType: b[25] };
}

function screenshot(html, png, W, H) {
  execFileSync(CHROME, [
    '--headless=new', '--disable-gpu', '--hide-scrollbars', '--force-device-scale-factor=1',
    '--allow-file-access-from-files', `--window-size=${W},${H}`, '--virtual-time-budget=5000',
    `--screenshot=${png}`, `file://${html}`,
  ], { stdio: ['ignore', 'ignore', 'ignore'] });
}

function render({ variant, lang, guides }) {
  const v = VARIANTS[variant], c = COPY[lang], l = v.layout, ll = l[lang];
  let tpl = readFileSync(join(HERE, 'template.html'), 'utf8');
  // Embed the fonts so the page needs nothing from disk at screenshot time.
  for (const [rel, tag] of Object.entries(FONT_FILES)) tpl = tpl.replace(`file://{{app}}/node_modules/@expo-google-fonts/${rel}`, fontData(rel));
  const crops = v.crops.map((r) =>
    `<div class="crop" style="left:${r.x}px;top:${r.y}px;width:${r.w}px;height:${r.h}px"><span>${r.label} · ${r.w}×${r.h}</span></div>`).join('\n    ');
  const html = fill(tpl, {
    lang, variant, app: APP,
    W: v.W, H: v.H, safeX: v.safe.x, safeY: v.safe.y, safeW: v.safe.w, safeH: v.safe.h,
    headlineSize: ll.headlineSize, headlineLine: ll.headlineLine, textW: ll.textW,
    eyebrowSize: ll.eyebrowSize, eyebrowGap: ll.eyebrowGap, appName: esc(c.appName),
    eyebrowFont: c.eyebrowFont, eyebrowSpacing: c.eyebrowSpacing,
    catH: l.catH, catX: l.catX, catY: l.catY, discD: l.discD, discX: l.discX, discY: l.discY,
    headline: esc(c.headline), headlineFont: c.headlineFont, letterSpacing: c.letterSpacing,
    catSvg: catSvg(), crops, bodyClass: guides ? 'show-guides' : '',
  });
  const name = `mewguard-${variant}-${v.W}x${v.H}-${lang}${guides ? '-guides' : ''}`;
  const deliverable = v.deliverName ? join(HERE, `${v.deliverName}-${lang}.png`) : join(OUT, `${name}.png`);
  mkdirSync(BUILD, { recursive: true }); mkdirSync(PREVIEW, { recursive: true });
  const htmlPath = join(BUILD, `${name}.html`);
  writeFileSync(htmlPath, html);
  const full = guides ? join(BUILD, `${name}.png`) : deliverable;
  screenshot(htmlPath, full, v.W, v.H);

  const info = pngInfo(full);
  if (info.w !== v.W || info.h !== v.H) throw new Error(`${name}: got ${info.w}×${info.h}, want ${v.W}×${v.H}`);
  if (info.colorType !== 2) throw new Error(`${name}: PNG color type ${info.colorType}; Apple requires no alpha (want 2 = RGB)`);

  if (guides) {
    // 25 % preview for review / README (sips ships with macOS).
    const small = join(PREVIEW, `${name}.png`);
    execFileSync('sips', ['-Z', String(Math.round(v.W / 4)), full, '--out', small], { stdio: 'ignore' });
    return small;
  }
  return full;
}

// ---------------------------------------------------------------- main
if (!existsSync(CHROME)) { console.error(`Chrome not found at ${CHROME} (set CHROME=…)`); process.exit(1); }
const variants = ONLY ? [ONLY] : Object.keys(VARIANTS);
const langs = LANG ? [LANG] : Object.keys(COPY);
for (const variant of variants) for (const lang of langs) {
  if (!GUIDES_ONLY) {
    const f = render({ variant, lang, guides: false });
    const kb = (statSync(f).size / 1024).toFixed(0);
    console.log(`✓ ${f.replace(HERE + '/', '')}  ${VARIANTS[variant].W}×${VARIANTS[variant].H} RGB  ${kb} KB`);
  }
  const p = render({ variant, lang, guides: true });
  console.log(`  preview ${p.replace(HERE + '/', '')}`);
}
