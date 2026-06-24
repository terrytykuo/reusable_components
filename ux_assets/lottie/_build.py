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
    Ellipse, Fill, Stroke, Group, Star, StarType, Path, Trim,
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
}


def main():
    for name, fn in BUILDERS.items():
        anim = fn()
        path = os.path.join(OUT, name + ".json")
        export_lottie(anim, path)
        print("wrote", path)


if __name__ == "__main__":
    main()
