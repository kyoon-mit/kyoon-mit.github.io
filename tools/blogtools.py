"""Shared helpers for tools/new_post.py and tools/check_posts.py.

Reads blog posts the way Jekyll 3.10 does: front matter as YAML, posts from
every _posts folder under docs/ (and their subfolders, except those whose
name starts with _ or .), and each post's address from its permalink (with
:title, :year and the other placeholders filled in), its slug, or its file
name, slugified in Jekyll's "pretty" mode.
"""

import datetime
import re
import unicodedata
from pathlib import Path

DOCS = Path(__file__).resolve().parent.parent / "docs"
POSTS = DOCS / "_posts"
RESERVED = {"/blog/": "the blog index", "/blog/style/": "the formatting reference"}
POST_NAME = re.compile(r"(\d{4})-(\d{2})-(\d{2})-(.+)\.(md|markdown|html)")
DEFAULT_PERMALINK = "/blog/:title/"

try:
    import yaml
except ImportError:  # the fallback reader below covers the front matter posts use
    yaml = None


class FrontMatterError(ValueError):
    pass


def _scalar(v: str):
    v = v.strip()
    if len(v) >= 2 and v[0] == v[-1] and v[0] in "'\"":
        return v[1:-1]
    if v in ("true", "false"):
        return v == "true"
    if re.search(r":\s", v):
        raise FrontMatterError(f"mapping values are not allowed here: {v!r} (quote it)")
    return v


def _strip_comment(v: str) -> str:
    out, q = [], None
    for i, ch in enumerate(v):
        if q:
            q = None if ch == q else q
        elif ch in "'\"":
            q = ch
        elif ch == "#" and (i == 0 or v[i - 1] in " \t"):
            break
        out.append(ch)
    return "".join(out).rstrip()


def _simple_yaml(text: str) -> dict:
    """Top-level keys only: scalars, flow lists (over several lines too),
    block lists (indented or not), folded/literal strings, and one level of
    nested mappings such as paper:."""
    lines = text.splitlines()
    data, i = {}, 0
    while i < len(lines):
        m = re.match(r"^([A-Za-z_][\w-]*):(.*)$", lines[i])
        if not m:
            i += 1
            continue
        key, rest = m.group(1), _strip_comment(m.group(2)).strip()
        i += 1
        if rest.startswith("["):
            buf = rest
            while "]" not in buf and i < len(lines):
                buf += " " + _strip_comment(lines[i]).strip()
                i += 1
            data[key] = [_scalar(x) for x in buf.strip()[1:buf.rfind("]")].split(",") if x.strip()]
        elif rest in (">", ">-", "|", "|-", ">+", "|+"):
            block = []
            while i < len(lines) and (lines[i].startswith((" ", "\t")) or not lines[i].strip()):
                block.append(lines[i].strip())
                i += 1
            data[key] = (" " if rest.startswith(">") else "\n").join(x for x in block if x)
        elif rest == "":
            items, sub = [], {}
            while i < len(lines) and (lines[i].startswith((" ", "\t", "-")) or not lines[i].strip()):
                s = lines[i].strip()
                if s.startswith("- "):
                    items.append(_scalar(_strip_comment(s[2:])))
                elif ":" in s and not items:
                    k, _, v = s.partition(":")
                    sub[k.strip()] = v.strip().strip("'\"")
                i += 1
            data[key] = items if items else (sub or None)
        else:
            data[key] = _scalar(rest)
    return data


def load_yaml(text: str) -> dict:
    if yaml is not None:
        try:
            return yaml.safe_load(text) or {}
        except yaml.YAMLError as e:
            raise FrontMatterError(str(e).splitlines()[0]) from e
    return _simple_yaml(text)


def split_front_matter(text: str) -> tuple[dict, str, int]:
    """(front matter, body, number of lines before the body). Raises
    FrontMatterError when the front matter is not valid YAML."""
    m = re.match(r"---[ \t]*\r?\n(.*?\r?\n)?---[ \t]*\r?\n", text, re.S)
    if not m:
        return {}, text, 0
    fm = load_yaml(m.group(1) or "")
    if not isinstance(fm, dict):
        raise FrontMatterError("front matter is not a set of key: value lines")
    return fm, text[m.end():], m.group(0).count("\n")


def blog_data() -> tuple[list[str], list[str]]:
    """(kind keys, field keys) from docs/_data/blog.yml."""
    text = (DOCS / "_data" / "blog.yml").read_text()
    if yaml is not None:
        data = yaml.safe_load(text) or {}
        return [k["key"] for k in data.get("kinds", [])], [f["key"] for f in data.get("fields", [])]
    kinds_part, _, fields_part = text.partition("\nfields:")
    get = lambda part: [_strip_comment(k).strip().strip("'\"") for k in re.findall(r"^\s*-\s*key:\s*(.+)$", part, re.M)]
    return get(kinds_part), get(fields_part)


def _slugify(text: str, keep: str, lower: bool) -> str:
    out, dash = [], False
    for ch in (text.lower() if lower else text):
        cat = unicodedata.category(ch)
        if cat[0] in "LM" or cat == "Nd" or ch in keep:
            out.append(ch)
            dash = False
        elif not dash:
            out.append("-")
            dash = True
    return "".join(out).strip("-")


def jekyll_slug(text: str) -> str:
    """Jekyll's Utils.slugify(text, mode: "pretty", cased: true)."""
    return _slugify(text, "._~!$&'()+,;=@", lower=False)


def new_slug(text: str) -> str:
    """A slug for a new post: letters, marks and digits joined by hyphens,
    lower case. Jekyll leaves such a slug unchanged."""
    return _slugify(text, "", lower=True)


def post_files() -> list[Path]:
    """Every post Jekyll reads: files named like posts in any _posts folder
    under docs/, skipping folders and files that start with _ or . (other
    than the _posts folder itself) or end with ~."""
    out = []
    for d in DOCS.rglob("_posts"):
        if not d.is_dir():
            continue
        parts = d.relative_to(DOCS).parts[:-1]
        if any(p.startswith(("_", ".")) for p in parts):
            continue
        for p in d.rglob("*"):
            inner = p.relative_to(d).parts
            if not p.is_file() or any(s.startswith(("_", ".")) or s.endswith("~") for s in inner):
                continue
            if POST_NAME.fullmatch(p.name):
                out.append(p)
    return sorted(out)


def post_address(path: Path, fm: dict):
    """The URL Jekyll gives the post, or None when a permalink holds a
    placeholder this tool does not know."""
    y, mo, d, name_slug, _ = POST_NAME.fullmatch(path.name).groups()
    when = fm.get("date")
    if isinstance(when, (datetime.date, datetime.datetime)):
        y, mo, d = f"{when.year:04d}", f"{when.month:02d}", f"{when.day:02d}"
    elif isinstance(when, str) and re.match(r"\d{4}-\d{2}-\d{2}", when):
        y, mo, d = when[:4], when[5:7], when[8:10]
    slug = str(fm.get("slug") or name_slug)
    own = fm.get("categories") or fm.get("category") or []
    own = own.split() if isinstance(own, str) else [str(c) for c in own]
    parts = path.relative_to(DOCS).parts
    cats = list(parts[: parts.index("_posts")]) + own  # folders above _posts, then front matter
    values = {
        "title": jekyll_slug(slug), "slug": _slugify(slug, "", lower=True), "year": y, "month": mo, "day": d,
        "i_month": str(int(mo)), "i_day": str(int(d)), "short_year": y[2:], "output_ext": ".html",
        "categories": "/".join(_slugify(c, "", lower=True) for c in cats),
    }
    link = str(fm.get("permalink") or DEFAULT_PERMALINK)
    for k in sorted(values, key=len, reverse=True):
        link = link.replace(":" + k, values[k])
    if re.search(r":[a-z_]+", link):
        return None
    link = re.sub(r"/+", "/", "/" + link.lstrip("/"))
    return link


def addresses() -> tuple[dict[str, list[Path]], list[Path]]:
    """({address: posts}, posts whose front matter could not be read)."""
    out: dict[str, list[Path]] = {}
    bad = []
    for p in post_files():
        try:
            fm, _, _ = split_front_matter(p.read_text())
        except FrontMatterError:
            bad.append(p)
            continue
        if fm.get("published") is False:
            continue
        addr = post_address(p, fm)
        if addr:
            out.setdefault(addr, []).append(p)
    return out, bad
