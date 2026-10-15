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
    "1": "#8c9cb8", "2": "#5c6c8c", "3": "#c05818", "5": "#58f0e8",
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


def flame_poly(p, pts, outer="r", mid="P", core="y", cx=None, cy=None, k=0.6):
    """Flame from polygon pts: outer color, then shrunken copies toward (cx, cy) for mid and core."""
    if cx is None:
        cx = sum(x for x, _ in pts) / len(pts); cy = max(y for _, y in pts) - 2
    p.poly(pts, outer)
    p.poly([(cx + (x - cx) * k, cy + (y - cy) * k) for x, y in pts], mid)
    p.poly([(cx + (x - cx) * k * 0.5, cy + (y - cy) * k * 0.55) for x, y in pts], core)

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

# Walk cycle: _0 stand, _1 left foot forward, _2 right foot forward. Side view: the upper body (rows 0-16)
# sits 1 px lower and the legs fit in the last two rows. Front and back views: one foot lifted 2 rows and
# the hands swing 1 px (see SWING). Leg placeholders: @ near leg, $ far leg, % shoe.
LEGS = {
    "down": {0: ["...k@@@kk@@@k...", "...k@@k..k@@k...", "...k%%k..k%%k..."],
             1: ["...k%%%kk@@@kk..", "...kkkk..k@@k...", ".........k%%k..."],
             2: ["..kk@@@kk%%%k...", "...k@@k..kkkk...", "...k%%k........."]},
    "left": {0: ["....k@@@@@k.....", "....k@@k@@k.....", "....k%%k%%k....."],
             1: ["...k@@kk$$$k....", "..k%%%k.k%%k...."],
             2: ["...k$$kk@@@k....", "..k%%%k.k%%k...."]},
}
# Front/back arm swing for frame 1 (screen-left hand up, screen-right hand down): {row: {col: char}};
# "~" copies the sleeve pixel next to the torso. Frame 2 is the mirror image.
SWING = {12: {2: "k"}, 13: {1: "k", 2: "s"}, 14: {1: "k", 2: "s", 3: "k", 13: "~", 14: "k"},
         15: {1: ".", 2: "k", 3: "k", 12: "k", 13: "s", 14: "k"}, 16: {13: "s", 14: "k"}}


def swing(upper, f):
    u = [list(r) for r in upper]
    for row, cols in SWING.items():
        for c, ch in cols.items():
            cc = c if f == 1 else 15 - c
            if ch == "~":
                ch = upper[row][cc - 1 if cc > 7 else cc + 1]
            u[row][cc] = ch
    return ["".join(r) for r in u]


def person(prefix, down, up, left, leg="K", far="0", shoe="R", arms=None, swing_arms=False):
    """Add <prefix>_{down,up,left}_{0,1,2} from 17-row upper bodies; arms = {f: {row: str}} for left."""
    tr = lambda r: r.replace("@", leg).replace("$", far).replace("%", shoe)
    for d, upper in (("down", down), ("up", up), ("left", left)):
        assert len(upper) == 17, (prefix, d, len(upper))
        L = LEGS["left" if d == "left" else "down"]
        add(f"{prefix}_{d}_0", list(upper) + [tr(r) for r in L[0]])
        for f in (1, 2):
            u = list(upper)
            if d == "left":
                for row, r in (arms or {}).get(f, {}).items():
                    u[row] = r
                add(f"{prefix}_{d}_{f}", ["." * 16] + u + [tr(r) for r in L[f]])
            else:
                if swing_arms:
                    u = swing(u, f)
                legs = [tr(r) for r in L[f]]
                if not swing_arms:
                    legs[0] = legs[0][:2] + "." + legs[0][3:13] + "." + legs[0][14:]
                add(f"{prefix}_{d}_{f}", u + legs)


P_LEFT2 = P_LEFT[:13] + ["...kbbBbbbbk....", "...kbbBbbBbk....", "...kbbsbbBbk....", "....kKKKKKk....."]
P_ARMS = {1: {13: "...kbbbBbbbk....", 14: "...kbbbbBBbk....", 15: "...kbbbbbbBsk..."},
          2: {13: "...kbBbbbbbk....", 14: "...kBbbbbbBk....", 15: "..ksbbbbbbBk...."}}
person("p", P_DOWN[:17], P_UP[:17], P_LEFT2, arms=P_ARMS, swing_arms=True)

# PhD candidate: messier hair, glasses, white lab coat over the blue shirt
D_DOWN = [
    "......kkkk.k....",
    "....kkhhhhkhk...",
    "..kkhhhHHhhhhk..",
    ".khhhHhhhhHhhkk.",
    "..khhhhhhhhhhk..",
    ".khhhhhhhhhhhhk.",
    ".khhhshhsshhhhk.",
    ".khhsssssssshhk.",
    "..kskkksskkksk..",
    "..kskcksskcksk..",
    "...kssssssssk...",
    "....kkSSSSkk....",
    "...kwlbwwblwk...",
    "..kwwlbbbblwwk..",
    ".kswwlbbbblwwsk.",
    ".kskwlbbbblwksk.",
    "..kkwlKKKKlwkk..",
]
D_UP = [
    "....k.kkkk......",
    "...khkhhhhkk....",
    "..khhhhhhhhhkk..",
    ".kkhhhhHHhhhhhk.",
    "..khhhHhhHhhhk..",
    ".khhhhhhhhhhhhk.",
    ".khhhhhHHhhhhhk.",
    ".khhHhhhhhhHhhk.",
    "..khhhhhhhhhhk..",
    "..kshhhhhhhhsk..",
    "...khhhhhhhhk...",
    "....kkSSSSkk....",
    "...kwwwwwwwwk...",
    "..kwwwwllwwwwk..",
    ".kswwwwllwwwwsk.",
    ".kskwwwllwwwksk.",
    "..kklwwllwwlkk..",
]
D_LEFT = [
    "......kkkk.k....",
    "....kkhhhhkhk...",
    "...khhhhhhhhk...",
    "..khhhHHhhhhhkk.",
    "..khhHhhhhhhhk..",
    ".khhhhhhhhhhhk..",
    ".kshshhhhhhhhk..",
    ".kssssshhhhhhk..",
    ".kkckkshhshhhk..",
    "..kssssshhhhk...",
    "...kkssssshk....",
    "....kSSSkkk.....",
    "....kbwwwwk.....",
    "...kbwwwwwwk....",
    "...kbwlwwlwk....",
    "...kbwswwlwk....",
    "....kKKKKwwk....",
]
D_ARMS = {1: {13: "...kbwwlwwwk....", 14: "...kbwwwllwk....", 15: "...kbwwwwlwsk..."},
          2: {13: "...kblwwwwwk....", 14: "...klwwwwlwk....", 15: "..kswwwwwlwk...."}}
person("d", D_DOWN, D_UP, D_LEFT, arms=D_ARMS, swing_arms=True)

# asylum orderly: buzz cut, broad shoulders, white scrubs, keys on the belt
ORD_DOWN = [
    "................",
    ".....kkkkkk.....",
    "....kTTTTTTk....",
    "...kTTtTTTtTk...",
    "...kTTTTTTTTk...",
    "...kooooooook...",
    "...kokkookkok...",
    "...kokooookok...",
    "...kooooooook...",
    "...koooOOoook...",
    "....kkOooOkk....",
    "..kkwwkOOkwwkk..",
    ".kwwwwlOOlwwwwk.",
    "kowwwwwwwwwwwwok",
    "koowwwwwwwwwwook",
    "kOokllwwwwllkoOk",
    ".kkkllkyykllkkk.",
]
ORD_UP = [
    "................",
    ".....kkkkkk.....",
    "....kTTTTTTk....",
    "...kTTTTTTTTk...",
    "...kTTtTTtTTk...",
    "...kTTTTTTTTk...",
    "...kTTTTTTTTk...",
    "..kokTTTTTTkok..",
    "...kTTTTTTTTk...",
    "...kOooooooOk...",
    "....kkOOOOkk....",
    "..kkwwwwwwwwkk..",
    ".kwwwwwwwwwwwwk.",
    "kowwwwwllwwwwwok",
    "koowwwwllwwwwook",
    "kOokwwwwwwwwkoOk",
    ".kkkllllllllkkk.",
]
ORD_LEFT = [
    "................",
    "......kkkkk.....",
    ".....kTTTTTk....",
    "....kTTtTTTTk...",
    "....kTTTTTTTk...",
    "...kooooTTTTk...",
    "...kkkooTTTTk...",
    "..kokooooOTTk...",
    "..koooooOoTTk...",
    "...kkoooooTk....",
    "....kooooOk.....",
    "....kOOwwwwk....",
    "...kwwwwwwwwk...",
    "...kwwwlwwwwk...",
    "...kwwwowwwlk...",
    "...kwwwOwwwlk...",
    "....kyylllllk...",
]
ORD_ARMS = {1: {13: "...kwwwwlwwwk...", 14: "...kwwwwwowlk...", 15: "...kwwwwwwOok..."},
            2: {13: "...kwwlwwwwwk...", 14: "...kwowwwwwlk...", 15: "..kOowwwwwwlk..."}}
person("ord", ORD_DOWN, ORD_UP, ORD_LEFT, leg="l", far="G", shoe="p", arms=ORD_ARMS)

# asylum nurse: white cap, brown hair in a bun, white tunic and trousers
NUR_DOWN = [
    "......kkkk......",
    ".....kwwrwk.....",
    "....kkwwwwkk....",
    "...kTkkkkkkTk...",
    "..kTTTtTTTTTTk..",
    ".kTTTTTTTTTTTTk.",
    ".kTTTssssssTTTk.",
    ".kTTssssssssTTk.",
    "..kskksssskksk..",
    "..kssksssskssk..",
    "...kssssssssk...",
    "....kkSSSSkk....",
    "...kwwwrwwwwk...",
    "..kwwwwwwwwlwk..",
    ".kswwwwwwwwllsk.",
    ".kskwwwwwwwlksk.",
    "..kkllllllllkk..",
]
NUR_UP = [
    "......kkkk......",
    ".....kwwwwk.....",
    "....kkwwwwkk....",
    "...kTkkkkkkTk...",
    "..kTTTTkkTTTTk..",
    ".kTTTTktTkTTTTk.",
    ".kTTTktttTkTTTk.",
    ".kTTTkttTTkTTTk.",
    "..kTTTkkkkTTTk..",
    "..ksTTTTTTTTsk..",
    "...kTTTTTTTTk...",
    "....kkSSSSkk....",
    "...kwwwwwwwwk...",
    "..kwwwwllwwwwk..",
    ".kswwwwllwwwlsk.",
    ".kskwwwwwwwlksk.",
    "..kkllllllllkk..",
]
NUR_LEFT = [
    "......kkkk......",
    ".....kwwwwk.....",
    "....kkkkkkkk....",
    "...kTTTTTTTTk...",
    "..kTTTttTTTTkk..",
    ".kTTTTTTTTTkTTk.",
    ".ksssTTTTTTktTk.",
    ".kssssTTTTTkTTk.",
    ".kskssTTsTTTkk..",
    "..ksssssTTTTk...",
    "...kkssssTTk....",
    "....kSSSkkk.....",
    "....kwwwwwk.....",
    "...kwwwwwwwk....",
    "...kwwwlwwlk....",
    "...kwwsklwlk....",
    "....klllllk.....",
]
NUR_ARMS = {1: {13: "...kwwwwlwwk....", 14: "...kwwwwwlwk....", 15: "...kwwwwwlsk...."},
            2: {13: "...kwwlwwwwk....", 14: "...klwwwwwlk....", 15: "..kswwwwwwlk...."}}
person("nur", NUR_DOWN, NUR_UP, NUR_LEFT, leg="w", far="G", shoe="l", arms=NUR_ARMS)

# women in long dresses (standing frame only). Placeholders: # hair, = hair shade, @ dress, $ dress shade,
# & collar, % shoes.
F_DOWN = [
    "......kkkk......",
    "....kk####kk....",
    "...k########k...",
    "..k###=#####=k..",
    "..k##########k..",
    ".k############k.",
    ".k##ssssssss##k.",
    ".k#ssssssssss#k.",
    ".k#skksssskks#k.",
    ".k#ssksssskss#k.",
    ".k##ssssssss##k.",
    ".k##kkSSSSkk##k.",
    ".k#k@@@&&@@@k#k.",
    "..k@@@@@@@@@@k..",
    ".ks@@@@@@@@@@sk.",
    ".ksk@@@@@@@@ksk.",
    "..k@@@@@@@@@@k..",
    ".k$@@@@@@@@@@$k.",
    ".k$@@@@@@@@@@$k.",
    "..kkk%%kk%%kkk..",
]
F_UP = F_DOWN[:6] + [
    ".k############k.",
    ".k#####==#####k.",
    ".k############k.",
    ".k###=####=###k.",
    ".k############k.",
    ".k############k.",
    ".kk##########kk.",
    "..k@@@@@@@@@@k..",
    ".ks@@@@@@@@@@sk.",
    ".ksk@@@@@@@@ksk.",
    "..k@@@@$$@@@@k..",
    ".k$@@@@$$@@@@$k.",
    ".k$@@@@@@@@@@$k.",
    "..kkk%%kk%%kkk..",
]
F_LEFT = [
    "......kkkk......",
    "....kk####kk....",
    "...k########k...",
    "..k###==#####k..",
    "..k##=#######k..",
    ".k###########k..",
    ".ksss########k..",
    ".kssss########k.",
    ".kkkss##s#####k.",
    "..kssss#######k.",
    "...kksss######k.",
    "....kSSSkk###k..",
    "....k@@@@@k#k...",
    "...k@@@@@@@k....",
    "...k@@s@@$$k....",
    "...k@@Sk@$$k....",
    "...k@@@@@@$k....",
    "..k@@@@@@@@$k...",
    "..k$@@@@@@$$k...",
    "...kk%%kkkkk....",
]


def lady(prefix, hair, hair2, dress, dress2, collar, shoe, scarf=None, edits=None):
    for d, rows in (("down", F_DOWN), ("up", F_UP), ("left", F_LEFT)):
        out = []
        for y, r in enumerate(rows):
            h1, h2 = (scarf if scarf and y < 6 else (hair, hair2))
            out.append(r.replace("#", h1).replace("=", h2).replace("@", dress).replace("$", dress2)
                        .replace("&", collar).replace("%", shoe))
        q = Pix(16, 20); q.a = [list(r) for r in out]
        for (x, y, c) in (edits or {}).get(d, ()):
            q.set(x, y, c)
        add(f"{prefix}_{d}_0", q.rows())


# Cinderella: headscarf, blonde hair, patched gray-blue dress
lady("cin", "y", "Y", "1", "2", "w", "T", scarf=("A", "t"), edits={
    "down": [(4, 16, "A"), (5, 16, "A"), (10, 18, "o"), (9, 13, "2"), (12, 4, "t"), (13, 5, "t")],
    "up": [(7, 3, "t"), (8, 3, "t"), (7, 4, "k"), (8, 4, "k"), (5, 17, "A"), (6, 17, "A"), (10, 14, "o")],
    "left": [(11, 3, "t"), (12, 4, "t"), (13, 3, "t"), (5, 17, "A"), (6, 17, "A"), (8, 13, "2")]})
# Prudence: ginger updo, lilac dress, nose up, pink fan
lady("sisp", "P", "O", "U", "v", "i", "v", edits={
    "down": [(2, 13, "i"), (1, 13, "k"), (2, 12, "i"), (1, 12, "k"), (3, 12, "k"), (4, 8, "k"), (11, 8, "k"),
             (4, 7, "s"), (11, 7, "s")],
    "up": [(7, 0, "P"), (8, 0, "P"), (6, 0, "k"), (9, 0, "k"), (7, 1, "O")],
    "left": [(1, 7, "s"), (0, 7, "k"), (1, 6, "k"), (2, 14, "i"), (1, 14, "i"), (0, 14, "k"), (1, 13, "k"),
             (2, 13, "i"), (2, 12, "k")]})
# Griselda: black bun, dark green dress, scowl
lady("sisd", "h", "H", "F", "z", "z", "k", edits={
    "down": [(4, 7, "k"), (5, 8, "k"), (11, 7, "k"), (10, 8, "k"), (4, 8, "s"), (11, 8, "s"), (7, 10, "k"),
             (8, 10, "k")],
    "up": [(6, 0, "k"), (7, 0, "h"), (8, 0, "h"), (9, 0, "k")],
    "left": [(2, 7, "k"), (3, 8, "k"), (2, 8, "s"), (1, 10, "k")]})

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
add("ftall", [r.translate(str.maketrans("nNqQz", "fFQzz")) for r in TALL])

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

# ============================================================ cave (16x16 tiles, 80x48 front)
def boulder(p, cx, cy, rx, ry, base="t", shade="T", hi="A", ol="k"):
    q = Pix(p.w, p.h)
    q.ellipse(cx, cy, rx, ry, base); q.rim(base, shade, 2)
    q.ellipse(cx - rx * 0.3, cy - ry * 0.35, rx * 0.45, ry * 0.35, hi, only=(base,))
    q.outline(ol)
    p.paste(q.rows(), 0, 0)


def cave_wall(seed, torch=None):
    p = Pix(16, 16, "u")
    r = rnd(seed)
    blobs = ((3, 3, 4.5, 3.5), (12, 3, 4.5, 3.5), (7.5, 8, 5, 3.6), (2, 13, 4, 3.5), (13, 13, 4.5, 3.5))
    for (cx, cy, rx, ry) in blobs:
        boulder(p, cx + r.choice((-1, 0, 1)), cy + r.choice((0, 1)), rx, ry)
    for _ in range(3):
        x, y = r.randrange(16), r.randrange(16)
        if p.get(x, y) == "t": p.set(x, y, "T")
    if torch is not None:
        p.rect(6, 9, 9, 10, "T"); p.rect(7, 11, 8, 13, "T"); p.rect(5, 8, 10, 8, "k")
        fl = [(7, 7), (8, 7), (7, 6), (8, 6), (7, 5), (8, 4), (6, 7), (9, 7)] if torch == 0 else \
             [(7, 7), (8, 7), (7, 6), (8, 6), (8, 5), (7, 4), (6, 7), (9, 6)]
        for (x, y) in fl:
            p.set(x, y, "P")
        p.set(7, 7, "y"); p.set(8, 7, "y"); p.set(7 if torch else 8, 6, "y")
        p.set(6 if torch else 9, 5 if torch else 4, "r")
    return p.rows()
add("cwall", cave_wall(1)); add("cwall2", cave_wall(4))
add("ctorch0", cave_wall(7, 0)); add("ctorch1", cave_wall(7, 1))


def cave_floor(seed):
    p = Pix(16, 16, "a")
    r = rnd(seed)
    for _ in range(7):
        x, y = r.randrange(16), r.randrange(16)
        p.set(x, y, "D")
    for _ in range(5):
        x, y = r.randrange(16), r.randrange(16)
        p.set(x, y, "O")
    for _ in range(2):
        x, y = r.randrange(1, 14), r.randrange(2, 15)
        p.set(x, y, "D"); p.set(x + 1, y, "D"); p.set(x, y + 1, "O"); p.set(x + 1, y + 1, "O")
    if seed % 2 == 0:
        x0, y0 = r.randrange(2, 9), r.randrange(3, 10)
        for i in range(5):
            p.set(x0 + i, y0 + (i % 3 == 1), "O")
    return p.rows()
add("cfloor", cave_floor(1)); add("cfloor2", cave_floor(2))


def cave_bones():
    p = Pix(16, 16); p.a = [list(r) for r in cave_floor(3)]
    q = Pix(16, 16)
    q.line(3, 11, 11, 6, "w"); q.line(3, 12, 11, 7, "l")
    for (x, y) in ((2, 11), (3, 13), (11, 5), (12, 7)):
        q.ellipse(x + 0.5, y + 0.5, 1.6, 1.6, "w")
    q.ellipse(12, 12, 2.5, 2, "w"); q.set(11, 12, "0"); q.set(13, 12, "0")
    q.outline("k"); p.paste(q.rows(), 0, 0)
    return p.rows()
add("cbones", cave_bones())


def cave_exit():
    p = Pix(16, 16); p.a = [list(r) for r in cave_floor(5)]
    for y in range(16):
        t = y / 15
        for x in range(16):
            if abs(x - 7.5) < 4 + t * 2.5:
                p.set(x, y, "d" if y > 9 else "D" if y > 4 else p.get(x, y))
    for (cx, cy, rx, ry) in ((1, 4, 3.5, 4.5), (14, 4, 3.5, 4.5), (0, 12, 2.6, 4), (15, 12, 2.6, 4)):
        boulder(p, cx, cy, rx, ry)
    for (x, y) in ((6, 12), (9, 14), (8, 10)):
        p.set(x, y, "D")
    return p.rows()
add("cexit", cave_exit())


def cave_front():
    W, H = 80, 48
    p = Pix(W, H, "u")
    r = rnd(12)
    rocks = [(8, 20, 9, 7), (24, 16, 10, 7), (44, 14, 11, 7), (63, 17, 10, 7), (75, 22, 7, 7),
             (4, 34, 7, 7), (17, 33, 9, 8), (62, 33, 9, 8), (76, 37, 6, 7), (10, 45, 9, 5), (24, 44, 8, 5),
             (56, 44, 8, 5), (70, 45, 9, 5), (34, 27, 6, 5), (47, 27, 6, 5)]
    for (cx, cy, rx, ry) in rocks:
        boulder(p, cx, cy, rx, ry)
    # canopy over the top edge, joining the tree tiles on both sides
    can = Pix(W, H)
    for (cx, cy, rr) in ((4, 2, 8), (17, 0, 9), (31, 3, 8), (44, 0, 9), (57, 3, 8), (70, 0, 9), (80, 3, 7)):
        can.ellipse(cx, cy, rr, rr * 0.8, "q")
    can.rim("q", "Q", 2)
    for y in range(H):
        for x in range(W):
            if can.get(x, y) == "q" and (can.get(x - 1, y - 1) == "." or y < 2) and r.random() < 0.6:
                can.set(x, y, "x")
    can.outline("z")
    p.paste(can.rows(), 0, 0)
    # mouth (walkable tile x 32..47, y 32..47)
    m = Pix(W, H)
    m.ellipse(40, 34, 10, 13, "0"); m.rect(30, 34, 49, 47, "0")
    m.outline("k")
    arch = Pix(W, H)
    arch.ring(40, 34, 12, 15, "T"); arch.ring(40, 34, 11, 14, "t")
    p.paste(arch.rows(), 0, 0)
    p.paste(m.rows(), 0, 0)
    for (x, y, l) in ((34, 23, 3), (38, 22, 4), (43, 22, 3), (46, 25, 2)):
        p.rect(x, y, x, y + l - 1, "u"); p.set(x, y + l, "T")
    for y in range(38, 48):
        for x in range(31, 49):
            if p.get(x, y) == "0" and (x + y) % 5 == 0 and y > 42:
                p.set(x, y, "h")
    return p.rows()
add("cave", cave_front())

# ============================================================ asylum tiles (16x16)
def asylum_floor(variant):
    p = Pix(16, 16, "w")
    p.rect(0, 15, 15, 15, "l"); p.rect(15, 0, 15, 15, "l"); p.rect(0, 7, 15, 7, "l"); p.rect(7, 0, 7, 15, "l")
    if variant:
        p.ellipse(11.5, 11.5, 2, 2, "G"); p.ellipse(11.5, 11.5, 1, 1, "g")
        p.set(10, 11, "M"); p.set(12, 12, "M"); p.set(11, 12, "M")
        p.set(3, 3, "l"); p.set(4, 4, "l")
    return p.rows()
add("afloor", asylum_floor(0)); add("afloor2", asylum_floor(1))


def asylum_wall():
    p = Pix(16, 16, "G")
    for (cx, cy) in ((4, 4), (12, 4), (0, 12), (8, 12), (16, 12), (4, 20), (12, 20), (0, -4), (8, -4), (16, -4)):
        q = Pix(16, 16)
        q.poly([(cx, cy - 3.6), (cx + 3.6, cy), (cx, cy + 3.6), (cx - 3.6, cy)], "l")
        q.poly([(cx - 0.5, cy - 3), (cx + 1, cy - 1), (cx - 0.5, cy + 0.5), (cx - 2.5, cy - 0.5)], "w")
        p.paste(q.rows(), 0, 0)
    for (cx, cy) in ((0, 0), (8, 0), (16, 0), (4, 8), (12, 8), (0, 16), (8, 16), (16, 16)):
        p.set(cx, cy, "g")
    return p.rows()
add("awall", asylum_wall())


def asylum_bed():
    p = Pix(16, 16); p.a = [list(r) for r in asylum_floor(0)]
    q = Pix(16, 16)
    q.rect(2, 0, 13, 15, "m"); q.rect(3, 1, 12, 14, "w")
    q.rect(4, 2, 11, 4, "l"); q.rect(4, 2, 11, 2, "w")
    q.rect(3, 6, 12, 14, "1"); q.rect(3, 6, 12, 6, "c"); q.rect(3, 13, 12, 14, "2")
    q.rect(2, 9, 13, 10, "p"); q.set(7, 9, "g"); q.set(8, 10, "g")
    q.outline("k")
    p.paste(q.rows(), 0, 0)
    return p.rows()
add("abed", asylum_bed())


def asylum_desk():
    p = Pix(16, 16); p.a = [list(r) for r in asylum_floor(0)]
    q = Pix(16, 16)
    q.rect(0, 3, 15, 11, "G"); q.rect(0, 10, 15, 11, "g"); q.rect(1, 12, 2, 15, "M"); q.rect(13, 12, 14, 15, "M")
    q.rect(0, 3, 15, 3, "l")
    q.outline("k")
    q.rect(3, 4, 7, 9, "w"); q.rect(3, 4, 7, 4, "M"); q.rect(4, 6, 6, 6, "G"); q.rect(4, 8, 6, 8, "G")
    q.rect(10, 5, 12, 8, "K"); q.rect(10, 5, 12, 5, "p"); q.set(11, 4, "k"); q.set(12, 3, "k"); q.set(11, 7, "r")
    p.paste(q.rows(), 0, 0)
    return p.rows()
add("adesk", asylum_desk())


def asylum_bars(door):
    p = Pix(16, 16, "l")
    for y in range(16):
        for x in range(16):
            if (x + y * 2) % 7 == 0: p.set(x, y, "G")
    p.rect(0, 0, 15, 1, "p"); p.rect(0, 0, 15, 0, "k"); p.rect(0, 1, 15, 1, "M")
    p.rect(0, 13, 15, 15, "p"); p.rect(0, 13, 15, 13, "M"); p.rect(0, 15, 15, 15, "k")
    for x in range(1, 16, 4):
        p.rect(x, 2, x + 1, 12, "M"); p.rect(x, 2, x, 12, "G"); p.rect(x + 2, 2, x + 2, 12, "k")
    if door:
        p.rect(0, 0, 1, 15, "K"); p.rect(14, 0, 15, 15, "K"); p.rect(0, 0, 0, 15, "k"); p.rect(15, 0, 15, 15, "k")
        p.rect(2, 6, 13, 7, "p"); p.rect(2, 6, 13, 6, "M")
        p.rect(10, 8, 12, 11, "y"); p.rect(10, 11, 12, 11, "Y"); p.set(11, 9, "k"); p.set(11, 10, "k")
        p.rect(9, 8, 9, 11, "k"); p.rect(13, 8, 13, 11, "k")
    return p.rows()
add("acell", asylum_bars(False)); add("acelldoor", asylum_bars(True))


def asylum_doorway():
    p = Pix(16, 16); p.a = [list(r) for r in asylum_floor(0)]
    p.rect(0, 0, 15, 15, "g"); p.rect(1, 0, 14, 15, "k")
    p.rect(2, 0, 13, 15, "0")
    for y, c in ((10, "K"), (12, "p"), (14, "M")):
        p.rect(2, y, 13, y + 1, c)
    p.rect(4, 2, 11, 5, "N"); p.rect(4, 2, 11, 2, "n"); p.rect(3, 2, 3, 5, "k"); p.rect(12, 2, 12, 5, "k")
    p.rect(3, 1, 12, 1, "k"); p.rect(3, 6, 12, 6, "k")
    for x in (5, 7, 9):
        p.set(x, 4, "w")
    p.set(10, 3, "w"); p.set(10, 4, "j")
    return p.rows()
add("adoorway", asylum_doorway())


# ============================================================ dig spots (16x16 overlays)
def dig_spot(state):
    p = Pix(16, 16)
    if state == "dug":
        p.ellipse(8, 10, 5, 3.2, "u"); p.ellipse(8, 10.5, 3.8, 2.3, "0")
        q = Pix(16, 16); q.ellipse(13, 6, 2.6, 1.8, "O"); q.ellipse(12.5, 5.5, 1.2, 0.8, "a", only=("O",)); q.outline("T")
        p.paste(q.rows(), 0, 0)
        p.set(3, 6, "O"); p.set(4, 5, "a")
        return p.rows()
    p.ellipse(8, 10, 4.6, 2.6, "O")
    p.ellipse(7, 9.5, 2.8, 1.4, "a", only=("O",))
    p.set(6, 9, "D"); p.set(9, 10, "D")
    p.line(5, 10, 7, 11, "u"); p.line(9, 9, 11, 11, "u"); p.set(8, 11, "u")
    p.set(3, 12, "O"); p.set(13, 8, "O"); p.set(12, 12, "a")
    if state == "dig1":
        for (x, y, c) in ((11, 4, "y"), (11, 2, "w"), (11, 3, "y"), (11, 5, "y"), (11, 6, "w"), (9, 4, "w"),
                          (10, 4, "y"), (12, 4, "y"), (13, 4, "w"), (11, 4, "w")):
            p.set(x, y, c)
    return p.rows()
add("dig0", dig_spot("dig0")); add("dig1", dig_spot("dig1")); add("dug", dig_spot("dug"))

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


def ancient_fire(frame):
    """The awake ancient tree with its canopy on fire; frames 0/1 alternate the flames."""
    W, H = 80, 96
    base = Pix(W, H); base.a = [list(r) for r in ancient(True)]
    r = rnd(40 + frame)
    canopy_y = 58
    for y in range(H):
        for x in range(W):
            c = base.get(x, y)
            if y < canopy_y or c in "qQz":
                if c == "q": base.set(x, y, "P")
                elif c == "Q": base.set(x, y, "r")
                elif c == "x": base.set(x, y, "y")
                elif c == "z": base.set(x, y, "R")
    # leftover leaves
    for _ in range(14):
        x, y = r.randrange(6, 74), r.randrange(6, 50)
        if base.get(x, y) == "P": base.set(x, y, "q"); base.set(x + 1, y, "Q")
    # flame tongues on the shoulders and inside the blaze
    fl = Pix(W, H)
    off = 3 if frame else 0
    for (x, y, h, w) in ((6 + off, 30, 12, 5), (14 - off, 13, 12, 6), (24 + off, 6, 9, 5), (56 - off, 6, 9, 5),
                         (66 + off, 13, 12, 6), (74 - off, 30, 12, 5), (40 + off, 4, 4, 4)):
        top = max(0, y - h)
        flame_poly(fl, [(x - w, y + 2), (x - w + 1, y - h * 0.4), (x - 1, y - h * 0.55), (x + (1 if frame else -1), top),
                        (x + 2, y - h * 0.6), (x + w - 1, y - h * 0.35), (x + w, y + 2)], cx=x, cy=y)
    for (x, y) in ((20 + off, 32), (40 - off, 24), (60 + off, 32), (31 - off, 46), (50 + off, 46)):
        flame_poly(fl, [(x - 6, y + 5), (x - 4, y - 3), (x - 2, y - 8), (x + (2 if frame else -1), y - 14), (x + 2, y - 6),
                        (x + 5, y - 2), (x + 6, y + 5)], outer="y", mid="y", core="w", cx=x, cy=y + 3, k=0.45)
    base.paste(fl.rows(), 0, 0)
    # angry brows
    for ex in (31, 44):
        base.rect(ex - 1, 62, ex + 5, 63, "T")
    base.line(29, 60, 36, 63, "0"); base.line(51, 60, 44, 63, "0")
    base.line(29, 61, 36, 64, "u"); base.line(51, 61, 44, 64, "u")
    for ex in (31, 44):
        base.rect(ex + 1, 65, ex + 3, 66, "r"); base.set(ex + 2, 65, "y")
    base.ellipse(40, 77.5, 5, 3.6, "R"); base.ellipse(40, 78.5, 3, 2, "P"); base.set(40, 79, "y")
    return base.rows()
add("atree_fire0", ancient_fire(0)); add("atree_fire1", ancient_fire(1))


def firetree_front():
    p = Pix(64, 64)
    # trunk
    t = Pix(64, 64)
    t.poly([(16, 20), (48, 20), (50, 44), (58, 58), (64, 64), (0, 64), (6, 58), (14, 44)], "t")
    t.poly([(14, 44), (3, 36), (0, 27), (3, 27), (5, 32), (6, 24), (9, 25), (9, 33), (16, 37)], "t")
    t.poly([(50, 44), (61, 36), (64, 27), (61, 27), (59, 32), (58, 24), (55, 25), (55, 33), (48, 37)], "t")
    t.rim("t", "T", 3)
    for y in range(64):
        for x in range(64):
            if t.get(x, y) == "t" and t.get(x - 2, y) == ".":
                t.set(x, y, "A")
    for (x, y0, y1) in ((20, 46, 58), (44, 46, 60), (32, 56, 63), (26, 22, 28), (38, 22, 27)):
        t.rect(x, y0, x, y1, "T")
    t.outline("k")
    p.paste(t.rows(), 0, 0)
    # blazing canopy
    c = Pix(64, 64)
    for (cx, cy, rr) in ((12, 14, 10), (32, 10, 14), (52, 14, 10), (22, 20, 9), (42, 20, 9)):
        c.ellipse(cx, cy, rr, rr * 0.8, "P")
    c.rim("P", "r", 3)
    rr_ = rnd(77)
    for _ in range(8):
        x, y = rr_.randrange(4, 60), rr_.randrange(4, 22)
        if c.get(x, y) == "P": c.set(x, y, "q"); c.set(x + 1, y, "Q")
    c.outline("R")
    for (x, y, h) in ((7, 12, 11), (19, 9, 9), (32, 10, 10), (45, 9, 9), (57, 12, 11)):
        flame_poly(c, [(x - 5, y + 4), (x - 3, y - h * 0.4), (x - 1, y - h * 0.6), (x + 1, y - h), (x + 2, y - h * 0.5),
                       (x + 4, y - h * 0.3), (x + 5, y + 4)], outer="r", mid="P", core="y", cx=x, cy=y + 2)
    for (x, y) in ((22, 20), (42, 20), (32, 14)):
        flame_poly(c, [(x - 4, y + 4), (x - 2, y - 3), (x, y - 8), (x + 2, y - 3), (x + 4, y + 4)], outer="y", mid="y",
                   core="w", cx=x, cy=y + 2, k=0.45)
    p.paste(c.rows(), 0, 0)
    # face
    for (ex, sgn) in ((24, -1), (40, 1)):
        p.ellipse(ex, 34, 5, 3.4, "u")
        p.ellipse(ex, 34.5, 3, 2.2, "y"); p.rect(ex - 1, 34, ex + 1, 35, "r"); p.set(ex, 34, "0")
    p.line(17, 27, 29, 32, "0"); p.line(17, 28, 29, 33, "0")
    p.line(47, 27, 35, 32, "0"); p.line(47, 28, 35, 33, "0")
    p.ellipse(32, 49, 9, 7, "0")
    p.ellipse(32, 52, 6.5, 3.5, "R"); p.ellipse(32, 53, 4, 2, "P"); p.rect(31, 53, 33, 53, "y")
    for x in (25, 29, 33, 37):
        p.poly([(x, 42), (x + 3, 42), (x + 1.5, 46)], "A")
    for x in (27, 31, 35):
        p.poly([(x, 56), (x + 3, 56), (x + 1.5, 52)], "A")
    p.ring(32, 49, 9, 7, "k")
    p.rect(30, 38, 34, 39, "T")
    return p.rows()
add("firetree_f", firetree_front())

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

# ============================================================ battle fronts: creatures (64x64)
def fox_front():
    p = Pix(64, 64)
    ellipse_rot(p, 50, 40, 7.5, 17, 0.45, "P")
    p.ellipse(31, 48, 14, 13, "P")
    p.ellipse(20, 54, 7, 8, "P"); p.ellipse(42, 54, 7, 8, "P")
    p.rect(24, 46, 28, 61, "P"); p.rect(34, 46, 38, 61, "P")
    p.ellipse(30, 24, 13, 11, "P")
    p.poly([(17, 22), (15, 1), (28, 15)], "P"); p.poly([(32, 15), (45, 1), (43, 22)], "P")
    p.poly([(18, 24), (11, 33), (23, 31)], "P"); p.poly([(42, 24), (49, 33), (37, 31)], "P")
    p.rim("P", "3", 3)
    p.outline("k")
    p.poly([(19, 18), (17, 5), (25, 14)], "u"); p.poly([(35, 14), (43, 5), (41, 18)], "u")
    p.ellipse(31, 43, 7, 9, "d", only=("P", "3"))
    for x in range(25, 38, 3):
        p.set(x, 34, "d"); p.set(x + 1, 35, "d")
    p.ellipse(30, 30, 6.5, 4.2, "d", only=("P", "3"))
    p.rect(29, 27, 31, 28, "0"); p.set(29, 27, "K")
    p.pts([(27, 31), (28, 32), (29, 32), (30, 31), (31, 32), (32, 32), (33, 31)], "k")
    for ex in (23, 37):
        p.ellipse(ex, 23, 2.4, 3, "0"); p.set(ex - 1, 22, "w"); p.set(ex - 1, 21, "w"); p.set(ex + 1, 25, "3")
    for x in (29, 39):
        p.line(x, 48, x, 61, "k")
    for x in (23, 33):
        p.line(x, 50, x, 61, "k")
    for px in (26, 36):
        p.ellipse(px, 61.5, 3.2, 2, "d"); p.set(px - 1, 62, "D"); p.set(px + 1, 62, "D")
    q = Pix(64, 64)
    flame_poly(q, [(49, 26), (51, 15), (54, 19), (56, 5), (59, 17), (63, 11), (63, 24), (59, 30), (52, 30)],
               cx=56, cy=27)
    p.paste(q.rows(), 0, 0)
    return p.rows()
add("fox_f", fox_front())


def wolf_front(dire):
    body, sh, belly = ("K", "p", "p") if dire else ("m", "M", "G")
    ol = "0" if dire else "k"
    hx, hy = 32, 24 if dire else 27
    # body, tail, legs
    b = Pix(64, 64)
    ellipse_rot(b, 51, 36, 6, 15 if dire else 12, 0.7 if dire else 0.4, body)
    if dire:
        for i in range(4):
            b.poly([(54 + i * 2, 22 + i * 3), (61 + i, 18 + i * 4), (57 + i, 27 + i * 3)], body)
    b.ellipse(32, 47, 16 if dire else 13, 13, body)
    b.rect(22, 46, 27, 62, body); b.rect(37, 46, 42, 62, body)
    b.rim(body, sh, 3); b.outline(ol)
    b.ellipse(32, 46, 6, 8, belly, only=(body, sh))
    for x in (28, 43):
        b.line(x, 50, x, 62, ol)
    for x in (21, 36):
        b.line(x, 52, x, 62, ol)
    for px in (24, 39):
        for c in (-1, 1):
            b.set(px + c, 62, sh)
    layers = [b]
    if dire:
        m = Pix(64, 64)
        cx, cy = 32, 35
        m.ellipse(cx, cy, 14, 10, "p")
        for th in range(-30, 215, 15):
            t0, t1, t2 = math.radians(th - 9), math.radians(th), math.radians(th + 9)
            r1 = 20 if 30 < th < 150 else 19
            m.poly([(cx + 12 * math.cos(t0), cy + 8 * math.sin(t0)), (cx + r1 * math.cos(t1), cy + 0.8 * r1 * math.sin(t1)),
                    (cx + 12 * math.cos(t2), cy + 8 * math.sin(t2))], "p")
        m.rim("p", "K", 2)
        m.outline(ol)
        for th in range(-30, 215, 15):
            t = math.radians(th + 7)
            m.line(cx + 10 * math.cos(t), cy + 7 * math.sin(t), cx + 14 * math.cos(t), cy + 10 * math.sin(t), "K")
        layers.append(m)
    # head
    h = Pix(64, 64)
    h.ellipse(hx, hy, 12.5 if dire else 12, 10.5, body)
    if dire:
        h.poly([(19, 18), (17, 0), (28, 12)], body); h.poly([(36, 12), (47, 0), (45, 18)], body)
        h.ellipse(hx, hy + 9, 7.5, 6, body)
        for sgn in (-1, 1):
            h.poly([(hx + sgn * 10, hy - 2), (hx + sgn * 17, hy + 5), (hx + sgn * 12, hy + 4), (hx + sgn * 14, hy + 9),
                    (hx + sgn * 8, hy + 7)], body)
    else:
        h.poly([(21, 20), (19, 4), (29, 15)], body); h.poly([(35, 15), (45, 4), (43, 20)], body)
        h.ellipse(hx, hy + 8, 6, 5.5, body)
        for sgn in (-1, 1):
            h.poly([(hx + sgn * 10, hy + 1), (hx + sgn * 15, hy + 8), (hx + sgn * 11, hy + 6), (hx + sgn * 12, hy + 10),
                    (hx + sgn * 7, hy + 7)], body)
    h.rim(body, sh, 2); h.outline(ol)
    if dire:
        h.poly([(21, 16), (19, 4), (26, 12)], "R"); h.poly([(38, 12), (45, 4), (43, 16)], "R")
        h.ellipse(hx, hy + 10, 6, 4, "0")
        h.rect(hx - 5, hy + 7, hx + 5, hy + 7, "R"); h.rect(hx - 4, hy + 13, hx + 4, hy + 13, "R")
        for fx in (hx - 4, hx - 1, hx + 1, hx + 4):
            h.set(fx, hy + 8, "w"); h.set(fx, hy + 9, "w" if fx in (hx - 4, hx + 4) else "l")
        for fx in (hx - 3, hx + 3):
            h.set(fx, hy + 12, "w"); h.set(fx, hy + 11, "w")
        h.rect(hx - 2, hy + 3, hx + 2, hy + 4, "0"); h.set(hx - 1, hy + 3, "p")
        h.line(hx - 2, hy + 2, hx - 4, hy - 1, "0"); h.line(hx + 2, hy + 2, hx + 4, hy - 1, "0")
        h.poly([(hx - 10, hy - 4), (hx - 2, hy - 1), (hx - 9, hy + 1)], "r")
        h.poly([(hx + 10, hy - 4), (hx + 2, hy - 1), (hx + 9, hy + 1)], "r")
        h.set(hx - 6, hy - 1, "y"); h.set(hx + 6, hy - 1, "y")
        h.line(hx - 11, hy - 6, hx - 3, hy - 3, "0"); h.line(hx + 11, hy - 6, hx + 3, hy - 3, "0")
    else:
        h.ellipse(hx, hy + 8.5, 5, 4.2, "G", only=(body, sh))
        h.rect(hx - 2, hy + 5, hx + 2, hy + 6, "0"); h.set(hx - 1, hy + 5, "M")
        h.line(hx, hy + 7, hx, hy + 9, "k")
        h.pts([(hx - 3, hy + 10), (hx - 2, hy + 11), (hx - 1, hy + 10), (hx + 1, hy + 10), (hx + 2, hy + 11), (hx + 3, hy + 10)], "k")
        for ex in (hx - 6, hx + 6):
            h.ellipse(ex, hy - 1, 2.6, 2.8, "y"); h.rect(ex, hy - 2, ex, hy + 1, "0"); h.set(ex - 1, hy - 2, "w")
        for (x, y) in ((hx - 1, hy - 8), (hx + 1, hy - 8), (hx, hy - 9)):
            h.set(x, y, "M")
    layers.append(h)
    p = Pix(64, 64)
    for L in layers:
        p.paste(L.rows(), 0, 0)
    return p.rows()
add("wolf_f", wolf_front(False)); add("direwolf_f", wolf_front(True))

def mosquito_front():
    p = Pix(64, 64)
    # wings
    w = Pix(64, 64)
    ellipse_rot(w, 44, 15, 6.5, 15, 1.0, "l"); ellipse_rot(w, 47, 23, 5.5, 13, 1.25, "w")
    w.outline("g")
    w.line(34, 22, 56, 9, "c"); w.line(36, 26, 58, 18, "c"); w.line(40, 18, 50, 14, "G")
    p.paste(w.rows(), 0, 0)
    # legs
    lg = Pix(64, 64)
    for (x0, y0, kx, ky, x1, y1) in ((28, 36, 18, 44, 10, 62), (31, 37, 26, 48, 22, 63), (34, 37, 40, 50, 36, 63),
                                     (36, 35, 50, 46, 56, 62), (30, 35, 16, 38, 6, 46), (37, 34, 52, 38, 60, 50)):
        lg.line(x0, y0, kx, ky, "k"); lg.line(kx, ky, x1, y1, "k")
        lg.set(kx, ky, "G"); lg.set((kx + x1) // 2, (ky + y1) // 2, "G")
    p.paste(lg.rows(), 0, 0)
    # body
    b = Pix(64, 64)
    ellipse_rot(b, 46, 43, 5, 13, -0.85, "p")
    b.ellipse(32, 31, 7.5, 6.5, "p")
    b.ellipse(21, 27, 6.5, 6, "K")
    b.rim("p", "K", 2)
    b.outline("k")
    for i in range(4):
        cx, cy = 39 + i * 3.6, 37 + i * 3.4
        b.line(cx - 3, cy + 3, cx + 2, cy - 3, "K")
    ellipse_rot(b, 48, 46, 2.6, 8, -0.85, "r", only=("p", "K"))
    b.set(46, 44, "i"); b.set(47, 45, "i")
    b.pts([(30, 28), (31, 28), (34, 29), (33, 33), (29, 31)], "w")
    b.ellipse(19.5, 26.5, 4, 4.4, "R"); b.ellipse(18.5, 25.5, 2.4, 2.4, "r"); b.set(17, 24, "w"); b.set(18, 24, "w")
    p.paste(b.rows(), 0, 0)
    # antennae and proboscis
    p.line(20, 21, 13, 7, "k"); p.line(23, 21, 22, 6, "k")
    for t in range(3):
        p.set(15 - t, 12 - t * 2, "K"); p.set(17 - t, 12 - t * 2 + 1, "K"); p.set(21, 10 + t * 3, "K"); p.set(23, 10 + t * 3, "K")
    p.line(16, 31, 3, 50, "k"); p.line(17, 31, 4, 50, "K"); p.set(3, 51, "R"); p.set(2, 52, "R")
    return p.rows()
add("mosquito_f", mosquito_front())


FLY = [
    ".GG..GG.",
    "GllGGllG",
    ".GlkklG.",
    ".rkKKkr.",
    "..kKKk..",
    "...kk...",
]


def flygion_front():
    p = Pix(64, 64)
    r = rnd(21)
    face = Pix(64, 64); face.ellipse(32, 30, 27, 27, "x")
    face.poly([(14, 46), (32, 64), (50, 46)], "x")
    hole = Pix(64, 64)
    ellipse_rot(hole, 20, 24, 7.5, 4.2, 0.35, "e"); ellipse_rot(hole, 44, 24, 7.5, 4.2, -0.35, "e")
    hole.poly([(17, 43), (22, 47), (26, 44), (32, 48), (38, 44), (42, 47), (47, 43), (44, 52), (32, 55), (20, 52)], "m")
    for y in range(64):
        for x in range(64):
            if face.get(x, y) == "." or hole.get(x, y) != ".":
                continue
            edge = any(face.get(x + dx, y + dy) == "." for dx, dy in ((3, 0), (-3, 0), (0, 3), (0, -3)))
            d = 0.22 if edge else 0.5
            if r.random() < d:
                p.set(x, y, r.choice("kkKKp"))
    for y in range(64):
        for x in range(64):
            if hole.get(x, y) == "e":
                p.set(x, y, "R")
            elif hole.get(x, y) == "m":
                p.set(x, y, "0" if r.random() < 0.85 else "R")
    for (cx, cy) in ((20, 24), (44, 24)):
        p.ellipse(cx, cy, 3.2, 2, "r", only=("R",)); p.set(cx, cy, "y"); p.set(cx - 1, cy, "y")
    for (x, y, l) in ((1, 18, 4), (59, 22, 4), (2, 44, 3), (58, 46, 4), (30, 0, 4)):
        p.rect(x, y, x + l, y, "g")
    spots = [(28, 2), (13, 7), (43, 7),
             (9, 14), (19, 16), (37, 16), (47, 14),
             (3, 30), (53, 30),
             (13, 39), (24, 40), (34, 40), (45, 39),
             (21, 52), (35, 52), (28, 57)]
    for (x, y) in spots:
        p.paste(FLY, x, y)
    return p.rows()
add("flygion_f", flygion_front())

# ============================================================ battle fronts: people (64x64)
def lady_front(hair, hair2, dress, dress2, face, top="loose", scarf=None, prop=None, shoes=("T", "T"), trim=None):
    hx, hy = 32, 15
    back = Pix(64, 64)
    if top in ("loose", "scarf"):
        back.ellipse(hx, hy + 1, 10.5, 10, hair)
        back.poly([(21, 14), (43, 14), (45, 31), (40, 33), (24, 33), (19, 31)], hair)
    else:
        back.ellipse(hx, hy, 9.5, 9.5, hair)
    if top == "updo":
        back.ellipse(hx, 3, 6, 4.5, hair); back.ellipse(hx, 0, 3.5, 2.5, hair)
    if top == "bun":
        back.ellipse(hx + 7, 4, 5, 4.5, hair)
    back.rim(hair, hair2, 2); back.outline("k")
    body = Pix(64, 64)
    body.poly([(25, 37), (39, 37), (47, 50), (52, 61), (12, 61), (17, 50)], dress)
    body.poly([(24, 26), (40, 26), (39, 39), (25, 39)], dress)
    body.rect(29, 22, 35, 27, "S")
    body.ellipse(21.5, 29, 4.5, 4, dress); body.ellipse(42.5, 29, 4.5, 4, dress)
    body.rim(dress, dress2, 3)
    body.outline("k")
    arms = Pix(64, 64)
    larm_end = (17, 45)
    rarm_end = (40, 36) if prop in ("fan", "scissors") else (47, 45)
    for (x0, y0), (x1, y1) in (((20, 31), larm_end), ((44, 31), rarm_end)):
        for d in (-1, 0, 1, 2):
            arms.line(x0 + d - 0.5, y0, x1 + d - 0.5, y1, "s")
        arms.ellipse(x1 + 0.5, y1 + 1, 3, 3, "s")
    arms.rim("s", "S", 1); arms.outline("k")
    head = Pix(64, 64)
    head.ellipse(hx, hy + 1, 9, 9.5, "s")
    head.ellipse(hx - 9, hy + 3, 1.6, 2.4, "s"); head.ellipse(hx + 9, hy + 3, 1.6, 2.4, "s")
    head.rim("s", "S", 1)
    if scarf:
        sc = Pix(64, 64)
        sc.ellipse(hx, hy - 2, 11, 9, scarf[0])
        for y in range(hy - 1, 64):
            for x in range(64):
                sc.set(x, y, ".")
        sc.poly([(hx + 8, hy - 4), (hx + 14, hy - 8), (hx + 13, hy - 1)], scarf[0])
        sc.poly([(hx + 9, hy - 2), (hx + 15, hy + 2), (hx + 11, hy + 3)], scarf[0])
        sc.rim(scarf[0], scarf[1], 2)
        head.paste(sc.rows(), 0, 0)
        head.rect(hx - 8, hy - 1, hx - 5, hy - 1, hair); head.rect(hx + 3, hy - 1, hx + 7, hy - 1, hair)
    else:
        head.poly([(hx - 10, hy + 4), (hx - 10, hy - 6), (hx - 3, hy - 10), (hx + 5, hy - 10), (hx + 10, hy - 5),
                   (hx + 10, hy + 4), (hx + 7, hy - 3), (hx + 1, hy - 4), (hx - 2, hy - 2), (hx - 7, hy - 3)], hair)
        head.rim(hair, hair2, 1)
    head.outline("k")
    p = Pix(64, 64)
    for L in (back, body, arms, head):
        p.paste(L.rows(), 0, 0)
    # skirt folds, trim, waist
    for (x0, x1) in ((28, 22), (32, 32), (36, 42)):
        p.line(x0, 42, x1, 60, dress2)
    p.rect(25, 38, 39, 38, dress2)
    if trim:
        for x in range(13, 52):
            if p.get(x, 60) not in (".", "k"):
                p.set(x, 60, trim if x % 3 else "w")
        p.rect(29, 26, 35, 27, trim)
    else:
        p.rect(30, 26, 34, 26, "w")
    for (sx, c) in ((26, shoes[0]), (37, shoes[1])):
        q = Pix(64, 64); q.ellipse(sx, 62, 3.4, 1.8, c); q.outline("k")
        p.paste(q.rows(), 0, 0)
        if c == "c":
            p.set(sx - 1, 61, "w"); p.set(sx, 61, "w")
    # face
    ey = hy + 2
    if face == "soft":
        for ex in (hx - 5, hx + 3):
            p.rect(ex, ey - 1, ex + 2, ey + 2, "0"); p.set(ex, ey - 1, "w"); p.set(ex + 2, ey + 2, "b")
            p.set(ex + 1, ey + 2, "b"); p.rect(ex - (1 if ex < hx else -1), ey - 2, ex + 2 + (1 if ex > hx else 0), ey - 2, "k")
        p.pts([(hx - 1, ey + 6), (hx, ey + 7), (hx + 1, ey + 6)], "R")
        p.rect(hx - 7, ey + 4, hx - 6, ey + 4, "i"); p.rect(hx + 6, ey + 4, hx + 7, ey + 4, "i")
    elif face == "sneer":
        for ex in (hx - 6, hx + 2):
            p.rect(ex, ey, ex + 3, ey, "k"); p.rect(ex + 1, ey + 1, ex + 2, ey + 1, "r")
            p.rect(ex, ey - 1, ex + 3, ey - 1, "V")
        p.line(hx - 7, ey - 4, hx - 2, ey - 2, "k"); p.line(hx + 6, ey - 4, hx + 1, ey - 2, "k")
        p.pts([(hx - 3, ey + 6), (hx - 2, ey + 6), (hx - 1, ey + 6), (hx, ey + 6), (hx + 1, ey + 5), (hx + 2, ey + 4)], "0")
        p.set(hx, ey + 5, "w"); p.set(hx + 1, ey + 4, "w")
    elif face == "prim":
        for ex in (hx - 6, hx + 2):
            p.rect(ex, ey, ex + 3, ey, "k"); p.set(ex + (0 if ex < hx else 3), ey - 1, "k")
            p.rect(ex, ey - 3, ex + 3, ey - 3, "O")
        p.set(hx - 1, ey + 3, "O"); p.set(hx + 1, ey + 3, "O")
        p.rect(hx - 1, ey + 6, hx + 1, ey + 6, "I")
        p.rect(hx - 7, ey + 3, hx - 6, ey + 3, "i"); p.rect(hx + 6, ey + 3, hx + 7, ey + 3, "i")
    elif face == "scowl":
        for ex in (hx - 5, hx + 3):
            p.rect(ex, ey, ex + 2, ey + 1, "0"); p.set(ex + 1, ey, "w")
        p.line(hx - 7, ey - 4, hx - 2, ey - 1, "k"); p.line(hx + 7, ey - 4, hx + 2, ey - 1, "k")
        p.pts([(hx - 3, ey + 7), (hx - 2, ey + 6), (hx - 1, ey + 6), (hx, ey + 6), (hx + 1, ey + 6), (hx + 2, ey + 7)], "0")
    # props
    if prop == "broom":
        p.line(15, 6, 18, 52, "T"); p.line(16, 6, 19, 52, "t")
        q = Pix(64, 64)
        q.poly([(15, 51), (22, 51), (25, 63), (10, 63)], "Y"); q.outline("k")
        p.paste(q.rows(), 0, 0)
        for x in (13, 16, 19, 22):
            p.line(x + (1 if x > 17 else 0), 54, x + (2 if x > 17 else -1), 62, "a")
        p.ellipse(17.5, 46, 2.6, 2.6, "s"); p.set(19, 47, "S")
    if prop == "fan":
        q = Pix(64, 64)
        q.ellipse(42, 33, 9, 8, "i")
        for y in range(64):
            for x in range(64):
                if y > 34 or x < 35:
                    q.set(x, y, ".") if q.get(x, y) == "i" else None
        q.outline("I")
        p.paste(q.rows(), 0, 0)
        for a in range(0, 100, 20):
            t = math.radians(-90 + a - 10)
            p.line(41, 34, 41 + 8 * math.cos(t), 34 + 8 * math.sin(t), "I")
        p.ellipse(40.5, 37, 2.6, 2.6, "s")
    if prop == "scissors":
        p.line(40, 36, 49, 27, "G"); p.line(41, 37, 50, 30, "m"); p.set(49, 27, "w")
        p.ring(39, 38, 2, 2, "r"); p.ring(42, 39, 2, 2, "r")
    return p.rows()


add("cinderella_f", lady_front("y", "Y", "1", "2", "soft", top="scarf", scarf=("A", "t"), prop="broom",
                               shoes=("T", "c")))
CIN_F = [list(r) for r in SPR["cinderella_f"]]
for (x, y, c) in ((22, 52, "A"), (23, 52, "A"), (22, 53, "A"), (23, 53, "A"), (41, 46, "A"), (42, 46, "A"),
                  (41, 47, "A"), (42, 47, "A"), (27, 32, "A"), (28, 32, "A"), (27, 33, "A")):
    CIN_F[y][x] = c
SPR["cinderella_f"] = ["".join(r) for r in CIN_F]
add("evilrella_f", lady_front("h", "0", "V", "h", "sneer", top="scarf", scarf=("v", "V"), prop="broom",
                              shoes=("0", "0")))
add("prudence_f", lady_front("P", "3", "U", "v", "prim", top="updo", prop="fan", shoes=("v", "v"), trim="i"))
add("griselda_f", lady_front("h", "H", "F", "z", "scowl", top="bun", prop="scissors", shoes=("k", "k"), trim="z"))

def head_layer(hx, hy, skin="s", shade="S", rx=9, ry=9.5):
    h = Pix(64, 64)
    h.ellipse(hx, hy, rx, ry, skin)
    h.ellipse(hx - rx, hy + 2, 1.6, 2.4, skin); h.ellipse(hx + rx, hy + 2, 1.6, 2.4, skin)
    h.rim(skin, shade, 1)
    return h


def stack(*layers):
    p = Pix(64, 64)
    for L in layers:
        p.paste(L.rows(), 0, 0)
    return p


def limb(L, x0, y0, x1, y1, c, w=4):
    for d in range(w):
        L.line(x0 + d - w / 2, y0, x1 + d - w / 2, y1, c)


def exgf_front():
    hx, hy = 32, 14
    back = Pix(64, 64)
    back.ellipse(hx, hy, 11, 10.5, "h")
    back.poly([(21, 12), (43, 12), (47, 40), (41, 44), (23, 44), (17, 40)], "h")
    back.rim("h", "0", 2); back.outline("k")
    legs = Pix(64, 64)
    legs.poly([(24, 43), (31, 43), (30, 61), (24, 61)], "B"); legs.poly([(33, 43), (40, 43), (40, 61), (34, 61)], "B")
    legs.rim("B", "h", 2)
    legs.rect(23, 56, 31, 63, "0"); legs.rect(33, 56, 41, 63, "0"); legs.rect(24, 57, 26, 57, "K"); legs.rect(34, 57, 36, 57, "K")
    legs.outline("k")
    body = Pix(64, 64)
    body.poly([(23, 25), (41, 25), (43, 33), (40, 45), (24, 45), (21, 33)], "R")
    body.rect(29, 21, 35, 26, "S")
    body.ellipse(21, 29, 4.5, 4.5, "R"); body.ellipse(43, 29, 4.5, 4.5, "R")
    limb(body, 20, 30, 19, 39, "R", 5); limb(body, 44, 30, 45, 40, "R", 5)
    body.rim("R", "h", 2); body.outline("k")
    arm1 = Pix(64, 64)
    for d in range(5):
        arm1.line(19, 35 + d, 41, 34 + d, "R")
    arm1.ellipse(41, 36, 3, 3, "s")
    arm1.rim("R", "h", 1); arm1.outline("k")
    arms = Pix(64, 64)
    for d in range(5):
        arms.line(45, 39 + d, 26, 40 + d, "R")
    arms.ellipse(25, 41.5, 3, 2.8, "s")
    arms.rim("R", "h", 1); arms.outline("k")
    arms.line(28, 40, 43, 39, "r")
    arm1.paste(arms.rows(), 0, 0); arms = arm1
    arms.rect(46, 30, 50, 39, "K"); arms.rect(47, 31, 49, 37, "C"); arms.rect(47, 31, 48, 32, "5")
    arms.ring(48, 34.5, 3.5, 6, "k")
    arms.ellipse(46.5, 39, 2.6, 2.4, "s")
    head = head_layer(hx, hy)
    head.poly([(hx - 10, hy + 6), (hx - 10, hy - 5), (hx - 4, hy - 10), (hx + 6, hy - 10), (hx + 10, hy - 4),
               (hx + 10, hy + 6), (hx + 8, hy - 2), (hx + 3, hy - 5), (hx - 3, hy - 4), (hx - 8, hy - 1)], "h")
    head.rim("h", "0", 1)
    head.outline("k")
    p = stack(back, legs, body, arms, head)
    ey = hy + 2
    for ex, sgn in ((hx - 6, -1), (hx + 2, 1)):
        p.rect(ex, ey, ex + 3, ey, "r"); p.set(ex + 1, ey, "y"); p.set(ex + 2, ey, "y")
        p.rect(ex, ey - 1, ex + 3, ey - 1, "k"); p.rect(ex, ey + 1, ex + 3, ey + 1, "R")
    p.line(hx - 7, ey - 4, hx - 2, ey - 2, "k"); p.line(hx + 6, ey - 4, hx + 1, ey - 2, "k")
    p.rect(hx - 2, ey + 6, hx + 2, ey + 6, "R")
    r = rnd(33)
    for _ in range(26):
        x, y = r.randrange(2, 62), r.randrange(4, 60)
        if p.get(x, y) == "." and p.get(x + 1, y) == "." and p.get(x - 1, y) == ".":
            p.set(x, y, "V" if r.random() < 0.6 else "v")
    return p.rows()
add("exgf_f", exgf_front())


def insectologist_front():
    hx, hy = 32, 17
    net = Pix(64, 64)
    net.line(9, 12, 18, 46, "t"); net.line(10, 12, 19, 46, "T")
    net.poly([(2, 10), (16, 6), (14, 20), (8, 26)], "l")
    net.ring(9, 8, 7, 3.5, "w")
    net.outline("G")
    for (x0, y0, x1, y1) in ((4, 12, 10, 24), (8, 11, 12, 22), (12, 10, 13, 18)):
        net.line(x0, y0, x1, y1, "G")
    legs = Pix(64, 64)
    legs.rect(24, 46, 30, 53, "a"); legs.rect(34, 46, 40, 53, "a")
    legs.rect(25, 53, 29, 58, "s"); legs.rect(35, 53, 39, 58, "s")
    legs.rect(25, 56, 29, 58, "w"); legs.rect(35, 56, 39, 58, "w")
    legs.rect(23, 59, 30, 63, "T"); legs.rect(34, 59, 41, 63, "T")
    legs.outline("k")
    body = Pix(64, 64)
    body.poly([(22, 28), (42, 28), (41, 47), (23, 47)], "D")
    body.rect(29, 24, 35, 29, "S")
    body.ellipse(21, 31, 4.5, 4, "D"); body.ellipse(43, 31, 4.5, 4, "D")
    limb(body, 20, 33, 19, 44, "s", 4); limb(body, 44, 33, 47, 39, "s", 4)
    body.ellipse(19.5, 45, 3, 3, "s"); body.ellipse(47.5, 39, 3, 3, "s")
    body.rim("D", "a", 2); body.outline("k")
    body.rect(25, 33, 29, 37, "a"); body.rect(35, 33, 39, 37, "a"); body.rect(25, 33, 29, 33, "O"); body.rect(35, 33, 39, 33, "O")
    body.line(32, 29, 32, 47, "a"); body.rect(23, 45, 41, 45, "O")
    mag = Pix(64, 64)
    mag.line(48, 39, 53, 30, "T"); mag.line(49, 39, 54, 30, "T")
    mag.ellipse(55, 25, 5, 5, "G"); mag.ellipse(55, 25, 3.5, 3.5, "c"); mag.set(53, 23, "w"); mag.set(54, 22, "w")
    mag.outline("k")
    head = head_layer(hx, hy)
    head.rim("s", "S", 1)
    hat = Pix(64, 64)
    hat.ellipse(hx, hy - 5, 15, 3.2, "D")
    hat.ellipse(hx, hy - 9, 9, 6, "d")
    for y in range(hy - 4, 64):
        for x in range(64):
            if hat.get(x, y) == "d": hat.set(x, y, ".")
    hat.rect(hx - 9, hy - 7, hx + 9, hy - 6, "a")
    hat.rim("d", "D", 1)
    hat.outline("k")
    hat.ellipse(hx + 5, hy - 7, 2, 1.6, "q"); hat.set(hx + 5, hy - 9, "G"); hat.set(hx + 5, hy - 10, "w")
    hat.set(hx + 3, hy - 7, "k"); hat.set(hx + 7, hy - 7, "k"); hat.set(hx + 5, hy - 7, "Q")
    head.paste(hat.rows(), 0, 0)
    head.outline("k")
    p = stack(net, legs, body, mag, head)
    ey = hy + 1
    for ex in (hx - 4, hx + 4):
        p.ring(ex, ey, 3.2, 3, "k"); p.ellipse(ex, ey, 2.2, 2, "c"); p.set(ex, ey, "0"); p.set(ex - 1, ey - 1, "w")
    p.rect(hx - 1, ey - 1, hx + 1, ey - 1, "k")
    p.rect(hx - 3, ey + 5, hx + 3, ey + 5, "t"); p.rect(hx - 1, ey + 7, hx + 1, ey + 7, "k")
    return p.rows()
add("insectologist_f", insectologist_front())


def orderly_front():
    hx, hy = 32, 12
    legs = Pix(64, 64)
    legs.poly([(20, 44), (31, 44), (30, 60), (21, 60)], "l"); legs.poly([(33, 44), (44, 44), (43, 60), (34, 60)], "l")
    legs.rim("l", "G", 2)
    legs.rect(19, 60, 30, 63, "p"); legs.rect(34, 60, 45, 63, "p")
    legs.outline("k")
    body = Pix(64, 64)
    body.poly([(17, 25), (47, 25), (50, 31), (45, 46), (19, 46), (14, 31)], "w")
    body.rect(28, 19, 36, 26, "o")
    limb(body, 14, 30, 11, 46, "w", 7); limb(body, 50, 30, 53, 46, "w", 7)
    body.rim("w", "l", 2)
    body.outline("k")
    arms = Pix(64, 64)
    limb(arms, 11, 38, 11, 52, "o", 6); limb(arms, 53, 38, 53, 52, "o", 6)
    arms.ellipse(11, 53, 4, 3.6, "o"); arms.ellipse(53, 53, 4, 3.6, "o")
    arms.rim("o", "O", 1); arms.outline("k")
    arms.line(9, 53, 13, 53, "O"); arms.line(51, 53, 55, 53, "O")
    head = head_layer(hx, hy, "o", "O", 8.5, 9)
    hair = Pix(64, 64); hair.ellipse(hx, hy - 4, 8.8, 5.6, "T")
    for y in range(hy - 3, 64):
        for x in range(64):
            if hair.get(x, y) == "T": hair.set(x, y, ".")
    head.paste(hair.rows(), 0, 0)
    head.outline("k")
    p = stack(legs, body, arms, head)
    for x in range(20, 45):
        if p.get(x, 44) not in (".", "k"):
            p.set(x, 44, "G")
    p.poly([(28, 25), (36, 25), (32, 31)], "o"); p.line(28, 25, 32, 31, "l"); p.line(36, 25, 32, 31, "l")
    p.rect(22, 30, 26, 34, "l"); p.rect(22, 30, 26, 30, "G"); p.set(23, 29, "C"); p.set(24, 28, "C")
    for (x, y) in ((38, 45), (39, 46), (40, 47), (41, 46), (42, 45)):
        p.set(x, y, "Y")
    for (x, y, l) in ((38, 47, 4), (40, 48, 5), (42, 47, 3)):
        p.rect(x, y, x, y + l, "y"); p.set(x, y + l, "Y")
    ey = hy + 1
    for ex in (hx - 5, hx + 2):
        p.rect(ex, ey - 2, ex + 3, ey - 1, "k"); p.rect(ex + 1, ey, ex + 2, ey + 1, "0")
    p.rect(hx - 1, ey + 3, hx, ey + 3, "O")
    p.rect(hx - 3, ey + 6, hx + 3, ey + 6, "k")
    return p.rows()
add("orderly_f", orderly_front())


def nurse_front():
    hx, hy = 32, 15
    back = Pix(64, 64)
    back.ellipse(hx, hy + 1, 10.5, 10, "T"); back.ellipse(hx, hy + 10, 6, 4, "T")
    back.rim("T", "u", 2); back.outline("k")
    legs = Pix(64, 64)
    legs.rect(25, 52, 29, 60, "l"); legs.rect(35, 52, 39, 60, "l")
    legs.rect(24, 60, 30, 63, "w"); legs.rect(34, 60, 40, 63, "w")
    legs.outline("k")
    body = Pix(64, 64)
    body.poly([(23, 26), (41, 26), (40, 38), (45, 54), (19, 54), (24, 38)], "w")
    body.rect(29, 22, 35, 27, "S")
    body.ellipse(21.5, 29, 4.5, 4, "w"); body.ellipse(42.5, 29, 4.5, 4, "w")
    limb(body, 20, 31, 22, 42, "s", 4); limb(body, 44, 31, 47, 38, "s", 4)
    body.rim("w", "l", 2); body.outline("k")
    body.rect(24, 38, 40, 39, "l"); body.rect(31, 28, 33, 28, "r"); body.rect(32, 27, 32, 29, "r")
    for y in (44, 49):
        body.line(28, y - 4, 26, y + 4, "l")
    syr = Pix(64, 64)
    syr.poly([(45, 37), (55, 23), (58, 25), (48, 39)], "c")
    syr.line(46, 38, 56, 24, "w")
    syr.poly([(43, 40), (45, 36), (49, 39), (46, 42)], "G")
    syr.line(56, 23, 61, 16, "m"); syr.line(57, 24, 61, 17, "M")
    syr.outline("k")
    for (x, y) in ((50, 32), (52, 29), (54, 27)):
        syr.set(x, y, "B")
    syr.ellipse(47, 39, 2.8, 2.8, "s")
    clip = Pix(64, 64)
    clip.poly([(14, 34), (24, 32), (26, 46), (16, 48)], "t")
    clip.poly([(16, 36), (23, 35), (24, 45), (17, 46)], "w")
    clip.rect(18, 32, 21, 34, "G")
    clip.outline("k")
    for y in (38, 40, 42):
        clip.line(18, y + 0.5, 22, y, "G")
    clip.ellipse(22, 43, 2.8, 2.8, "s")
    head = head_layer(hx, hy + 1)
    head.poly([(hx - 10, hy + 4), (hx - 9, hy - 5), (hx - 3, hy - 9), (hx + 5, hy - 9), (hx + 9, hy - 5),
               (hx + 10, hy + 4), (hx + 7, hy - 3), (hx + 1, hy - 3), (hx - 3, hy - 2), (hx - 7, hy - 3)], "T")
    head.rim("T", "u", 1)
    cap = Pix(64, 64)
    cap.poly([(hx - 7, hy - 6), (hx + 7, hy - 6), (hx + 5, hy - 13), (hx - 5, hy - 13)], "w")
    cap.rim("w", "l", 1)
    cap.rect(hx - 1, hy - 11, hx + 1, hy - 11, "r"); cap.rect(hx, hy - 12, hx, hy - 10, "r")
    head.paste(cap.rows(), 0, 0)
    head.outline("k")
    p = stack(back, legs, body, clip, syr, head)
    ey = hy + 3
    for ex in (hx - 5, hx + 2):
        p.pts([(ex, ey + 1), (ex + 1, ey), (ex + 2, ey), (ex + 3, ey + 1)], "k")
    p.pts([(hx - 2, ey + 5), (hx - 1, ey + 6), (hx, ey + 6), (hx + 1, ey + 6), (hx + 2, ey + 5)], "R")
    p.rect(hx - 7, ey + 3, hx - 6, ey + 3, "i"); p.rect(hx + 6, ey + 3, hx + 7, ey + 3, "i")
    return p.rows()
add("nurse_f", nurse_front())

# ============================================================ battle backs (64x64)
def phd_back():
    p = Pix(64, 64)
    p.poly([(3, 64), (7, 47), (18, 40), (46, 40), (57, 47), (61, 64)], "w")
    p.rim("w", "l", 3, dirs=((1, 0),))
    p.ellipse(32, 42, 13, 5, "l"); p.ring(32, 42, 13, 5, "w")
    p.rect(27, 33, 37, 39, "S"); p.rect(27, 38, 37, 39, "b")
    hair = Pix(64, 64)
    hair.ellipse(32, 21, 14, 14.5, "h")
    for (x0, x1, top) in ((15, 21, 9), (18, 25, 3), (23, 30, 1), (29, 35, 0), (34, 41, 2), (39, 46, 5), (44, 50, 11)):
        hair.poly([(x0, 16), ((x0 + x1) / 2 + (2 if x0 > 30 else -2), top), (x1, 16)], "h")
    hair.poly([(17, 22), (12, 18), (18, 18)], "h"); hair.poly([(46, 20), (52, 15), (47, 25)], "h")
    hair.poly([(19, 30), (16, 34), (21, 31)], "h"); hair.poly([(44, 31), (48, 34), (43, 32)], "h")
    hair.ellipse(17.5, 26, 2.4, 3.6, "s"); hair.ellipse(46.5, 26, 2.4, 3.6, "s")
    hair.set(17, 26, "S"); hair.set(47, 26, "S")
    for (x0, y0, x1, y1) in ((24, 8, 28, 20), (31, 5, 32, 18), (37, 7, 39, 19), (21, 13, 24, 22), (42, 11, 41, 22)):
        hair.line(x0, y0, x1, y1, "H")
    p.paste(hair.rows(), 0, 0)
    p.outline("k")
    p.line(32, 47, 32, 64, "l"); p.line(31, 56, 31, 64, "G")
    p.line(15, 48, 13, 64, "l"); p.line(49, 48, 51, 64, "l")
    p.line(8, 52, 10, 64, "G"); p.line(56, 52, 54, 64, "G")
    p.rect(11, 58, 16, 58, "G")
    return p.rows()
add("phd_b", phd_back())


def ai_back():
    p = Pix(64, 64)
    glow = Pix(64, 64)
    glow.ellipse(32, 52, 8, 11, "c"); glow.ellipse(32, 51, 5, 8, "5"); glow.ellipse(32, 50, 2.5, 5, "w")
    for y in range(64):
        for x in range(64):
            if glow.get(x, y) != "." and y < 49:
                glow.set(x, y, ".")
    p.paste(glow.rows(), 0, 0)
    halo = Pix(64, 64)
    halo.rect(16, 21, 48, 49, "c")
    for (x, y) in ((16, 21), (48, 21), (16, 49), (48, 49)):
        halo.set(x, y, ".")
    p.paste(halo.rows(), 0, 0)
    b = Pix(64, 64)
    b.rect(19, 24, 45, 46, "G"); b.rect(25, 46, 39, 50, "M")
    for (x, y) in ((19, 24), (45, 24), (19, 46), (45, 46)):
        b.set(x, y, ".")
    b.rim("G", "m", 3)
    b.rect(20, 25, 44, 25, "w"); b.rect(20, 25, 20, 44, "l")
    b.ellipse(14, 37, 3, 3, "m"); b.ellipse(50, 37, 3, 3, "m")
    b.outline("k")
    for y in range(30, 42, 3):
        b.rect(25, y, 39, y, "M"); b.rect(25, y + 1, 39, y + 1, "l")
    for (x, y) in ((22, 27), (42, 27), (22, 43), (42, 43)):
        b.set(x, y, "p")
    b.rect(27, 46, 37, 46, "p"); b.rect(28, 48, 36, 48, "p")
    b.line(12, 39, 9, 45, "k"); b.line(52, 39, 55, 45, "k")
    b.pts([(8, 46), (10, 46), (54, 46), (56, 46)], "M")
    p.paste(b.rows(), 0, 0)
    for (x, y) in ((17, 22), (47, 22), (17, 48), (47, 48)):
        p.set(x, y, "5")
    p.line(38, 24, 42, 9, "k"); p.line(39, 24, 43, 9, "M")
    q = Pix(64, 64); q.ellipse(43, 7, 3, 3, "5"); q.ellipse(42.5, 6.5, 1.2, 1.2, "w"); q.outline("k")
    p.paste(q.rows(), 0, 0)
    for (x, y) in ((47, 4), (48, 8), (38, 3)):
        p.set(x, y, "c")
    return p.rows()
add("ai_b", ai_back())


def terminator_back():
    p = Pix(64, 64)
    body = Pix(64, 64)
    body.poly([(10, 64), (12, 38), (22, 30), (42, 30), (52, 38), (54, 64)], "m")
    body.ellipse(12, 36, 11, 8, "G"); body.ellipse(52, 36, 11, 8, "G")
    body.rect(0, 40, 7, 64, "m"); body.rect(57, 40, 63, 64, "m")
    body.rect(27, 22, 37, 31, "M")
    body.rim("m", "M", 3); body.rim("G", "m", 3)
    body.outline("k")
    for (cx, cy) in ((12, 36), (52, 36)):
        body.ellipse(cx - 3, cy - 3, 4, 2, "l", only=("G",)); body.set(cx - 5, cy - 4, "w"); body.set(cx - 4, cy - 4, "w")
    for y in range(36, 64, 5):
        body.rect(29, y, 35, y + 3, "G"); body.rect(29, y, 35, y, "w"); body.rect(29, y + 3, 35, y + 3, "M")
        body.line(18, y + 1, 27, y + 2, "M"); body.line(37, y + 2, 46, y + 1, "M")
    for x in (29, 35):
        body.line(x, 22, x, 31, "p")
    body.line(31, 22, 31, 31, "G"); body.line(33, 22, 33, 31, "l")
    body.line(2, 44, 2, 64, "G"); body.line(61, 44, 61, 64, "M")
    body.rect(0, 52, 7, 53, "p"); body.rect(57, 52, 63, 53, "p")
    p.paste(body.rows(), 0, 0)
    h = Pix(64, 64)
    h.ellipse(32, 14, 9, 10, "G")
    h.rect(26, 19, 38, 25, "G")
    h.rim("G", "m", 2)
    h.outline("k")
    h.ellipse(29, 9, 3.5, 3, "l", only=("G",)); h.set(28, 8, "w"); h.set(29, 8, "w"); h.set(28, 9, "w")
    h.line(32, 5, 32, 24, "M"); h.line(27, 20, 37, 20, "M"); h.line(27, 23, 37, 23, "M")
    p.paste(h.rows(), 0, 0)
    for (x, y, c) in ((22, 14, "r"), (21, 15, "R"), (22, 15, "r"), (21, 14, "R"), (20, 15, "R"),
                      (42, 14, "r"), (43, 15, "R"), (42, 15, "r"), (43, 14, "R"), (44, 15, "R"),
                      (19, 14, "R"), (45, 14, "R"), (20, 13, "R"), (44, 13, "R"), (20, 16, "R"), (44, 16, "R"),
                      (18, 15, "R"), (46, 15, "R"), (23, 16, "r"), (41, 16, "r")):
        p.set(x, y, c)
    return p.rows()
add("terminator_b", terminator_back())


# ============================================================ battle effects
PICKET = Pix(16, 20)
PICKET.rect(7, 10, 8, 19, "t"); PICKET.rect(8, 10, 8, 19, "T")
PICKET.rect(1, 1, 14, 10, "w"); PICKET.rect(1, 9, 14, 10, "l")
PICKET.outline("k")
PICKET.ellipse(6, 5.5, 2.6, 2.6, "q"); PICKET.ellipse(5.5, 5, 1, 1, "x"); PICKET.line(7, 7, 8, 8, "Q")
PICKET.rect(10, 3, 12, 3, "Q"); PICKET.rect(10, 5, 12, 5, "Q"); PICKET.rect(10, 7, 11, 7, "Q")
add("picket", PICKET.rows())
add("flame0", [
    "...r....",
    "..rr..r.",
    "..rPr.r.",
    ".rPPrrr.",
    ".rPyPPr.",
    "rPyyyPrr",
    "rPywyyPr",
    "rPywwyPr",
    ".rPyyPr.",
    "..rrrr..",
])
add("flame1", [
    "....r...",
    ".r..rr..",
    ".r.rPr..",
    ".rrrPPr.",
    ".rPPyPr.",
    "rrPyyyPr",
    "rPyywyPr",
    "rPywwyPr",
    ".rPyyPr.",
    "..rrrr..",
])
add("leaf", [
    ".....zzz",
    "...zzqxz",
    "..zqqxqz",
    ".zqqxqQz",
    ".zqxqQz.",
    "zqxQQz..",
    "zxzzz...",
    "z.......",
])
add("spark", [
    "...y...",
    "...y...",
    "..ywy..",
    "yywwwyy",
    "..ywy..",
    "...y...",
    "...y...",
])

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
