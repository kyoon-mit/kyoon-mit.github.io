"""Pixel art for the /thesis/ gate: palette, tiles, characters, battle sprites, font.

    uv run --with pillow python tools/thesis_art/art.py docs/thesis/sprites.js [preview.png]

Writes sprites.js (palette, sprites as palette-character rows, and the 5x7 font
from font.py); with a second argument it also renders a preview sheet.
"""
import json, math, sys, random
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent))
from pix import Pix, flip, shift, ellipse_rot
from font import G as FONT

PAL = {
    "k": "#283038", "K": "#4c5060", "g": "#7c8090", "G": "#b0b4c4", "l": "#d4d4e0", "w": "#f8f8f8",
    "0": "#101018",
    "s": "#f8d0a8", "S": "#d8a070",
    "h": "#3c3048", "H": "#6a5880",
    "b": "#4078d0", "B": "#2c5098", "c": "#90c0f8",
    "i": "#f8b0c8", "I": "#d87090",
    "r": "#e84838", "R": "#a02818",
    "y": "#f8d848", "Y": "#c89820",
    "o": "#d09050", "O": "#98602c", "u": "#643818",
    "n": "#90d070", "N": "#68b050", "j": "#c0e8a0",
    "q": "#50a048", "Q": "#307830", "z": "#1c4c24", "x": "#80c860",
    "f": "#4c8848", "F": "#30603a", "e": "#6ca860",
    "d": "#e8d098", "D": "#c8a868", "a": "#a08048",
    "m": "#a8a8b0", "M": "#80808c", "p": "#5c5c68",
    "v": "#7464a4", "V": "#4c3c78", "U": "#a494cc",
    "t": "#906840", "T": "#5c3c20", "A": "#b88c58",
    "C": "#60a8f0", "W": "#3874c8",
    "P": "#f08830",
}
SPR = {}


def add(name, rows):
    w = len(rows[0])
    for i, r in enumerate(rows):
        assert len(r) == w, f"{name} row {i}: {len(r)} != {w}: {r!r}"
        for ch in r:
            assert ch == "." or ch in PAL, f"{name} row {i}: bad char {ch!r}"
    SPR[name] = rows


def rnd(seed):
    return random.Random(seed)

# ============================================================ player (16x20)
P_DOWN = [
    "......kkkk......",
    "....kkhhhhkk....",
    "...khhhHHhhhk...",
    "..khhhHhhhhhhk..",
    "..khhhhhhhhhhk..",
    ".khhhhhhhhhhhhk.",
    ".khhhsssssshhhk.",
    ".khhsssssssshhk.",
    "..kssksssskssk..",
    "..kssksssskssk..",
    "...kssssssssk...",
    "....kkSSSSkk....",
    "...kbbbwwbbbk...",
    "..kbbbbwwbbbbk..",
    ".ksbbbbbbbbbbsk.",
    ".kskbbbbbbbbksk.",
    "..kkKKKKKKKKkk..",
    "...kKKKkkKKKk...",
    "...kKKk..kKKk...",
    "...kkkk..kkkk...",
]
P_DOWN_STEP = P_DOWN[:16] + [
    "..kkKKKKKKKKkk..",
    "...kKKKkkKKKk...",
    "...kKKk..kkkk...",
    "...kkkk.........",
]
P_UP = [
    "......kkkk......",
    "....kkhhhhkk....",
    "...khhhhhhhhk...",
    "..khhhhHHhhhhk..",
    "..khhhHhhHhhhk..",
    ".khhhhhhhhhhhhk.",
    ".khhhhhHHhhhhhk.",
    ".khhhhhhhhhhhhk.",
    "..khhhhhhhhhhk..",
    "..kshhhhhhhhsk..",
    "...khhhhhhhhk...",
    "....kkSSSSkk....",
    "...kbbbbbbbbk...",
    "..kbbbbBBbbbbk..",
    ".ksbbbbBBbbbbsk.",
    ".kskbbbbbbbbksk.",
    "..kkKKKKKKKKkk..",
    "...kKKKkkKKKk...",
    "...kKKk..kKKk...",
    "...kkkk..kkkk...",
]
P_UP_STEP = P_UP[:16] + P_DOWN_STEP[16:]
P_LEFT = [
    "......kkkk......",
    "....kkhhhhkk....",
    "...khhhhhhhhk...",
    "..khhhHHhhhhhk..",
    "..khhHhhhhhhhk..",
    ".khhhhhhhhhhhk..",
    ".kssshhhhhhhhk..",
    ".kssssshhhhhhk..",
    ".kskssshhshhhk..",
    "..kssssshhhhk...",
    "...kkssssshk....",
    "....kSSSkkk.....",
    "....kbbbbbk.....",
    "...kbbbbbbbk....",
    "...kbbsbbBbk....",
    "...kbbSkbBbk....",
    "....kKKKKKk.....",
    "....kKKKKKk.....",
    "....kKKkKKk.....",
    "....kkkkkkk.....",
]
P_LEFT_STEP = P_LEFT[:16] + [
    "....kKKKKKk.....",
    "...kKKKkKKKk....",
    "..kKKk..kKKk....",
    "..kkk....kkk....",
]
for n, r in [("p_down", P_DOWN), ("p_down_step", P_DOWN_STEP), ("p_up", P_UP), ("p_up_step", P_UP_STEP),
             ("p_left", P_LEFT), ("p_left_step", P_LEFT_STEP)]:
    add(n, r)

# ============================================================ rabbit overworld (16x16)
R_FRONT = [
    "................",
    ".....kk..kk.....",
    "....kwk..kwk....",
    "....kik..kik....",
    "....kik..kik....",
    "....kwkkkkwk....",
    "...kwwwwwwwwk...",
    "..kwwwwwwwwwwk..",
    "..kw0wwwwww0wk..",
    "..kwiwwiiwwiwk..",
    "...kwwwwwwwwk...",
    "..kwwwwwwwwwwk..",
    ".kwlwwwwwwwwlwk.",
    ".kwllwwwwwwllwk.",
    "..kkllkkkkllkk..",
    "....kk....kk....",
]
R_SIDE = [
    "................",
    "......kk........",
    ".....kwk.kk.....",
    ".....kik.kwk....",
    ".....kik.kik....",
    "....kkwkkkik....",
    "...kwwwwwwkk....",
    "..kww0wwwwwk....",
    ".kiwwwwwwwwwk...",
    "..kkwwwwwwwwwk..",
    "....kwwwwwwwwwk.",
    "....kwwwwwwwwwwk",
    "....kwlwwwwwlwwk",
    "...kwllwwwwllwk.",
    "...kkkkkkkkkkk..",
    "................",
]
add("rab_front", R_FRONT); add("rab_front_hop", shift(R_FRONT, 0, -2))
add("rab_side", R_SIDE); add("rab_side_hop", shift(R_SIDE, 0, -2))
# munching frame: mouth moves
RM = [r for r in R_FRONT]; RM = RM[:9] + ["..kwiwkkkkwiwk.."] + RM[10:]
add("rab_munch", RM)

# ============================================================ tiles (16x16)
def grass_tile(seed, base="n", dark="N", light="j"):
    p = Pix(16, 16, base)
    r = rnd(seed)
    for _ in range(4):
        x, y = r.randrange(1, 15), r.randrange(1, 15)
        p.set(x, y, dark); p.set(x - 1, y - 1, dark); p.set(x + 1, y - 1, dark); p.set(x, y - 2, light)
    return p.rows()

add("grass", grass_tile(3)); add("grass2", grass_tile(11)); add("grass3", grass_tile(29))
add("fgrass", grass_tile(5, "f", "F", "e")); add("fgrass2", grass_tile(17, "f", "F", "e"))

TALL = [
    "nnnnnnnnnnnnnnnn",
    "nnNnnnnnNnnnnnNn",
    "nNqNnnnNqNnnnNqN",
    "nNqNnNnNqNnNnNqN",
    "NqQqNqNqQqNqNqQq",
    "qQzQqQqQzQqQqQzQ",
    "nnnnnnnnnnnnnnnn",
    "nnnnNnnnnnNnnnnn",
    "nnnNqNnnnnNqNnnn",
    "nNnNqNnNnNNqNnNn",
    "NqNqQqNqNqNqQNqN",
    "qQqQzQqQqQqQzqQq",
    "nnnnnnnnnnnnnnnn",
    "nnNnnnnnNnnnnnNn",
    "nNqNnnnNqNnnnNqN",
    "NqQqNnNqQqNnNqQq",
]
add("tall", TALL)
# overlay for the lower half of a character standing in tall grass
TALL_OVER = ["." * 16] * 8 + [r if i >= 0 else r for i, r in enumerate(TALL[8:])]
add("tall_over", TALL_OVER)
add("ftall", [r.translate(str.maketrans("nNqQz", "fFQzz")) for r in TALL])
add("ftall_over", [r.translate(str.maketrans("nNqQz", "fFQzz")) if i >= 8 else "." * 16 for i, r in enumerate(TALL)])

def flower_tile(frame):
    p = Pix(16, 16); p.a = [list(r) for r in grass_tile(41)]
    for (cx, cy, col) in ((4, 4, "r"), (11, 10, "y"), (3, 12, "w")):
        dx = 1 if frame and col != "w" else 0
        for (x, y) in ((0, -1), (-1, 0), (1, 0), (0, 1)):
            p.set(cx + x + dx, cy + y, col)
        p.set(cx + dx, cy, "y" if col != "y" else "r")
        p.set(cx, cy + 2, "N")
    return p.rows()
add("flower0", flower_tile(0)); add("flower1", flower_tile(1))

def path_tile(mask, base="d", dot="D", edge="D", grass="n", seed=7):
    """mask bits: 1=N,2=E,4=S,8=W where neighbour is NOT path (draw a grass border)."""
    p = Pix(16, 16, base)
    r = rnd(seed)
    for _ in range(6):
        p.set(r.randrange(16), r.randrange(16), dot)
    p.set(r.randrange(2, 14), r.randrange(2, 14), "a")
    jag = [2, 1, 2, 2, 1, 2, 2, 1, 1, 2, 2, 1, 2, 1, 2, 2]
    for i in range(16):
        d = jag[i]
        if mask & 1:
            for y in range(d): p.set(i, y, grass)
            p.set(i, d, edge)
        if mask & 4:
            for y in range(d): p.set(i, 15 - y, grass)
            p.set(i, 15 - d, edge)
        if mask & 8:
            for x in range(d): p.set(x, i, grass)
            p.set(d, i, edge)
        if mask & 2:
            for x in range(d): p.set(15 - x, i, grass)
            p.set(15 - d, i, edge)
    return p.rows()
for m in range(16):
    add(f"path{m}", path_tile(m))
    add(f"fpath{m}", path_tile(m, base="D", dot="a", edge="a", grass="f"))

def treewall(seed, pal=("x", "q", "Q", "z")):
    hi, mid, sh, ol = pal
    p = Pix(16, 16, sh)
    r = rnd(seed)
    for (cx, cy, rr) in ((8, 6, 7.5), (2, 13, 5), (14, 13, 5)):
        p.ellipse(cx, cy, rr, rr * 0.9, mid)
    p.ring(8, 6, 7.5, 6.75, ol)
    for y in range(16):
        for x in range(16):
            if p.get(x, y) == mid and (x - 8) + (y - 6) < -5:
                p.set(x, y, hi)
            elif p.get(x, y) == mid and (y - 6) > 3:
                p.set(x, y, sh)
    for _ in range(5):
        x, y = r.randrange(2, 14), r.randrange(1, 11)
        if p.get(x, y) == mid:
            p.set(x, y, hi)
    return p.rows()
add("tree", treewall(1)); add("tree2", treewall(2))
add("ftree", treewall(1, ("q", "Q", "z", "0"))); add("ftree2", treewall(2, ("q", "Q", "z", "0")))

def fence_tile(mask, ground):
    """mask bits 1=N,2=E,4=S,8=W where neighbour IS fence."""
    p = Pix(16, 16); p.a = [list(r) for r in ground]
    # rails
    if mask & 8:
        p.rect(0, 5, 7, 6, "o"); p.rect(0, 9, 7, 10, "o"); p.rect(0, 7, 7, 7, "k"); p.rect(0, 11, 7, 11, "k"); p.rect(0, 4, 7, 4, "k"); p.rect(0, 8, 7, 8, "k")
    if mask & 2:
        p.rect(8, 5, 15, 6, "o"); p.rect(8, 9, 15, 10, "o"); p.rect(8, 7, 15, 7, "k"); p.rect(8, 11, 15, 11, "k"); p.rect(8, 4, 15, 4, "k"); p.rect(8, 8, 15, 8, "k")
    if mask & 1:
        p.rect(7, 0, 8, 7, "O"); p.rect(6, 0, 6, 7, "k"); p.rect(9, 0, 9, 7, "k")
    if mask & 4:
        p.rect(7, 8, 8, 15, "O"); p.rect(6, 8, 6, 15, "k"); p.rect(9, 8, 9, 15, "k")
    # post
    p.rect(5, 2, 10, 13, "k"); p.rect(6, 3, 9, 12, "o"); p.rect(8, 3, 9, 12, "O"); p.rect(6, 3, 9, 3, "A")
    p.rect(5, 13, 10, 13, "k"); p.rect(6, 14, 9, 14, "N")
    return p.rows()
G1 = grass_tile(3)
for m in range(16):
    add(f"fence{m}", fence_tile(m, G1))

SIGN = Pix(16, 16); SIGN.a = [list(r) for r in grass_tile(3)]
SIGN.rect(1, 2, 14, 10, "k"); SIGN.rect(2, 3, 13, 9, "o"); SIGN.rect(2, 9, 13, 9, "O")
for y in (5, 7):
    SIGN.rect(4, y, 11, y, "O")
SIGN.rect(6, 11, 9, 14, "k"); SIGN.rect(7, 11, 8, 14, "O")
add("sign", SIGN.rows())

def rock_tile():
    p = Pix(16, 16); p.a = [list(r) for r in grass_tile(3)]
    q = Pix(16, 16)
    q.ellipse(8, 9, 7, 5.5, "m"); q.ellipse(6, 7, 3, 2, "G", only="m"); q.rim("m", "M", 2); q.outline("k")
    p.paste(q.rows(), 0, 0)
    return p.rows()
add("rock", rock_tile())

def hutch():
    p = Pix(16, 16); p.a = [list(r) for r in grass_tile(11)]
    p.poly([(0, 6), (8, 0), (16, 6)], "R"); p.line(0, 6, 8, 0, "k"); p.line(8, 0, 15, 6, "k")
    p.rect(1, 6, 14, 15, "o"); p.rect(1, 6, 14, 6, "k"); p.rect(1, 6, 1, 15, "k"); p.rect(14, 6, 14, 15, "k")
    p.rect(1, 15, 14, 15, "k")
    for y in (9, 12):
        p.rect(2, y, 13, y, "O")
    p.ellipse(8, 12, 3, 3.5, "0")
    return p.rows()
add("hutch", hutch())

def carrots():
    p = Pix(16, 16, "O")
    for y in (3, 8, 13):
        p.rect(0, y + 1, 15, y + 1, "u")
        for x in (2, 7, 12):
            p.set(x, y - 1, "q"); p.set(x - 1, y - 2, "q"); p.set(x + 1, y - 2, "x"); p.set(x, y - 2, "Q")
            p.set(x, y, "P")
    return p.rows()
add("carrots", carrots())

def bowl():
    p = Pix(16, 16); p.a = [list(r) for r in grass_tile(29)]
    q = Pix(16, 16); q.ellipse(8, 10, 7, 4.5, "g"); q.ellipse(8, 9, 5.5, 3, "C"); q.ellipse(6, 8, 2, 1, "c", only="C"); q.outline("k")
    p.paste(q.rows(), 0, 0)
    return p.rows()
add("bowl", bowl())

def hay():
    p = Pix(16, 16); p.a = [list(r) for r in grass_tile(3)]
    q = Pix(16, 16); q.ellipse(8, 10, 7.5, 5.5, "y")
    r = rnd(4)
    for _ in range(14):
        x, y = r.randrange(2, 14), r.randrange(6, 15)
        if q.get(x, y) == "y": q.set(x, y, "Y")
    q.outline("k"); p.paste(q.rows(), 0, 0)
    return p.rows()
add("hay", hay())

def mushroom(seed):
    p = Pix(16, 16); p.a = [list(r) for r in grass_tile(seed, "f", "F", "e")]
    for (cx, cy, s) in ((5, 9, 1.0), (11, 12, 0.7)):
        q = Pix(16, 16)
        q.ellipse(cx, cy, 4 * s, 2.6 * s, "r"); q.rect(int(cx - 1), int(cy + 1), int(cx), int(cy + 3 * s + 1), "l")
        q.set(cx - 2, cy - 1, "w"); q.set(cx + 1, cy - 1, "w"); q.outline("k")
        p.paste(q.rows(), 0, 0)
    return p.rows()
add("mush", mushroom(5))

def log_tile():
    p = Pix(16, 16); p.a = [list(r) for r in grass_tile(5, "f", "F", "e")]
    q = Pix(16, 16); q.rect(1, 6, 13, 12, "o"); q.rect(1, 11, 13, 12, "O"); q.ellipse(13.5, 9.5, 2.5, 3.5, "A"); q.set(13, 9, "O"); q.set(14, 10, "O")
    for x in (4, 8):
        q.set(x, 8, "O"); q.set(x + 1, 8, "O")
    q.outline("k"); p.paste(q.rows(), 0, 0)
    return p.rows()
add("log", log_tile())

# --- cage interior tiles
def floor_tile(seed):
    p = Pix(16, 16, "m")
    for y in (7, 15):
        p.rect(0, y, 15, y, "M")
    for x in (3, 11):
        p.rect(x, 0, x, 6, "M")
    for x in (7, 15):
        p.rect(x, 8, x, 14, "M")
    r = rnd(seed)
    for _ in range(3):
        p.set(r.randrange(16), r.randrange(16), "p")
    for _ in range(4):
        x, y = r.randrange(16), r.randrange(16)
        if p.get(x, y) == "m": p.set(x, y, "G")
    return p.rows()
add("floor", floor_tile(1)); add("floor2", floor_tile(2))

def wall_tile(torch=None):
    p = Pix(16, 16, "p")
    for y in (3, 7, 11, 15):
        p.rect(0, y, 15, y, "K")
    for row, off in ((0, 0), (1, 4), (2, 0), (3, 4)):
        for x in range(off, 16, 8):
            p.rect(x, row * 4, x, row * 4 + 2, "K")
    for y in range(16):
        for x in range(16):
            if p.get(x, y) == "p" and (x + y * 3) % 11 == 0:
                p.set(x, y, "M")
    if torch is not None:
        p.rect(6, 9, 9, 10, "T"); p.rect(7, 11, 8, 13, "T"); p.rect(5, 8, 10, 8, "k")
        fl = [(7, 7), (8, 7), (7, 6), (8, 6), (7, 5), (8, 4), (6, 7), (9, 7)] if torch == 0 else [(7, 7), (8, 7), (7, 6), (8, 6), (8, 5), (7, 4), (6, 7), (9, 6)]
        for (x, y) in fl:
            p.set(x, y, "P")
        p.set(7, 7, "y"); p.set(8, 7, "y"); p.set(7 if torch else 8, 6, "y")
    return p.rows()
add("wall", wall_tile()); add("torch0", wall_tile(0)); add("torch1", wall_tile(1))

def bars_tile():
    p = Pix(16, 16, "0")
    for x in (1, 6, 11):
        p.rect(x, 0, x + 2, 15, "k"); p.set(x + 1, 0, "g")
        p.rect(x + 1, 0, x + 1, 15, "G"); p.rect(x + 2, 1, x + 2, 14, "g")
    p.rect(0, 0, 15, 1, "g"); p.rect(0, 0, 15, 0, "k"); p.rect(0, 2, 15, 2, "k")
    return p.rows()
add("bars", bars_tile())

def bones_tile():
    p = Pix(16, 16); p.a = [list(r) for r in floor_tile(3)]
    q = Pix(16, 16)
    q.line(3, 11, 11, 6, "w"); q.line(3, 12, 11, 7, "l")
    for (x, y) in ((2, 11), (3, 13), (11, 5), (12, 7)):
        q.ellipse(x + 0.5, y + 0.5, 1.6, 1.6, "w")
    q.ellipse(11, 12, 2.5, 2, "w"); q.set(10, 12, "0"); q.set(12, 12, "0")
    q.outline("k"); p.paste(q.rows(), 0, 0)
    return p.rows()
add("bones", bones_tile())

def exit_tile():
    p = Pix(16, 16); p.a = [list(r) for r in floor_tile(1)]
    p.rect(2, 4, 13, 13, "R"); p.rect(3, 5, 12, 12, "r")
    for x in range(3, 13, 2):
        p.set(x, 5, "R"); p.set(x + 1, 12, "R")
    return p.rows()
add("exitmat", exit_tile())

# --- cage exterior (80x48), door closed / open
def cage(door_open):
    p = Pix(80, 48, "0")
    # beast silhouette inside
    p.ellipse(40, 36, 22, 9, "V")
    for (hx, hy) in ((24, 31), (40, 27), (56, 31)):
        p.ellipse(hx, hy, 6.5, 5.5, "V")
        p.poly([(hx - 6, hy - 2), (hx - 4, hy - 9), (hx - 1, hy - 4)], "V")
        p.poly([(hx + 1, hy - 4), (hx + 4, hy - 9), (hx + 6, hy - 2)], "V")
    # bars
    for x in range(0, 80, 5):
        if door_open and 32 <= x <= 46:
            continue
        p.rect(x, 4, x + 2, 41, "k"); p.rect(x + 1, 4, x + 1, 41, "G")
        p.rect(x + 2, 5, x + 2, 41, "g")
    # top frame
    p.rect(0, 0, 79, 4, "g"); p.rect(0, 1, 79, 1, "G"); p.rect(0, 0, 79, 0, "k"); p.rect(0, 4, 79, 4, "k")
    for x in range(3, 80, 10):
        p.set(x, 2, "k")
    # corner posts
    for x in (0, 76):
        p.rect(x, 0, x + 3, 43, "g"); p.rect(x + 1, 0, x + 1, 43, "G"); p.rect(x, 0, x, 43, "k"); p.rect(x + 3, 0, x + 3, 43, "k")
    # stone base
    p.rect(0, 42, 79, 47, "m"); p.rect(0, 42, 79, 42, "k"); p.rect(0, 47, 79, 47, "k")
    for x in range(0, 80, 8):
        p.rect(x, 43, x, 46, "M")
    p.rect(0, 45, 79, 45, "M")
    # door frame
    p.rect(31, 14, 48, 15, "k"); p.rect(31, 14, 32, 47, "k"); p.rect(47, 14, 48, 47, "k")
    p.rect(32, 15, 47, 15, "g")
    if door_open:
        p.rect(33, 16, 46, 47, "0")
    else:
        for x in range(34, 47, 4):
            p.rect(x, 16, x + 1, 41, "g"); p.rect(x, 16, x, 41, "G")
        p.rect(33, 27, 46, 28, "g"); p.rect(33, 27, 46, 27, "G")
        p.rect(42, 29, 45, 33, "y"); p.rect(44, 29, 45, 33, "Y"); p.rect(43, 26, 44, 28, "k"); p.rect(42, 33, 45, 33, "k")
        p.rect(33, 42, 46, 47, "m"); p.rect(33, 42, 46, 42, "k")
    return p.rows()
add("cage", cage(False)); add("cage_open", cage(True))

# ============================================================ beast (80x48)
def beast(awake):
    W, H = 80, 48
    body = Pix(W, H)
    body.ellipse(40, 31, 38, 16, "v")
    for x in range(8, 74, 7):
        body.poly([(x - 4, 18), (x, 8 + (x % 3) * 2), (x + 4, 18)], "v")
    body.poly([(70, 30), (79, 20), (77, 34)], "v")          # tail tuft
    body.rim("v", "V", 3)
    body.outline("k")
    heads = Pix(W, H)
    for (hx, hy) in ((17, 31), (63, 31), (40, 25)):
        hd = Pix(W, H)
        hd.poly([(hx - 11, hy - 3), (hx - 8, hy - 17), (hx - 2, hy - 8)], "v")
        hd.poly([(hx + 2, hy - 8), (hx + 8, hy - 17), (hx + 11, hy - 3)], "v")
        hd.ellipse(hx, hy, 12, 10.5, "v")
        hd.ellipse(hx, hy + 6, 7, 4.5, "U")
        hd.ellipse(hx - 4, hy - 5, 4, 2.5, "U", only=("v",))
        hd.rim("v", "V", 2)
        hd.outline("k")
        hd.line(hx - 8, hy - 13, hx - 4, hy - 8, "V"); hd.line(hx + 8, hy - 13, hx + 4, hy - 8, "V")
        hd.line(hx - 7, hy - 12, hx - 4, hy - 9, "I"); hd.line(hx + 7, hy - 12, hx + 4, hy - 9, "I")
        hd.rect(hx - 1, hy + 3, hx + 1, hy + 4, "0"); hd.set(hx - 1, hy + 3, "K")
        if awake:
            for ex in (hx - 6, hx + 3):
                hd.rect(ex, hy - 3, ex + 3, hy - 1, "r"); hd.set(ex + 1, hy - 2, "0"); hd.set(ex + 2, hy - 2, "0"); hd.set(ex, hy - 3, "w")
            hd.line(hx - 7, hy - 6, hx - 2, hy - 4, "0"); hd.line(hx + 2, hy - 4, hx + 7, hy - 6, "0")
            hd.rect(hx - 4, hy + 7, hx + 4, hy + 9, "0"); hd.rect(hx - 3, hy + 9, hx + 3, hy + 9, "R")
            for fx in (hx - 3, hx + 3):
                hd.set(fx, hy + 7, "w"); hd.set(fx, hy + 8, "w")
        else:
            hd.pts([(hx - 7, hy - 2), (hx - 6, hy - 1), (hx - 5, hy - 1), (hx - 4, hy - 1), (hx - 3, hy - 2)], "0")
            hd.pts([(hx + 3, hy - 2), (hx + 4, hy - 1), (hx + 5, hy - 1), (hx + 6, hy - 1), (hx + 7, hy - 2)], "0")
            hd.rect(hx - 2, hy + 8, hx + 2, hy + 8, "V")
        for x in range(hx - 8, hx + 9):
            yy = hy + 10 + (1 if abs(x - hx) < 5 else 0)
            hd.set(x, yy, "R"); hd.set(x, yy + 1, "R")
        for x in (hx - 6, hx, hx + 6):
            yy = hy + 12 + (1 if abs(x - hx) < 5 else 0)
            hd.set(x, yy, "G"); hd.set(x, yy + 1, "l")
        heads.paste(hd.rows(), 0, 0)
    paws = Pix(W, H)
    for px in (28, 52):
        paws.ellipse(px, 45, 6, 3, "U")
    paws.outline("k")
    for px in (28, 52):
        for c in (-3, 0, 3):
            paws.set(px + c, 46, "V")
    out = Pix(W, H)
    out.paste(body.rows(), 0, 0); out.paste(heads.rows(), 0, 0); out.paste(paws.rows(), 0, 0)
    return out.rows()
add("beast_sleep", beast(False)); add("beast_awake", beast(True))

# ============================================================ ancient tree (80x96)
def ancient(awake):
    W, H = 80, 96
    tr = Pix(W, H)
    tr.poly([(27, 46), (53, 46), (55, 70), (59, 84), (67, 90), (79, 96), (1, 96), (13, 90), (21, 84), (25, 70)], "t")
    tr.poly([(6, 96), (16, 86), (24, 88), (20, 96)], "t")
    tr.poly([(60, 96), (56, 88), (64, 86), (74, 96)], "t")
    tr.rim("t", "T", 3)
    for y in range(46, 96):
        for x in range(W):
            if tr.get(x, y) == "t" and tr.get(x - 2, y) == ".":
                tr.set(x, y, "A")
    for (x, y0, y1) in ((31, 50, 58), (48, 52, 60), (29, 82, 92), (51, 84, 93), (40, 86, 94), (36, 52, 56), (44, 50, 54)):
        tr.rect(x, y0, x, y1, "T")
    tr.ring(33, 89, 2.5, 2, "T"); tr.ring(47, 58, 2, 2.5, "T")
    tr.outline("k")
    if awake:
        for ex in (31, 44):
            tr.rect(ex - 1, 62, ex + 5, 62, "T"); tr.rect(ex - 1, 63, ex + 5, 63, "u")
            tr.rect(ex, 64, ex + 4, 67, "y"); tr.rect(ex, 67, ex + 4, 67, "Y"); tr.rect(ex + 2, 65, ex + 2, 66, "0")
        tr.ellipse(40, 77, 5, 3.6, "0"); tr.rect(36, 73, 44, 73, "T"); tr.rect(38, 77, 42, 78, "u")
    else:
        for ex in (31, 44):
            tr.rect(ex - 1, 62, ex + 5, 62, "T"); tr.rect(ex, 65, ex + 4, 65, "u"); tr.set(ex, 64, "u"); tr.set(ex + 4, 64, "u")
        tr.rect(36, 76, 44, 76, "u"); tr.set(35, 75, "u"); tr.set(45, 75, "u")
    for (x, y) in ((8, 94), (9, 93), (10, 93), (11, 94), (70, 94), (69, 93), (68, 93), (24, 92), (25, 91), (57, 92)):
        tr.set(x, y, "x")
    can = Pix(W, H)
    blobs = ((14, 26, 14), (40, 16, 20), (66, 26, 14), (22, 42, 13), (58, 42, 13), (40, 34, 18), (7, 38, 7), (73, 38, 7), (40, 48, 10))
    for (cx, cy, r) in blobs:
        can.ellipse(cx, cy, r, r * 0.92, "q")
    can.rim("q", "Q", 4, dirs=((1, 0), (0, 1), (1, 1)))
    src2 = [row[:] for row in can.a]
    for y in range(H):
        for x in range(W):
            if src2[y][x] == "q" and any(can.get(x - d, y - d2) == "." for d, d2 in ((2, 0), (0, 2), (2, 2), (1, 1), (3, 1))):
                can.set(x, y, "x")
    for (cx, cy, r) in blobs[3:6]:
        q = Pix(W, H); q.ring(cx, cy, r - 1, (r - 1) * 0.92, "Q")
        for y in range(H):
            for x in range(W):
                if q.get(x, y) == "Q" and y > cy and can.get(x, y) == "q":
                    can.set(x, y, "Q")
    rr = rnd(9)
    for _ in range(120):
        x, y = rr.randrange(2, W - 2), rr.randrange(2, 54)
        if can.get(x, y) == "q":
            can.set(x, y, "Q" if rr.random() < 0.55 else "x")
    for vx in (12, 23, 61, 70):
        top = max(y for y in range(H) if can.get(vx, y) != ".") if any(can.get(vx, y) != "." for y in range(H)) else 0
        for y in range(top, top + 7 + vx % 5):
            can.set(vx, y, "q" if y % 3 else "Q")
    can.outline("z")
    out = Pix(W, H)
    out.paste(tr.rows(), 0, 0); out.paste(can.rows(), 0, 0)
    return out.rows()
add("atree", ancient(False)); add("atree_awake", ancient(True))

# ============================================================ small UI sprites
add("emote", [
    "..kkkkkkkkkk....",
    ".kwwwwwwwwwwk...",
    "kwwwwwrrwwwwwk..",
    "kwwwwwrrwwwwwk..",
    "kwwwwwrrwwwwwk..",
    "kwwwwwrrwwwwwk..",
    "kwwwwwwwwwwwwk..",
    "kwwwwwrrwwwwwk..",
    ".kwwwwwwwwwwk...",
    "..kkkkkwkkkkk...",
    "......kwk.......",
    ".......k........",
])
add("heart", [
    ".kk.kk.",
    "krrkrrk",
    "krirrrk",
    "krrrrrk",
    ".krrrk.",
    "..krk..",
    "...k...",
])
add("arrow_dn", [
    "kkkkkkk",
    "krrrrrk",
    ".krrrk.",
    "..krk..",
    "...k...",
])
add("stone", [
    ".kkk.",
    "kGmmk",
    "kmmMk",
    "kmMMk",
    ".kkk.",
])
add("bolt", [
    "rr..........k.",
    ".rrOOOOOOOOOGG",
    "rr..........k.",
])
add("phone", [
    ".kkkkk.",
    "kKKKKKk",
    "kCCCCCk",
    "kCcCCCk",
    "kCCCCCk",
    "kKKKKKk",
    "kKgKgKk",
    "kKKKKKk",
    "kKgKgKk",
    ".kkkkk.",
])
CROSS = Pix(17, 17)
CROSS.ring(8.5, 8.5, 7.5, 7.5, "r"); CROSS.rect(8, 0, 8, 5, "r"); CROSS.rect(8, 11, 8, 16, "r"); CROSS.rect(0, 8, 5, 8, "r"); CROSS.rect(11, 8, 16, 8, "r"); CROSS.set(8, 8, "r")
add("cross", CROSS.rows())
CANDY = Pix(16, 12)
CANDY.ellipse(8, 6, 4.5, 4, "b"); CANDY.ellipse(7, 5, 2, 1.6, "c", only="b")
CANDY.poly([(0, 2), (4, 6), (0, 10)], "c"); CANDY.poly([(16, 2), (12, 6), (16, 10)], "c")
CANDY.outline("k")
CANDY2 = Pix(16, 12); CANDY2.paste(CANDY.rows(), 0, 0)
add("candy", CANDY.rows())

def police_car(phase):
    p = Pix(44, 24)
    p.rect(3, 12, 41, 19, "w"); p.rect(3, 17, 41, 19, "k")
    p.poly([(10, 12), (14, 5), (30, 5), (34, 12)], "w")
    p.poly([(12, 12), (15, 7), (21, 7), (21, 12)], "C"); p.poly([(23, 12), (23, 7), (29, 7), (32, 12)], "C")
    p.rect(19, 2, 21, 4, "r" if phase else "R"); p.rect(23, 2, 25, 4, "W" if phase else "b")
    p.outline("k")
    for wx in (11, 33):
        p.ellipse(wx, 20, 3.5, 3.5, "k"); p.ellipse(wx, 20, 1.5, 1.5, "G")
    p.rect(4, 14, 7, 15, "y"); p.rect(38, 14, 40, 15, "r")
    for x, ch in zip(range(14, 30, 4), "POLI"):
        pass
    p.rect(13, 14, 30, 14, "b")
    return p.rows()
add("police0", police_car(0)); add("police1", police_car(1))

# ============================================================ battle: rabbit front (64x64)
def rabbit_battle(face):
    p = Pix(64, 64)
    ellipse_rot(p, 22, 16, 5.6, 14, -0.18, "w")
    ellipse_rot(p, 42, 16, 5.6, 14, 0.18, "w")
    p.ellipse(32, 50, 17, 12.5, "w")
    p.ellipse(32, 33, 19, 14.5, "w")
    p.ellipse(14.5, 37, 4.5, 4.5, "w"); p.ellipse(49.5, 37, 4.5, 4.5, "w")
    p.ellipse(20, 60, 7.5, 3.6, "w"); p.ellipse(44, 60, 7.5, 3.6, "w")
    p.rim("w", "l", 2)
    p.outline("k")
    ellipse_rot(p, 22, 17, 2.4, 10, -0.18, "i"); ellipse_rot(p, 42, 17, 2.4, 10, 0.18, "i")
    ellipse_rot(p, 22.5, 19, 1.0, 6, -0.18, "I"); ellipse_rot(p, 41.5, 19, 1.0, 6, 0.18, "I")
    # paws
    for px in (26, 38):
        q = Pix(64, 64); q.ring(px, 51, 4.2, 3.4, "G")
        for y in range(64):
            for x in range(64):
                if q.get(x, y) == "G" and y >= 51:
                    p.set(x, y, "G")
        p.set(px - 1, 54, "l"); p.set(px + 1, 54, "l")
    # foot pads
    for fx in (20, 44):
        p.ring(fx, 60, 7.5, 3.6, "k")
    # face
    if face == "normal":
        for ex in (24, 40):
            p.ellipse(ex, 33, 3.4, 4.4, "0")
            p.rect(ex - 2, 30, ex - 1, 31, "w"); p.set(ex + 1, 35, "w"); p.set(ex - 1, 36, "K")
    elif face == "aegyo":
        for ex in (24, 40):
            p.pts([(ex - 3, 35), (ex - 2, 34), (ex - 1, 33), (ex, 32), (ex + 1, 33), (ex + 2, 34), (ex + 3, 35)], "0")
    elif face == "sleep":
        for ex in (24, 40):
            p.pts([(ex - 3, 33), (ex - 2, 34), (ex - 1, 35), (ex, 35), (ex + 1, 35), (ex + 2, 34), (ex + 3, 33)], "0")
    p.rect(31, 38, 33, 39, "I"); p.set(32, 39, "i")
    p.pts([(30, 41), (31, 42), (32, 41), (33, 42), (34, 41)], "K")
    blush = "I" if face == "aegyo" else "i"
    for bx in (18, 46):
        p.ellipse(bx, 40, 3 if face == "aegyo" else 2.5, 1.4, blush, only=("w", "l"))
    # whiskers hint
    p.pts([(12, 39), (13, 39), (12, 41), (13, 41)], "G"); p.pts([(51, 39), (52, 39), (51, 41), (52, 41)], "G")
    return p.rows()
add("rab_b", rabbit_battle("normal")); add("rab_b_aegyo", rabbit_battle("aegyo")); add("rab_b_sleep", rabbit_battle("sleep"))

# ============================================================ battle: player back (64x64)
def player_back():
    p = Pix(64, 64)
    p.poly([(4, 64), (8, 47), (18, 40), (46, 40), (56, 47), (60, 64)], "b")
    p.rim("b", "B", 3, dirs=((1, 0),))
    p.ellipse(32, 42, 13, 5, "B"); p.ring(32, 42, 13, 5, "b")
    p.rect(27, 33, 37, 39, "S")
    hair = Pix(64, 64)
    hair.ellipse(32, 21, 14, 14.5, "h")
    for (x0, x1, top) in ((19, 25, 6), (24, 31, 3), (30, 37, 2), (36, 43, 4), (41, 46, 8)):
        hair.poly([(x0, 14), ((x0 + x1) / 2, top), (x1, 14)], "h")
    hair.ellipse(17.5, 26, 2.4, 3.6, "s"); hair.ellipse(46.5, 26, 2.4, 3.6, "s")
    hair.set(17, 26, "S"); hair.set(47, 26, "S")
    for (x0, y0, x1, y1) in ((25, 9, 28, 20), (31, 6, 33, 18), (37, 9, 39, 19)):
        hair.line(x0, y0, x1, y1, "H")
    hair.rim("h", "h", 1)
    p.paste(hair.rows(), 0, 0)
    p.outline("k")
    p.line(16, 48, 15, 64, "B"); p.line(48, 48, 49, 64, "B")
    p.line(32, 47, 32, 64, "B")
    return p.rows()
add("me_b", player_back())

# ============================================================ export
def preview(path, scale=4):
    from PIL import Image
    items = list(SPR.items())
    sheet = Image.new("RGB", (1800, 2400), (190, 60, 190))
    cx, cy, rowh = 4, 4, 0
    for name, rows in items:
        w, h = len(rows[0]) * scale, len(rows) * scale
        if cx + w > 1796:
            cx, cy = 4, cy + rowh + 6; rowh = 0
        for j, r in enumerate(rows):
            for i, ch in enumerate(r):
                if ch != ".":
                    col = PAL[ch]; rgb = tuple(int(col[k:k + 2], 16) for k in (1, 3, 5))
                    for a in range(scale):
                        for b in range(scale):
                            sheet.putpixel((cx + i * scale + a, cy + j * scale + b), rgb)
        cx += w + 6; rowh = max(rowh, h)
    sheet.crop((0, 0, 1800, cy + rowh + 6)).save(path)


if __name__ == "__main__":
    font = {k: [r.replace("#", "1").replace(".", "0") for r in v] for k, v in FONT.items()}
    js = ("window.PAL=" + json.dumps(PAL, separators=(",", ":")) + ";\n"
          "window.SPRITES=" + json.dumps(SPR, separators=(",", ":")) + ";\n"
          "window.FONT=" + json.dumps(font, separators=(",", ":"), ensure_ascii=True) + ";\n")
    Path(sys.argv[1]).write_text(js)
    if len(sys.argv) > 2:
        preview(sys.argv[2])
    print(len(SPR), "sprites,", len(js) // 1024, "KB")
