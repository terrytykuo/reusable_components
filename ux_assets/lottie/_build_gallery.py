#!/usr/bin/env python3
"""Generate lottie/gallery.html — a self-contained, in-browser preview of the
MewGuard Lottie kit. Reads every mw-*.json in this folder, inlines each one as
`animationData` (so the page works straight from file:// with no fetch/CORS),
and renders them with lottie-web. Re-run after editing any Lottie file:

    python3 lottie/_build_gallery.py

Only the lottie-web *player* is loaded from a CDN (with an offline notice); the
animation data itself is embedded, matching the dependency-light ethos of the
sibling SVG galleries.
"""
import glob
import json
import os

HERE = os.path.dirname(os.path.abspath(__file__))

# stage / motion / payoff mirror the INDEX.md Lottie table so the gallery and
# the docs never drift. keyed by filename.
META = {
    "mw-heartbeat.json": dict(
        title="Steady heartbeat", stage="Verdict · Toxic / Emergency",
        motion="Double-thump heart pulse",
        payoff="Steady coral heartbeat holds a worried owner's nerve — urgent, not panic."),
    "mw-safe-check.json": dict(
        title="All clear", stage="Verdict · Safe",
        motion="Ring fills, check draws in",
        payoff="Green ring + self-drawing check delivers instant relief on a safe verdict."),
    "mw-paw-loading.json": dict(
        title="Checking the database", stage="Search",
        motion="Paw-pad dots pulse in sequence",
        payoff="Branded loader reframes toxin-database latency as active care."),
    "mw-heart-pop.json": dict(
        title="Saved to My Cats", stage="Delight",
        motion="Heart scales in + sparkle burst",
        payoff="Rewards saving a substance to a cat's profile."),
    "mw-purr-cat.json": dict(
        title="Resting easy", stage="Delight · Ambient",
        motion="Mascot breathes + blinks",
        payoff="Resting cat is visual proof that all is well."),
    "mw-bell-recall.json": dict(
        title="Recall watch", stage="Emergency · Alert",
        motion="Bell rings then settles",
        payoff="Flags a product recall as important, not catastrophic."),
    "mw-water-ripple.json": dict(
        title="Stay hydrated", stage="Care · Reminder",
        motion="Ripples spread across a bowl",
        payoff="Makes a hydration nudge caring rather than naggy."),
    "mw-star-rating.json": dict(
        title="Rate your peace of mind", stage="Delight · Feedback",
        motion="Five stars pop in one by one",
        payoff="Invites warm feedback framed as peace of mind."),
    "mw-wave-hello.json": dict(
        title="Meet your guardian", stage="Onboarding · Welcome",
        motion="Mascot waves, head bobs",
        payoff="Builds trust and warmth before a worried owner's first search."),
    "mw-recovery-arc.json": dict(
        title="Feeling better, day by day", stage="Recovery · Tracking",
        motion="Climbing line draws up, dots rise",
        payoff="Turns symptom logging into a hopeful recovery ritual, not a clinical chart."),
    "mw-meds-reminder.json": dict(
        title="Time for meds", stage="Care · Reminder",
        motion="Capsule pulses inside a breathing halo",
        payoff="Nudges on-time dosing without alarm."),
    "mw-call-vet.json": dict(
        title="Call your vet now", stage="Emergency · Action",
        motion="Warm handset pulses, sound waves ring",
        payoff="Makes the one critical action unmissable without a red alarm."),
    "mw-scan-label.json": dict(
        title="Scan the label", stage="Search · Action",
        motion="Scan beam sweeps down a label card",
        payoff="Invites the faster scan input when a worried hand can't type."),
    "mw-meal-bowl.json": dict(
        title="Mealtime logged", stage="Care · Feedback",
        motion="Kibble drops into a bowl, heart pops",
        payoff="Rewards logging a feeding in the care tracker."),
    "mw-name-tag.json": dict(
        title="Name your cat", stage="Onboarding · Empty profile",
        motion="Heart-engraved collar tag swings on its ring",
        payoff="Invites a worried owner to name and claim their cat's profile."),
    "mw-chase-toy.json": dict(
        title="Back to chasing toys", stage="Recovery · Milestone",
        motion="Yarn ball bounces and spins",
        payoff="Celebrates the milestone of a recovered cat back to play."),
    "mw-dose-scale.json": dict(
        title="How much matters", stage="Verdict · Nuance",
        motion="Balance scale tips, then settles",
        payoff="Frames toxicity as dose-dependent, easing panic over a tiny nibble."),
    "mw-vet-rosette.json": dict(
        title="Reviewed by vets", stage="Verdict · Trust",
        motion="Rosette pops in, check draws",
        payoff="Anchors trust in the verdict at the moment certainty matters most."),
    "mw-vet-calendar.json": dict(
        title="Vet day booked", stage="Care · Confirmation",
        motion="A check stamps onto a calendar date",
        payoff="Closes the loop on care planning when a vet visit is booked."),
    "mw-clock-history.json": dict(
        title="Picking up where you left off", stage="Search · History",
        motion="Clock hands sweep backward, rewinding",
        payoff="Lets a worried owner resume a frantic search without retyping."),
}

# preserve the MewGuard journey order rather than alphabetical
ORDER = [
    "mw-wave-hello.json",
    "mw-name-tag.json",
    "mw-paw-loading.json",
    "mw-scan-label.json",
    "mw-clock-history.json",
    "mw-safe-check.json",
    "mw-dose-scale.json",
    "mw-heartbeat.json",
    "mw-vet-rosette.json",
    "mw-meal-bowl.json",
    "mw-water-ripple.json",
    "mw-meds-reminder.json",
    "mw-vet-calendar.json",
    "mw-recovery-arc.json",
    "mw-chase-toy.json",
    "mw-bell-recall.json",
    "mw-call-vet.json",
    "mw-heart-pop.json",
    "mw-star-rating.json",
    "mw-purr-cat.json",
]


def main():
    files = sorted(glob.glob(os.path.join(HERE, "mw-*.json")))
    by_name = {os.path.basename(f): f for f in files}
    ordered = [n for n in ORDER if n in by_name] + [
        n for n in sorted(by_name) if n not in ORDER]

    animations = {}
    cards = []
    for name in ordered:
        with open(by_name[name]) as fh:
            data = json.load(fh)
        animations[name] = data
        m = META.get(name, dict(title=name, stage="", motion="", payoff=""))
        kw = data.get("meta", {}).get("k", "")
        cards.append(f"""      <article class="card" data-file="{name}">
        <header class="card-h">
          <h2>{m['title']}</h2>
          <span class="stage">{m['stage']}</span>
        </header>
        <div class="stage-box"><div class="player" data-file="{name}"></div></div>
        <p class="motion"><b>Motion:</b> {m['motion']}</p>
        <p class="payoff">{m['payoff']}</p>
        <footer class="card-f">
          <code class="fname">{name}</code>
          <div class="btns">
            <button class="mini" data-act="replay" data-file="{name}">Replay</button>
          </div>
        </footer>
        <div class="tags"><span class="tag">mewguard</span>{''.join(
            f'<span class="tag dim">{t.strip()}</span>' for t in kw.split(',')[1:])}</div>
      </article>""")

    data_js = json.dumps(animations, separators=(",", ":"))
    html = TEMPLATE.replace("/*__CARDS__*/", "\n".join(cards)).replace(
        "/*__DATA__*/", data_js).replace("__COUNT__", str(len(ordered)))
    out = os.path.join(HERE, "gallery.html")
    with open(out, "w") as fh:
        fh.write(html)
    print(f"wrote {out} with {len(ordered)} animations")


TEMPLATE = r"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>MewGuard — Lottie kit preview</title>
<script src="https://cdnjs.cloudflare.com/ajax/libs/bodymovin/5.12.2/lottie.min.js"></script>
<style>
  :root{
    --bg:#F1ECE3; --surface:#EFE8DB; --card:#FBF8F2;
    --ink:#2C1810; --ink2:#7A5C4A; --muted:#B8967A;
    --green:#1b9150; --green-d:#146b3c; --coral:#E76953; --gold:#E8A33D;
    --line:#E2D7C5;
  }
  *{box-sizing:border-box}
  body{margin:0;font:15px/1.5 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;
    color:var(--ink);background:var(--bg)}
  header.top{padding:30px 28px 18px;max-width:1180px;margin:0 auto}
  header.top h1{margin:0 0 6px;font-size:26px;letter-spacing:-.02em}
  header.top p{margin:0;color:var(--ink2);max-width:62ch}
  .pill{display:inline-block;background:var(--green);color:#fff;border-radius:999px;
    padding:2px 11px;font-size:12px;font-weight:600;vertical-align:middle;margin-left:8px}
  .toolbar{position:sticky;top:0;z-index:5;background:rgba(241,236,227,.92);
    backdrop-filter:blur(6px);border-bottom:1px solid var(--line);
    padding:12px 28px;display:flex;gap:10px;flex-wrap:wrap;align-items:center}
  .toolbar .grp{display:flex;gap:8px;align-items:center;flex-wrap:wrap}
  button{font:inherit;cursor:pointer;border:1px solid var(--line);background:var(--card);
    color:var(--ink);border-radius:9px;padding:7px 13px;transition:.15s}
  button:hover{border-color:var(--green);color:var(--green-d)}
  button.on{background:var(--green);color:#fff;border-color:var(--green)}
  .toolbar label{color:var(--ink2);font-size:13px}
  .toolbar select,.toolbar input[type=range]{vertical-align:middle}
  main{max-width:1180px;margin:0 auto;padding:22px 28px 60px;
    display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:20px}
  .card{background:var(--card);border:1px solid var(--line);border-radius:16px;
    padding:16px;display:flex;flex-direction:column;gap:8px;
    box-shadow:0 1px 2px rgba(44,24,16,.04)}
  .card-h{display:flex;justify-content:space-between;align-items:baseline;gap:8px}
  .card-h h2{font-size:16px;margin:0;letter-spacing:-.01em}
  .stage{font-size:11px;color:var(--green-d);background:#e6f3ec;border-radius:6px;
    padding:2px 7px;white-space:nowrap}
  .stage-box{border-radius:12px;background:var(--surface);display:flex;
    align-items:center;justify-content:center;transition:.2s}
  .player{width:200px;height:200px}
  .motion{margin:2px 0 0;font-size:13px;color:var(--ink2)}
  .motion b{color:var(--ink)}
  .payoff{margin:0;font-size:13px;color:var(--ink2)}
  .card-f{display:flex;justify-content:space-between;align-items:center;
    border-top:1px dashed var(--line);padding-top:9px;margin-top:auto;gap:8px}
  .fname{font-size:11px;color:var(--muted);font-family:ui-monospace,Menlo,monospace}
  .mini{padding:4px 10px;font-size:12px}
  .tags{display:flex;gap:5px;flex-wrap:wrap}
  .tag{font-size:10px;font-weight:600;color:#fff;background:var(--coral);
    border-radius:5px;padding:1px 7px}
  .tag.dim{background:transparent;color:var(--muted);border:1px solid var(--line);font-weight:500}
  /* dark stage */
  body.dark .stage-box{background:#241a14}
  .note{max-width:1180px;margin:0 auto;padding:0 28px 24px;color:var(--muted);font-size:12px}
  .note code{font-family:ui-monospace,Menlo,monospace}
</style>
</head>
<body>
  <header class="top">
    <h1>MewGuard — Lottie kit <span class="pill">__COUNT__ files · mewguard</span></h1>
    <p>In-browser preview of the genuine Lottie JSON animations in this folder. Each one is
    inlined below (works straight from <code>file://</code>); they drop into
    <code>lottie-react-native</code> or any web Lottie player unchanged. Non-functional,
    sentimental-design only.</p>
  </header>
  <div class="toolbar">
    <div class="grp">
      <button id="playToggle" class="on">⏸ Pause all</button>
      <button id="replayAll">↺ Replay all</button>
      <button id="darkToggle">🌙 Dark stage</button>
    </div>
    <div class="grp">
      <label for="speed">Speed</label>
      <input id="speed" type="range" min="0.25" max="2" step="0.25" value="1">
      <span id="speedVal">1×</span>
    </div>
  </div>
  <main id="grid">
/*__CARDS__*/
  </main>
  <p class="note">Player: <code>lottie-web 5.12.2</code> via CDN (needs a network connection the
  first time). Animation data is embedded in this file. Regenerate with
  <code>python3 lottie/_build_gallery.py</code>.</p>

<script>
const DATA = /*__DATA__*/;
const anims = {};
function build(){
  document.querySelectorAll('.player').forEach(el=>{
    const file = el.getAttribute('data-file');
    if(!DATA[file]) return;
    anims[file] = lottie.loadAnimation({
      container: el, renderer:'svg', loop:true, autoplay:true,
      animationData: JSON.parse(JSON.stringify(DATA[file]))
    });
  });
}
function eachAnim(fn){ Object.values(anims).forEach(fn); }

document.addEventListener('click', e=>{
  const b = e.target.closest('button'); if(!b) return;
  if(b.id==='playToggle'){
    const playing = b.classList.toggle('on');
    b.textContent = playing ? '⏸ Pause all' : '▶ Play all';
    eachAnim(a=> playing ? a.play() : a.pause());
  } else if(b.id==='replayAll'){
    eachAnim(a=>{ a.goToAndPlay(0,true); });
    const pt=document.getElementById('playToggle'); pt.classList.add('on'); pt.textContent='⏸ Pause all';
  } else if(b.id==='darkToggle'){
    document.body.classList.toggle('dark'); b.classList.toggle('on');
  } else if(b.dataset.act==='replay'){
    const a=anims[b.dataset.file]; if(a){ a.goToAndPlay(0,true); }
  }
});

const speed=document.getElementById('speed'), sv=document.getElementById('speedVal');
speed.addEventListener('input',()=>{ sv.textContent=speed.value+'×'; eachAnim(a=>a.setSpeed(parseFloat(speed.value))); });

build();
</script>
</body>
</html>
"""

if __name__ == "__main__":
    main()
