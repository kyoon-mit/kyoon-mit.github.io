"""Tiny pixel-canvas helpers for authoring sprites as palette-character grids."""
import math


class Pix:
    def __init__(self, w, h, fill="."):
        self.w, self.h = w, h
        self.a = [[fill] * w for _ in range(h)]

    def set(self, x, y, c):
        x, y = int(x), int(y)
        if 0 <= x < self.w and 0 <= y < self.h:
            self.a[y][x] = c

    def get(self, x, y):
        if 0 <= x < self.w and 0 <= y < self.h:
            return self.a[y][x]
        return "."

    def ellipse(self, cx, cy, rx, ry, c, only=None):
        for y in range(self.h):
            for x in range(self.w):
                if ((x + 0.5 - cx) / rx) ** 2 + ((y + 0.5 - cy) / ry) ** 2 <= 1.0:
                    if only is None or self.a[y][x] in only:
                        self.a[y][x] = c

    def ring(self, cx, cy, rx, ry, c, only=None):
        """1-px boundary of an ellipse (pixels inside whose 4-neighbour is outside)."""
        inside = lambda x, y: ((x + 0.5 - cx) / rx) ** 2 + ((y + 0.5 - cy) / ry) ** 2 <= 1.0
        for y in range(self.h):
            for x in range(self.w):
                if inside(x, y) and not all(inside(x + dx, y + dy) for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1))):
                    if only is None or self.a[y][x] in only:
                        self.a[y][x] = c

    def rect(self, x0, y0, x1, y1, c):
        for y in range(y0, y1 + 1):
            for x in range(x0, x1 + 1):
                self.set(x, y, c)

    def poly(self, pts, c):
        n = len(pts)
        for y in range(self.h):
            for x in range(self.w):
                px, py = x + 0.5, y + 0.5
                ins = False
                j = n - 1
                for i in range(n):
                    xi, yi = pts[i]; xj, yj = pts[j]
                    if (yi > py) != (yj > py) and px < (xj - xi) * (py - yi) / (yj - yi) + xi:
                        ins = not ins
                    j = i
                if ins:
                    self.a[y][x] = c

    def line(self, x0, y0, x1, y1, c):
        x0, y0, x1, y1 = int(x0), int(y0), int(x1), int(y1)
        dx, dy = abs(x1 - x0), -abs(y1 - y0)
        sx, sy = (1 if x0 < x1 else -1), (1 if y0 < y1 else -1)
        err = dx + dy
        while True:
            self.set(x0, y0, c)
            if x0 == x1 and y0 == y1:
                break
            e2 = 2 * err
            if e2 >= dy:
                err += dy; x0 += sx
            if e2 <= dx:
                err += dx; y0 += sy

    def pts(self, coords, c):
        for x, y in coords:
            self.set(x, y, c)

    def outline(self, c="k", diag=False):
        src = [r[:] for r in self.a]
        nb = [(1, 0), (-1, 0), (0, 1), (0, -1)] + ([(1, 1), (-1, -1), (1, -1), (-1, 1)] if diag else [])
        for y in range(self.h):
            for x in range(self.w):
                if src[y][x] != ".":
                    continue
                for dx, dy in nb:
                    xx, yy = x + dx, y + dy
                    if 0 <= xx < self.w and 0 <= yy < self.h and src[yy][xx] != ".":
                        self.a[y][x] = c
                        break

    def rim(self, base, shade, dist=2, dirs=((1, 0), (0, 1), (1, 1))):
        """Shade `base` pixels that lie within `dist` of a transparent pixel toward lower right."""
        src = [r[:] for r in self.a]
        for y in range(self.h):
            for x in range(self.w):
                if src[y][x] != base:
                    continue
                for dx, dy in dirs:
                    hit = False
                    for s in range(1, dist + 1):
                        xx, yy = x + dx * s, y + dy * s
                        if not (0 <= xx < self.w and 0 <= yy < self.h) or src[yy][xx] in (".",):
                            hit = True
                            break
                    if hit:
                        self.a[y][x] = shade
                        break

    def recolor(self, frm, to, fn=lambda x, y: True):
        for y in range(self.h):
            for x in range(self.w):
                if self.a[y][x] == frm and fn(x, y):
                    self.a[y][x] = to

    def paste(self, rows, x0, y0, flip=False):
        for j, r in enumerate(rows):
            w = len(r)
            for i, ch in enumerate(r):
                c = r[w - 1 - i] if flip else ch
                if c != ".":
                    self.set(x0 + i, y0 + j, c)

    def rows(self):
        return ["".join(r) for r in self.a]


def flip(rows):
    return [r[::-1] for r in rows]


def shift(rows, dx=0, dy=0):
    w, h = len(rows[0]), len(rows)
    out = [["."] * w for _ in range(h)]
    for j in range(h):
        for i in range(w):
            jj, ii = j - dy, i - dx
            if 0 <= jj < h and 0 <= ii < w:
                out[j][i] = rows[jj][ii]
    return ["".join(r) for r in out]


def ellipse_rot(p, cx, cy, rx, ry, ang, c, only=None):
    ca, sa = math.cos(ang), math.sin(ang)
    for y in range(p.h):
        for x in range(p.w):
            dx, dy = x + 0.5 - cx, y + 0.5 - cy
            u, v = dx * ca + dy * sa, -dx * sa + dy * ca
            if (u / rx) ** 2 + (v / ry) ** 2 <= 1.0:
                if only is None or p.a[y][x] in only:
                    p.a[y][x] = c
