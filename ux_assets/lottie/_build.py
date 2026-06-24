#!/usr/bin/env python3
"""
MewGuard sentimental-design Lottie generator.

Builds genuine, schema-valid Lottie JSON animations with the python-lottie object
model (so output is guaranteed valid), using the cat_toxin_app palette and carrying
the `mewguard` brand tag in each file's metadata.keywords. Non-functional UX assets:
their only job is emotional/sentimental design across the MewGuard journey stages.

Run:  python3 lottie/_build.py
Outputs one <name>.json per asset next to this script.
"""
import os
from lottie import Color, Point
from lottie.objects import Animation, ShapeLayer
from lottie.objects.shapes import (
    Ellipse, Fill, Stroke, Group, Star, StarType, Path, Trim, Rect,
)
from lottie.objects.bezier import Bezier
from lottie.objects.helpers import Transform  # noqa: F401  (kept for reference)
from lottie.objects import easing
from lottie.objects.animation import Metadata
from lottie.exporters.core import export_lottie

OUT = os.path.dirname(os.path.abspath(__file__))

# --- MewGuard palette (cat_toxin_app/constants/colors.ts) ---
CREAM   = "#F1ECE3"
SURFACE = "#EFE8DB"
GREEN   = "#1b9150"
GREEN_L = "#3aaa6d"
CORAL   = "#E76953"
SAFE    = "#22C55E"
CAUTION = "#F59E0B"
TOXIC   = "#EF4444"
GOLD    = "#816e0c"
INK     = "#2C1810"
WATER   = "#5B8A7A"
WHITE   = "#FFFFFF"


def col(hexstr):
    h = hexstr.lstrip("#")
    return Color(int(h[0:2], 16) / 255, int(h[2:4], 16) / 255, int(h[4:6], 16) / 255)


def new_anim(name, keywords_stage, description, op=60, fr=30, size=240, theme=GREEN):
    a = Animation(op, fr)
    a.width = a.height = size
    a.name = name
    m = Metadata()
    m.author = "MewGuard"
    m.generator = "mewguard ux_assets / python-lottie"
    m.keywords = "mewguard, sentimental, " + keywords_stage
    m.description = description
    m.theme_color = theme
    a.metadata = m
    return a


def shape_layer(anim, cx=120, cy=120):
    l = ShapeLayer()
    l.transform.position.value = Point(cx, cy)
    anim.add_layer(l)
    return l


def add_bg(anim, d=150):
    """Cream backdrop disc, added LAST so it sits at the back (in Lottie the first
    layer/shape paints on top), and on its own steady layer so it never inherits a
    foreground layer's pulse/scale."""
    l = ShapeLayer()
    l.transform.position.value = Point(anim.width / 2, anim.height / 2)
    l.add_shape(ellipse(0, 0, d, d, CREAM))
    anim.add_layer(l)
    return l


def ellipse(cx, cy, w, h, fill_hex, opacity=100):
    g = Group()
    e = Ellipse()
    e.position.value = Point(cx, cy)
    e.size.value = Point(w, h)
    g.add_shape(e)
    f = Fill(col(fill_hex))
    f.opacity.value = opacity
    g.add_shape(f)
    return g


def rounded_rect(cx, cy, w, h, fill_hex, radius):
    g = Group()
    r = Rect()
    r.position.value = Point(cx, cy)
    r.size.value = Point(w, h)
    r.rounded.value = radius
    g.add_shape(r)
    g.add_shape(Fill(col(fill_hex)))
    return g


def stroke_circle(cx, cy, w, h, stroke_hex, width):
    g = Group()
    e = Ellipse()
    e.position.value = Point(cx, cy)
    e.size.value = Point(w, h)
    g.add_shape(e)
    s = Stroke(col(stroke_hex), width)
    s.line_cap = 2  # round
    g.add_shape(s)
    return g


def heart_bezier(scale=1.0):
    """A closed heart path centered roughly at origin, ~80*scale wide."""
    s = scale
    b = Bezier()
    b.closed = True
    # top dip
    b.add_point(Point(0, -16 * s), Point(0, 0), Point(0, 0))
    # right lobe top -> right side
    b.add_point(Point(34 * s, -40 * s), Point(-18 * s, -16 * s), Point(20 * s, 18 * s))
    b.add_point(Point(40 * s, 2 * s), Point(4 * s, -14 * s), Point(-6 * s, 20 * s))
    # bottom tip
    b.add_point(Point(0, 44 * s), Point(26 * s, 6 * s), Point(-26 * s, 6 * s))
    # left side -> left lobe top
    b.add_point(Point(-40 * s, 2 * s), Point(6 * s, 20 * s), Point(-4 * s, -14 * s))
    b.add_point(Point(-34 * s, -40 * s), Point(-20 * s, 18 * s), Point(18 * s, -16 * s))
    return b


def heart_group(fill_hex, scale=1.0):
    g = Group()
    p = Path()
    p.shape.value = heart_bezier(scale)
    g.add_shape(p)
    g.add_shape(Fill(col(fill_hex)))
    return g


EASE_OUT = easing.EaseOut()
EASE_IN = easing.EaseIn()
EASE_IO = easing.Sigmoid()


# ----------------------------------------------------------------------------
# 1. Heartbeat — pulsing coral heart (verdict·toxic / emergency / saved)
# ----------------------------------------------------------------------------
def build_heartbeat():
    a = new_anim(
        "MewGuard — Heartbeat",
        "verdict, emergency, reassurance",
        "A steady coral heartbeat: keeps a worried owner's nerve during a serious "
        "verdict or an emergency — urgent, not panic-inducing.",
        op=45, theme=CORAL,
    )
    l = shape_layer(a)
    l.add_shape(heart_group(CORAL, 1.0))
    sc = l.transform.scale
    # double-thump heartbeat
    sc.add_keyframe(0, Point(86, 86), EASE_OUT)
    sc.add_keyframe(6, Point(108, 108), EASE_IN)
    sc.add_keyframe(12, Point(92, 92), EASE_OUT)
    sc.add_keyframe(18, Point(104, 104), EASE_IN)
    sc.add_keyframe(26, Point(86, 86), EASE_IO)
    sc.add_keyframe(45, Point(86, 86))
    add_bg(a)
    return a


# ----------------------------------------------------------------------------
# 2. Safe check — green shield ring + drawn-on check (verdict·safe)
# ----------------------------------------------------------------------------
def build_safe_check():
    a = new_anim(
        "MewGuard — All clear",
        "verdict, safe, result",
        "A green ring fills and a check draws itself in: instant relief for a safe "
        "verdict.",
        op=50, theme=SAFE,
    )
    l = shape_layer(a)
    # ring drawn-on via Trim
    ring = stroke_circle(0, 0, 130, 130, SAFE, 10)
    tr = Trim()
    tr.start.value = 0
    tr.end.add_keyframe(0, 0, EASE_OUT)
    tr.end.add_keyframe(20, 100, EASE_IN)
    tr.offset.value = 90
    ring.add_shape(tr)
    l.add_shape(ring)
    # check mark path, drawn after ring
    g = Group()
    p = Path()
    b = Bezier()
    b.add_point(Point(-30, 4))
    b.add_point(Point(-8, 26))
    b.add_point(Point(34, -22))
    p.shape.value = b
    g.add_shape(p)
    st = Stroke(col(GREEN), 11)
    st.line_cap = 2
    st.line_join = 2
    g.add_shape(st)
    tr2 = Trim()
    tr2.start.value = 0
    tr2.end.add_keyframe(18, 0, EASE_OUT)
    tr2.end.add_keyframe(34, 100, EASE_IN)
    g.add_shape(tr2)
    l.add_shape(g)
    add_bg(a)
    return a


# ----------------------------------------------------------------------------
# 3. Paw loading — three dots forming a paw, pulsing in sequence (search)
# ----------------------------------------------------------------------------
def build_paw_loading():
    a = new_anim(
        "MewGuard — Checking the database",
        "search, loading, spinner",
        "Paw-pad dots pulse in sequence while MewGuard checks the toxin database — "
        "reframes lookup latency as active care.",
        op=45, theme=GREEN,
    )
    toes = [(-30, -18), (-10, -34), (12, -34), (32, -16)]
    for i, (tx, ty) in enumerate(toes):
        l = shape_layer(a, 120 + tx, 120 + ty)
        l.add_shape(ellipse(0, 0, 24, 26, GREEN_L))
        op = l.transform.opacity
        phase = i * 4
        op.add_keyframe(phase, 40, EASE_OUT)
        op.add_keyframe(phase + 8, 100, EASE_IN)
        op.add_keyframe(phase + 16, 40, EASE_IO)
        op.add_keyframe(45, 40)
    # palm pad (steady), behind the pulsing toes
    palm = shape_layer(a)
    palm.add_shape(ellipse(0, 18, 46, 40, GREEN))
    add_bg(a)
    return a


# ----------------------------------------------------------------------------
# 4. Heart pop — heart scales in with a sparkle burst (delight·feedback)
# ----------------------------------------------------------------------------
def build_heart_pop():
    a = new_anim(
        "MewGuard — Saved to My Cats",
        "delight, feedback, success",
        "A heart pops in with a sparkle burst — rewards saving a substance to a cat's "
        "profile.",
        op=45, theme=CORAL,
    )
    l = shape_layer(a)
    heart = heart_group(CORAL, 0.95)
    l.add_shape(heart)
    sc = l.transform.scale
    sc.add_keyframe(0, Point(0, 0), EASE_OUT)
    sc.add_keyframe(12, Point(116, 116), EASE_IN)
    sc.add_keyframe(20, Point(100, 100), EASE_IO)
    sc.add_keyframe(45, Point(100, 100))
    # sparkles
    for i, (sx, sy) in enumerate([(-52, -36), (50, -30), (44, 40), (-46, 44)]):
        sg = shape_layer(a, 120 + sx, 120 + sy)
        star = Star()
        star.star_type = StarType.Star
        star.points.value = 4
        star.outer_radius.value = 11
        star.inner_radius.value = 4
        star.rotation.value = 0
        star.position.value = Point(0, 0)
        grp = Group()
        grp.add_shape(star)
        grp.add_shape(Fill(col(GOLD)))
        sg.add_shape(grp)
        s2 = sg.transform.scale
        d = 10 + i * 2
        s2.add_keyframe(d, Point(0, 0), EASE_OUT)
        s2.add_keyframe(d + 8, Point(130, 130), EASE_IN)
        s2.add_keyframe(d + 18, Point(0, 0), EASE_IO)
        s2.add_keyframe(45, Point(0, 0))
    add_bg(a)
    return a


# ----------------------------------------------------------------------------
# 5. Purr — sleeping/breathing cat face, gentle scale + blink (delight·ambient)
# ----------------------------------------------------------------------------
def build_purr():
    a = new_anim(
        "MewGuard — Resting easy",
        "delight, ambient, mascot",
        "The MewGuard mascot breathes softly and blinks — visual proof that all is "
        "well.",
        op=72, theme=GREEN,
    )
    # eyes layer first → paints on top of the head; blinks independently
    eyes = shape_layer(a)
    for ex in (-26, 26):
        eyes.add_shape(ellipse(ex, -2, 18, 18, CREAM))
    eyeb = eyes.transform.scale
    # blink: squash the eyes flat briefly mid-loop
    eyeb.add_keyframe(0, Point(100, 100))
    eyeb.add_keyframe(28, Point(100, 100), EASE_OUT)
    eyeb.add_keyframe(31, Point(100, 12), EASE_IN)
    eyeb.add_keyframe(34, Point(100, 100), EASE_OUT)
    eyeb.add_keyframe(72, Point(100, 100))
    # head layer (ears + face + nose), breathing scale; sits below the eyes
    l = shape_layer(a)
    for ex in (-44, 44):
        g = Group()
        p = Path()
        b = Bezier()
        b.closed = True
        b.add_point(Point(ex, -54))
        b.add_point(Point(ex + (16 if ex < 0 else -16), -18))
        b.add_point(Point(ex + (40 if ex < 0 else -40), -26))
        p.shape.value = b
        g.add_shape(p)
        g.add_shape(Fill(col(GREEN)))
        l.add_shape(g)
    l.add_shape(ellipse(0, 18, 14, 10, CORAL))  # nose
    l.add_shape(ellipse(0, 6, 120, 110, GREEN))  # face (added last → back of this layer)
    sc = l.transform.scale
    sc.add_keyframe(0, Point(98, 98), EASE_IO)
    sc.add_keyframe(36, Point(103, 103), EASE_IO)
    sc.add_keyframe(72, Point(98, 98))
    add_bg(a, 160)
    return a


# ----------------------------------------------------------------------------
# 6. Bell — recall watch, gentle ring wobble (emergency·alert)
# ----------------------------------------------------------------------------
def build_bell():
    a = new_anim(
        "MewGuard — Recall watch",
        "emergency, alert, recall",
        "A friendly bell rings then settles — flags a product recall as important, "
        "not catastrophic.",
        op=50, theme=CAUTION,
    )
    bell = shape_layer(a, 120, 104)
    # bell body
    g = Group()
    p = Path()
    b = Bezier()
    b.closed = True
    b.add_point(Point(0, -44), Point(-14, 0), Point(14, 0))
    b.add_point(Point(34, 30), Point(-6, -28), Point(8, 8))
    b.add_point(Point(44, 42), Point(-4, -4), Point(0, 0))
    b.add_point(Point(-44, 42), Point(0, 0), Point(0, 0))
    b.add_point(Point(-34, 30), Point(-8, 8), Point(6, -28))
    p.shape.value = b
    g.add_shape(p)
    g.add_shape(Fill(col(CAUTION)))
    bell.add_shape(g)
    # rotate-wobble about the bell's crown: anchor at the top, reposition to match
    bell.transform.anchor_point.value = Point(0, -44)
    bell.transform.position.value = Point(120, 104 - 44)
    rot = bell.transform.rotation
    rot.add_keyframe(0, 0, EASE_OUT)
    rot.add_keyframe(8, 16, EASE_IO)
    rot.add_keyframe(18, -14, EASE_IO)
    rot.add_keyframe(28, 9, EASE_IO)
    rot.add_keyframe(38, -5, EASE_IO)
    rot.add_keyframe(50, 0)
    # clapper
    clap = shape_layer(a, 120, 158)
    clap.add_shape(ellipse(0, 0, 18, 18, GOLD))
    add_bg(a)
    return a


# ----------------------------------------------------------------------------
# 7. Water ripple — hydration bowl with expanding rings (care·reminder)
# ----------------------------------------------------------------------------
def build_water_ripple():
    a = new_anim(
        "MewGuard — Stay hydrated",
        "care, reminder, hydration",
        "Ripples spread across a water bowl — makes a hydration nudge caring rather "
        "than naggy.",
        op=60, theme=WATER,
    )
    # expanding ripple rings first → paint on top of the water surface
    for i in range(3):
        r = shape_layer(a, 120, 132)
        r.add_shape(stroke_circle(0, 0, 30, 12, WHITE, 4))
        sc = r.transform.scale
        op = r.transform.opacity
        d = i * 20
        sc.add_keyframe(d, Point(20, 20), EASE_OUT)
        sc.add_keyframe(d + 40, Point(150, 150), EASE_IN)
        op.add_keyframe(d, 90, EASE_OUT)
        op.add_keyframe(d + 40, 0, EASE_IN)
    # bowl + water surface, below the ripples. Within a layer the FIRST shape paints
    # on top, so the water surface goes first and the bowl rim behind it.
    bowl = shape_layer(a)
    bowl.add_shape(ellipse(0, 18, 120, 44, WATER))
    bowl.add_shape(ellipse(0, 28, 150, 60, GREEN))
    add_bg(a)
    return a


# ----------------------------------------------------------------------------
# 8. Star rating — five stars pop in sequence (delight·feedback)
# ----------------------------------------------------------------------------
def build_star_rating():
    a = new_anim(
        "MewGuard — Rate your peace of mind",
        "delight, feedback, rating",
        "Five stars pop in one by one — invites warm feedback framed as peace of mind "
        "at a calm emotional high point.",
        op=55, theme=GOLD,
    )
    xs = [-72, -36, 0, 36, 72]
    for i, x in enumerate(xs):
        sg = shape_layer(a, 120 + x, 120)
        star = Star()
        star.star_type = StarType.Star
        star.points.value = 5
        star.outer_radius.value = 18
        star.inner_radius.value = 8
        star.rotation.value = 0
        star.position.value = Point(0, 0)
        grp = Group()
        grp.add_shape(star)
        grp.add_shape(Fill(col(GOLD)))
        sg.add_shape(grp)
        sc = sg.transform.scale
        d = i * 7
        sc.add_keyframe(d, Point(0, 0), EASE_OUT)
        sc.add_keyframe(d + 6, Point(128, 128), EASE_IN)
        sc.add_keyframe(d + 12, Point(100, 100), EASE_IO)
        sc.add_keyframe(55, Point(100, 100))
    add_bg(a)
    return a


# ----------------------------------------------------------------------------
# 9. Wave hello — mascot waves at first launch (onboarding·welcome)
# ----------------------------------------------------------------------------
def build_wave_hello():
    a = new_anim(
        "MewGuard — Meet your guardian",
        "onboarding, welcome, mascot",
        "The MewGuard mascot waves hello at first launch — builds trust and warmth "
        "before a worried owner's first search.",
        op=60, theme=GREEN,
    )
    # waving paw — drawn first so it sits on top; anchored at the wrist so the
    # whole paw rotates about a fixed pivot beside the head.
    paw = shape_layer(a)
    paw.add_shape(ellipse(0, 0, 30, 34, GREEN_L))   # paw pad
    paw.transform.anchor_point.value = Point(0, 34)  # wrist below the pad
    paw.transform.position.value = Point(120 + 72, 120 - 6 + 34)
    rot = paw.transform.rotation
    rot.add_keyframe(0, -20, EASE_IO)
    rot.add_keyframe(12, 18, EASE_IO)
    rot.add_keyframe(24, -20, EASE_IO)
    rot.add_keyframe(36, 18, EASE_IO)
    rot.add_keyframe(48, -20, EASE_IO)
    rot.add_keyframe(60, -20)
    # eyes layer on top of the head
    eyes = shape_layer(a)
    for ex in (-24, 24):
        eyes.add_shape(ellipse(ex, -4, 16, 18, CREAM))
    # head: ears + nose + face, with a gentle welcoming bob
    head = shape_layer(a)
    for ex in (-42, 42):
        g = Group()
        p = Path()
        b = Bezier()
        b.closed = True
        b.add_point(Point(ex, -52))
        b.add_point(Point(ex + (16 if ex < 0 else -16), -16))
        b.add_point(Point(ex + (40 if ex < 0 else -40), -24))
        p.shape.value = b
        g.add_shape(p)
        g.add_shape(Fill(col(GREEN)))
        head.add_shape(g)
    head.add_shape(ellipse(0, 16, 14, 10, CORAL))   # nose
    head.add_shape(ellipse(0, 4, 120, 110, GREEN))  # face (added last → behind)
    sc = head.transform.scale
    sc.add_keyframe(0, Point(99, 99), EASE_IO)
    sc.add_keyframe(30, Point(102, 102), EASE_IO)
    sc.add_keyframe(60, Point(99, 99))
    add_bg(a, 170)
    return a


# ----------------------------------------------------------------------------
# 10. Recovery arc — a climbing line draws upward with rising dots (recovery)
# ----------------------------------------------------------------------------
def build_recovery_arc():
    a = new_anim(
        "MewGuard — Feeling better, day by day",
        "recovery, tracking, hopeful",
        "A climbing line draws upward with dots rising one by one — turns symptom "
        "logging into a hopeful recovery ritual, not a clinical chart.",
        op=60, theme=SAFE,
    )
    pts = [(-72, 40), (-36, 22), (0, 2), (36, -22), (72, -44)]
    # dots that pop in along the line, drawn first → on top of the stroke
    for i, (x, y) in enumerate(pts):
        d = shape_layer(a, 120 + x, 120 + y)
        d.add_shape(ellipse(0, 0, 16, 16, GREEN if i < 4 else GOLD))
        sc = d.transform.scale
        t = 14 + i * 7
        sc.add_keyframe(t, Point(0, 0), EASE_OUT)
        sc.add_keyframe(t + 6, Point(125, 125), EASE_IN)
        sc.add_keyframe(t + 12, Point(100, 100), EASE_IO)
        sc.add_keyframe(60, Point(100, 100))
    # the climbing line itself, drawn-on via Trim, sitting below the dots
    line = shape_layer(a)
    g = Group()
    p = Path()
    b = Bezier()
    for (x, y) in pts:
        b.add_point(Point(x, y))
    p.shape.value = b
    g.add_shape(p)
    st = Stroke(col(GREEN_L), 8)
    st.line_cap = 2
    st.line_join = 2
    g.add_shape(st)
    tr = Trim()
    tr.start.value = 0
    tr.end.add_keyframe(4, 0, EASE_OUT)
    tr.end.add_keyframe(44, 100, EASE_IN)
    g.add_shape(tr)
    line.add_shape(g)
    add_bg(a)
    return a


# ----------------------------------------------------------------------------
# 11. Meds reminder — capsule pill pulses inside a soft reminder halo (care·reminder)
# ----------------------------------------------------------------------------
def build_meds_reminder():
    a = new_anim(
        "MewGuard — Time for meds",
        "care, reminder, medication",
        "A two-tone capsule pulses softly inside a breathing halo — nudges on-time "
        "dosing without alarm.",
        op=60, theme=GREEN,
    )
    # capsule, drawn first → on top. Cream divider band added before the green body
    # so it paints over it, reading as a two-part pill. The whole layer tilts -32deg.
    pill = shape_layer(a)
    pill.add_shape(rounded_rect(0, 0, 13, 46, CREAM, 6))     # divider (on top)
    pill.add_shape(rounded_rect(0, 0, 132, 46, GREEN, 23))   # capsule body
    pill.transform.rotation.value = -32
    sc = pill.transform.scale
    sc.add_keyframe(0, Point(97, 97), EASE_IO)
    sc.add_keyframe(18, Point(106, 106), EASE_IO)
    sc.add_keyframe(36, Point(97, 97), EASE_IO)
    sc.add_keyframe(60, Point(97, 97))
    # soft reminder halo behind the pill: a green ring breathing in opacity
    halo = shape_layer(a)
    halo.add_shape(stroke_circle(0, 0, 168, 168, GREEN_L, 6))
    op = halo.transform.opacity
    op.add_keyframe(0, 0, EASE_OUT)
    op.add_keyframe(18, 42, EASE_IN)
    op.add_keyframe(40, 0, EASE_IO)
    op.add_keyframe(60, 0)
    add_bg(a, 160)
    return a


# ----------------------------------------------------------------------------
# 12. Call vet — warm pulsing handset with ringing sound waves (emergency·action)
# ----------------------------------------------------------------------------
def build_call_vet():
    a = new_anim(
        "MewGuard — Call your vet now",
        "emergency, action, call",
        "A warm coral handset pulses while sound waves ring out — makes the one "
        "critical action unmissable without a red alarm.",
        op=50, theme=CORAL,
    )
    # handset (smile-arc receiver with two bulb ends), tilted like an answered call
    # and pulsing to read as urgent-but-warm. Drawn first → on top.
    hs = shape_layer(a, 120, 128)
    arc = Group()
    p = Path()
    b = Bezier()
    b.add_point(Point(-44, 6), Point(0, 0), Point(14, 28))
    b.add_point(Point(0, 40), Point(-24, 0), Point(24, 0))
    b.add_point(Point(44, 6), Point(-14, 28), Point(0, 0))
    p.shape.value = b
    arc.add_shape(p)
    st = Stroke(col(CORAL), 18)
    st.line_cap = 2
    st.line_join = 2
    arc.add_shape(st)
    hs.add_shape(arc)
    hs.add_shape(ellipse(-44, 6, 30, 30, CORAL))   # ear piece
    hs.add_shape(ellipse(44, 6, 30, 30, CORAL))    # mouth piece
    hs.transform.rotation.value = -40
    sc = hs.transform.scale
    sc.add_keyframe(0, Point(94, 94), EASE_IO)
    sc.add_keyframe(12, Point(108, 108), EASE_IO)
    sc.add_keyframe(24, Point(94, 94), EASE_IO)
    sc.add_keyframe(50, Point(94, 94))
    # ringing sound waves emanating top-right, fading in and out in sequence
    waves = shape_layer(a, 176, 70)
    for i, d in enumerate((22, 40)):
        ring = stroke_circle(0, 0, d, d, CORAL, 4)
        waves.add_shape(ring)
    wop = waves.transform.opacity
    wop.add_keyframe(0, 0, EASE_OUT)
    wop.add_keyframe(10, 80, EASE_IN)
    wop.add_keyframe(24, 0, EASE_OUT)
    wop.add_keyframe(34, 80, EASE_IN)
    wop.add_keyframe(48, 0, EASE_IO)
    wop.add_keyframe(50, 0)
    add_bg(a)
    return a


# ----------------------------------------------------------------------------
# 13. Scan the label — a scan beam sweeps a product label card (search·action)
# ----------------------------------------------------------------------------
def build_scan_label():
    a = new_anim(
        "MewGuard — Scan the label",
        "search, scan, action",
        "A green scan beam sweeps down a product label while its text lines settle — "
        "invites the faster scan input when a worried hand can't type.",
        op=60, theme=GREEN,
    )
    # scan beam, drawn first → on top. A translucent green band that travels down
    # the card and fades at the ends so each loop reads as a fresh pass.
    beam = shape_layer(a, 120, 120)
    beam.add_shape(rounded_rect(0, 0, 150, 9, GREEN_L, 4))
    pos = beam.transform.position
    pos.add_keyframe(0, Point(120, 120 - 52), EASE_IO)
    pos.add_keyframe(40, Point(120, 120 + 52), EASE_IO)
    pos.add_keyframe(60, Point(120, 120 - 52))
    bop = beam.transform.opacity
    bop.add_keyframe(0, 0, EASE_OUT)
    bop.add_keyframe(8, 70, EASE_IO)
    bop.add_keyframe(34, 70, EASE_IO)
    bop.add_keyframe(42, 0, EASE_IN)
    bop.add_keyframe(60, 0)
    # label text lines (green rounded bars), left-aligned in the card, below the beam
    lines = shape_layer(a)
    for ly, lw in ((-30, 96), (-8, 120), (14, 120), (36, 64)):
        lines.add_shape(rounded_rect(-55 + lw / 2, ly, lw, 9, GREEN, 4))
    # white label card behind the text
    card = shape_layer(a)
    card.add_shape(rounded_rect(0, 0, 150, 116, WHITE, 16))
    add_bg(a, 170)
    return a


# ----------------------------------------------------------------------------
# 14. Mealtime logged — kibble drops into a bowl, then a heart pops (care·feedback)
# ----------------------------------------------------------------------------
def build_meal_bowl():
    a = new_anim(
        "MewGuard — Mealtime logged",
        "care, feedback, feeding",
        "Kibble drops into a bowl and a small heart pops — rewards logging a feeding "
        "in the care tracker.",
        op=60, theme=CAUTION,
    )
    # heart payoff, drawn first → on top, pops above the bowl near the end
    heart = shape_layer(a, 120, 70)
    heart.add_shape(heart_group(CORAL, 0.42))
    hsc = heart.transform.scale
    hsc.add_keyframe(0, Point(0, 0))
    hsc.add_keyframe(38, Point(0, 0), EASE_OUT)
    hsc.add_keyframe(46, Point(120, 120), EASE_IN)
    hsc.add_keyframe(54, Point(100, 100), EASE_IO)
    hsc.add_keyframe(60, Point(100, 100))
    # kibble pieces drop in and settle into the bowl, staggered
    for i, (kx, col_hex) in enumerate([(-30, CAUTION), (-8, GOLD),
                                       (14, CAUTION), (34, GOLD)]):
        k = shape_layer(a, 120 + kx, 120)
        k.add_shape(ellipse(0, 0, 17, 15, col_hex))
        pos = k.transform.position
        ty = 120 + 14
        t = i * 5
        pos.add_keyframe(t, Point(120 + kx, 120 - 78), EASE_IN)
        pos.add_keyframe(t + 11, Point(120 + kx, ty + 6), EASE_OUT)
        pos.add_keyframe(t + 17, Point(120 + kx, ty), EASE_IO)
        pos.add_keyframe(60, Point(120 + kx, ty))
        op = k.transform.opacity
        op.add_keyframe(t, 0, EASE_OUT)
        op.add_keyframe(t + 4, 100)
    # bowl: inner food surface first (on top), green bowl body behind it
    bowl = shape_layer(a)
    bowl.add_shape(ellipse(0, 14, 120, 40, SURFACE))   # inner surface
    bowl.add_shape(ellipse(0, 22, 152, 58, GREEN))     # bowl body
    add_bg(a)
    return a


# ----------------------------------------------------------------------------
# 15. Name your cat — a heart-engraved collar tag swings on its ring (onboarding)
# ----------------------------------------------------------------------------
def build_name_tag():
    a = new_anim(
        "MewGuard — Name your cat",
        "onboarding, empty-state, profile",
        "A heart-engraved collar tag swings gently on its ring — invites a worried "
        "owner to name and claim their cat's profile.",
        op=60, theme=GREEN,
    )
    # pendant tag: layer pivots about the ring (anchor above the disc) so the whole
    # tag swings like a pendulum. Heart drawn first → on top of the disc.
    tag = shape_layer(a, 120, 122)
    tag.transform.anchor_point.value = Point(0, -48)  # pivot at the ring above
    tag.add_shape(heart_group(CORAL, 0.30))           # engraved heart (on top)
    tag.add_shape(ellipse(0, 0, 66, 66, GREEN))       # the tag disc
    tag.add_shape(stroke_circle(0, -44, 22, 22, GREEN_L, 5))  # hanging ring (behind)
    rot = tag.transform.rotation
    rot.add_keyframe(0, -16, EASE_IO)
    rot.add_keyframe(15, 16, EASE_IO)
    rot.add_keyframe(30, -16, EASE_IO)
    rot.add_keyframe(45, 16, EASE_IO)
    rot.add_keyframe(60, -16)
    add_bg(a, 168)
    return a


# ----------------------------------------------------------------------------
# 16. Back to chasing toys — a yarn ball bounces and spins (recovery·milestone)
# ----------------------------------------------------------------------------
def build_chase_toy():
    a = new_anim(
        "MewGuard — Back to chasing toys",
        "recovery, milestone, play",
        "A yarn ball bounces and spins playfully — celebrates the milestone of a "
        "recovered cat back to chasing toys.",
        op=60, theme=SAFE,
    )
    ball = shape_layer(a, 120, 150)
    # loose yarn end trailing from the ball (drawn first → on top)
    g = Group()
    p = Path()
    b = Bezier()
    b.add_point(Point(30, 2), Point(0, 0), Point(10, -4))
    b.add_point(Point(48, 16), Point(-2, -10), Point(4, 10))
    b.add_point(Point(40, 32), Point(8, -4), Point(-6, 8))
    p.shape.value = b
    g.add_shape(p)
    st = Stroke(col(CORAL), 3)
    st.line_cap = 2
    g.add_shape(st)
    ball.add_shape(g)
    # crossing wraps suggest wound yarn (cream over the coral body)
    ball.add_shape(stroke_circle(0, 0, 64, 32, CREAM, 3))
    ball.add_shape(stroke_circle(0, 0, 32, 64, CREAM, 3))
    ball.add_shape(ellipse(0, 0, 64, 64, CORAL))   # ball body (added last → behind)
    # bounce: pure vertical hops so the loop closes cleanly, with squash on landing
    pos = ball.transform.position
    pos.add_keyframe(0, Point(120, 150), EASE_OUT)
    pos.add_keyframe(15, Point(120, 92), EASE_IN)
    pos.add_keyframe(30, Point(120, 150), EASE_OUT)
    pos.add_keyframe(45, Point(120, 92), EASE_IN)
    pos.add_keyframe(60, Point(120, 150))
    sc = ball.transform.scale
    sc.add_keyframe(0, Point(116, 86), EASE_OUT)    # squashed on the ground
    sc.add_keyframe(15, Point(100, 100), EASE_IO)   # round at the apex
    sc.add_keyframe(30, Point(116, 86), EASE_OUT)
    sc.add_keyframe(45, Point(100, 100), EASE_IO)
    sc.add_keyframe(60, Point(116, 86))
    rot = ball.transform.rotation                   # continuous playful spin
    rot.add_keyframe(0, 0, EASE_IO)
    rot.add_keyframe(60, 360)
    add_bg(a)
    return a


# ----------------------------------------------------------------------------
# 17. Reviewed by vets — a rosette badge pops in and a check draws (verdict·trust)
# ----------------------------------------------------------------------------
def build_vet_rosette():
    a = new_anim(
        "MewGuard — Reviewed by vets",
        "verdict, trust, credibility",
        "A vet-reviewed rosette pops in and a check draws itself — anchors trust in "
        "the verdict at the moment certainty matters most.",
        op=55, theme=GREEN,
    )
    # medal: check (on top) + inner disc + scalloped rosette, all in one layer that
    # pops in then gives a gentle confirming bob. Ribbon tails sit behind it.
    medal = shape_layer(a, 120, 108)
    # check mark, drawn-on via Trim after the medal lands, on top
    g = Group()
    p = Path()
    b = Bezier()
    b.add_point(Point(-22, 2))
    b.add_point(Point(-6, 20))
    b.add_point(Point(26, -16))
    p.shape.value = b
    g.add_shape(p)
    st = Stroke(col(WHITE), 9)
    st.line_cap = 2
    st.line_join = 2
    g.add_shape(st)
    tr = Trim()
    tr.start.value = 0
    tr.end.add_keyframe(16, 0, EASE_OUT)
    tr.end.add_keyframe(30, 100, EASE_IN)
    g.add_shape(tr)
    medal.add_shape(g)
    medal.add_shape(ellipse(0, 0, 92, 92, GREEN_L))   # inner disc
    # scalloped rosette edge: a many-pointed star with a small inner/outer gap
    ros = Group()
    star = Star()
    star.star_type = StarType.Star
    star.points.value = 12
    star.outer_radius.value = 70
    star.inner_radius.value = 58
    star.rotation.value = 0
    star.position.value = Point(0, 0)
    ros.add_shape(star)
    ros.add_shape(Fill(col(GREEN)))
    medal.add_shape(ros)
    sc = medal.transform.scale
    sc.add_keyframe(0, Point(0, 0), EASE_OUT)
    sc.add_keyframe(12, Point(110, 110), EASE_IN)
    sc.add_keyframe(20, Point(100, 100), EASE_IO)
    sc.add_keyframe(40, Point(100, 100), EASE_IO)
    sc.add_keyframe(47, Point(103, 103), EASE_IO)   # gentle confirming bob
    sc.add_keyframe(55, Point(100, 100))
    # ribbon tails hanging below, on their own layer behind the medal, fading in
    rib = shape_layer(a, 120, 108)
    for rx in (-22, 22):
        tail = Group()
        p2 = Path()
        b2 = Bezier()
        b2.closed = True
        b2.add_point(Point(rx - 15, 58))
        b2.add_point(Point(rx + 15, 58))
        b2.add_point(Point(rx + 15, 112))
        b2.add_point(Point(rx, 98))
        b2.add_point(Point(rx - 15, 112))
        p2.shape.value = b2
        tail.add_shape(p2)
        tail.add_shape(Fill(col(CORAL)))
        rib.add_shape(tail)
    rop = rib.transform.opacity
    rop.add_keyframe(0, 0, EASE_OUT)
    rop.add_keyframe(10, 0, EASE_OUT)
    rop.add_keyframe(18, 100, EASE_IN)
    rop.add_keyframe(55, 100)
    add_bg(a, 172)
    return a


# ----------------------------------------------------------------------------
# 18. How much matters — a balance scale tips gently back and forth (verdict·nuance)
# ----------------------------------------------------------------------------
def build_dose_scale():
    a = new_anim(
        "MewGuard — How much matters",
        "verdict, nuance, dose",
        "A balance scale tips gently back and forth then settles — frames toxicity as "
        "dose-dependent, easing panic over a tiny nibble.",
        op=72, theme=CAUTION,
    )
    # beam + two pans + hangers in one layer that pivots about the central fulcrum,
    # so the whole balance tips. Drawn first → on top of the fulcrum post.
    beam = shape_layer(a, 120, 102)
    beam.transform.anchor_point.value = Point(0, 0)
    for px, fill in ((-70, GREEN_L), (70, CAUTION)):
        beam.add_shape(ellipse(px, 32, 48, 15, fill))           # pan dish
        beam.add_shape(rounded_rect(px, 17, 3, 28, GREEN, 1))   # hanger string
    beam.add_shape(ellipse(0, 0, 18, 18, GREEN))                # pivot knob
    beam.add_shape(rounded_rect(0, 0, 158, 9, GREEN, 4))        # the beam bar
    rot = beam.transform.rotation
    rot.add_keyframe(0, -11, EASE_IO)
    rot.add_keyframe(20, 11, EASE_IO)
    rot.add_keyframe(40, -6, EASE_IO)
    rot.add_keyframe(56, 4, EASE_IO)
    rot.add_keyframe(72, -11)
    # fulcrum post + base, steady, on a layer behind the tipping beam
    post = shape_layer(a, 120, 102)
    g = Group()
    p = Path()
    b = Bezier()
    b.closed = True
    b.add_point(Point(0, 4))
    b.add_point(Point(30, 80))
    b.add_point(Point(-30, 80))
    p.shape.value = b
    g.add_shape(p)
    g.add_shape(Fill(col(GREEN)))
    post.add_shape(g)
    post.add_shape(ellipse(0, 86, 96, 18, GREEN))   # base
    add_bg(a, 172)
    return a


BUILDERS = {
    "mw-heartbeat": build_heartbeat,
    "mw-safe-check": build_safe_check,
    "mw-paw-loading": build_paw_loading,
    "mw-heart-pop": build_heart_pop,
    "mw-purr-cat": build_purr,
    "mw-bell-recall": build_bell,
    "mw-water-ripple": build_water_ripple,
    "mw-star-rating": build_star_rating,
    "mw-wave-hello": build_wave_hello,
    "mw-recovery-arc": build_recovery_arc,
    "mw-meds-reminder": build_meds_reminder,
    "mw-call-vet": build_call_vet,
    "mw-scan-label": build_scan_label,
    "mw-meal-bowl": build_meal_bowl,
    "mw-name-tag": build_name_tag,
    "mw-chase-toy": build_chase_toy,
    "mw-vet-rosette": build_vet_rosette,
    "mw-dose-scale": build_dose_scale,
}


def main():
    for name, fn in BUILDERS.items():
        anim = fn()
        path = os.path.join(OUT, name + ".json")
        export_lottie(anim, path)
        print("wrote", path)


if __name__ == "__main__":
    main()
