"""Check blog posts for mistakes the site build does not report.

    uv run --no-project --with pyyaml python tools/check_posts.py   # every post
    uv run --no-project --with pyyaml python tools/check_posts.py FILE ...
(plain `python3 tools/check_posts.py` also works, with a simpler YAML reader)

Errors (exit status 1):
  - template code by accident: `{{`, or `{%` that is not a proper tag, outside
    {% raw %} ... {% endraw %} (the text disappears, or the build fails); any
    template tag inside code, inline or in a block, at any indent or in a box
    (it changes the code shown); an unclosed raw block (`{%- endraw -%}` with
    dashes does not close it) or stray endraw; tags such as if/for/endfor that
    do not pair up; an include of a file that is not in docs/_includes.
  - front matter that is not valid YAML (Jekyll publishes the post empty).
  - two posts with the same address, or a post at a reserved address.
  - a kind or field key that is not in docs/_data/blog.yml.
Warnings:
  - template tags in prose (fine if meant), `fields:` as one word, `<` in a
    title or `<word>` in the description (the feed drops it), a link in the
    description, text left from the template, TeX-like $x$ (plain text on the
    blog; math needs $$x$$), and `|` where it would start or split a table (in
    math, write \\vert, \\Vert or \\mid; in text, \\|). The last two are
    Markdown checks, skipped for .html posts, which the editor writes.
"""

import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import blogtools as bt  # noqa: E402

BLOCKS = {"if": "endif", "unless": "endunless", "for": "endfor", "case": "endcase",
          "capture": "endcapture", "tablerow": "endtablerow", "highlight": "endhighlight",
          "comment": "endcomment"}
ENDS = {v: k for k, v in BLOCKS.items()}
MIDDLE = {"else": {"if", "unless", "for", "case"}, "elsif": {"if", "unless"}, "when": {"case"}}
SIMPLE = {"assign", "cycle", "increment", "decrement", "break", "continue", "link", "post_url",
          "include", "include_relative"}
PLACEHOLDERS = ['"TITLE"', "PAPER TITLE", "AUTHORS", "XXXX.XXXXX", "One or two sentences"]
MARKERS = re.compile(r"^[ \t]*(?:>[ \t]?)*")
LIST_ITEM = re.compile(r"^[ \t]*(?:>[ \t]?)*[ \t]*(?:[-*+]|\d+[.)])[ \t]+(?:\{:[^}]*\}[ \t]*)?(?:\[[ xX]\][ \t]*)?")


def fences(body: str) -> list[tuple[int, int]]:
    """Character ranges of fenced code blocks, at any indent and inside boxes."""
    spans, pos, fence, start = [], 0, None, 0
    for line in body.splitlines(keepends=True):
        bare = MARKERS.sub("", line).lstrip()
        m = re.match(r"(`{3,}|~{3,})", bare)
        if fence is None and m:
            fence, start = m.group(1), pos
        elif fence is not None and m and m.group(1)[0] == fence[0] and len(m.group(1)) >= len(fence) and bare.strip() == m.group(1):
            spans.append((start, pos + len(line)))
            fence = None
        pos += len(line)
    if fence is not None:
        spans.append((start, len(body)))
    return spans


def code_regions(body: str) -> list[tuple[int, int]]:
    """Fenced code blocks plus inline code spans."""
    spans = fences(body)
    outside = lambda i: not any(a <= i < b for a, b in spans)
    for m in re.finditer(r"(?<!`)(`+)(?!`)(.+?)(?<!`)\1(?!`)", body, re.S):
        if "\n\n" not in m.group(2) and outside(m.start()):
            spans.append((m.start(), m.end()))
    return spans


def liquid(body: str, offset: int) -> tuple[list[str], list[str]]:
    errors, notes = [], []
    code = code_regions(body)
    in_code = lambda i: any(a <= i < b for a, b in code)
    line = lambda i: f"line {offset + body.count(chr(10), 0, i) + 1}"
    stack: list[tuple[str, int]] = []  # open block tags and where they start
    pos = 0
    while True:
        m = re.compile(r"\{\{|\{%").search(body, pos)
        if not m:
            break
        at, snippet = m.start(), body[m.start():m.start() + 24].split("\n")[0]
        in_comment = any(t == "comment" for t, _ in stack)
        if m.group() == "{{":
            close = body.find("}}", m.end())
            if close == -1 or "\n\n" in body[m.end():close]:
                errors.append(f"{line(at)}: `{snippet}` opens template output that never closes; the build fails. Wrap it in {{% raw %}} ... {{% endraw %}}")
                pos = m.end()
                continue
            if not in_comment:
                errors.append(f"{line(at)}: `{snippet}` is read as template code and disappears; wrap it in {{% raw %}} ... {{% endraw %}}")
            pos = close + 2
            continue
        close = body.find("%}", m.end())
        if close == -1 or "\n\n" in body[m.end():close]:
            errors.append(f"{line(at)}: `{snippet}` starts a template tag that never ends with %}}; the build fails. Wrap it in {{% raw %}} ... {{% endraw %}}")
            pos = m.end()
            continue
        tag = re.match(r"-?\s*(\w+)", body[m.end():close])
        name = tag.group(1) if tag else None
        pos = close + 2
        if name == "raw":
            end = re.compile(r"\{%\s*endraw\s*%\}").search(body, pos)
            if not end:
                errors.append(f"{line(at)}: {{% raw %}} is never closed (a `{{%- endraw -%}}` with dashes does not close it); the build fails")
                break
            pos = end.end()
            continue
        if name == "endraw":
            errors.append(f"{line(at)}: {{% endraw %}} with no {{% raw %}} before it; the build fails")
            continue
        known = name in BLOCKS or name in ENDS or name in MIDDLE or name in SIMPLE
        if in_comment and not known:
            continue  # a comment ignores tags it does not know
        if not known:
            errors.append(f"{line(at)}: `{snippet}` is read as a template tag{f' {name!r}' if name else ''}; the build fails. Wrap it in {{% raw %}} ... {{% endraw %}}")
            continue
        if not in_comment:
            if in_code(at):
                errors.append(f"{line(at)}: template tag `{snippet}` inside code changes the code shown; wrap the code in {{% raw %}} ... {{% endraw %}}")
            elif name not in ("include", "comment", "endcomment"):
                notes.append(f"{line(at)}: `{snippet}` runs as template code; fine if meant")
        if name in BLOCKS:
            stack.append((name, at))
        elif name in ENDS:
            if stack and stack[-1][0] == ENDS[name]:
                stack.pop()
            else:
                errors.append(f"{line(at)}: {{% {name} %}} with no open {{% {ENDS[name]} %}} before it; the build fails")
        elif name in MIDDLE:
            if not stack or stack[-1][0] not in MIDDLE[name]:
                errors.append(f"{line(at)}: {{% {name} %}} outside {' or '.join(sorted(MIDDLE[name]))}; the build fails")
        elif name == "include" and not in_comment:
            inc = re.match(r"-?\s*include\s+([^\s%]+)", body[m.end():close])
            if inc and "{{" not in inc.group(1) and not (bt.DOCS / "_includes" / inc.group(1)).is_file():
                errors.append(f"{line(at)}: include of {inc.group(1)!r}, which is not in docs/_includes; the build fails")
    for t, at in stack:
        errors.append(f"{line(at)}: {{% {t} %}} is never closed with {{% {BLOCKS[t]} %}}; the build fails")
    return errors, notes


def table_lines(lines: list[str]) -> set[int]:
    # kramdown's separator row: only + | : - and spaces, with a - and a |
    is_sep = lambda s: bool(re.fullmatch(r"[+|: \t-]*-[+|: \t-]*", s.strip())) and "|" in s
    out, block = set(), []
    for i, line in enumerate(lines + [""]):
        if line.strip():
            block.append(i)
            continue
        if block and (any(is_sep(lines[j]) for j in block) or all(lines[j].lstrip().startswith("|") for j in block)):
            out.update(j for j in block if "|" in lines[j])
        block = []
    return out


def text_checks(body: str, offset: int) -> list[str]:
    lines = body.splitlines()
    starts, pos = [], 0
    for ln in body.splitlines(keepends=True):
        starts.append(pos)
        pos += len(ln)
    blocks = fences(body)
    in_fence = {i for i, s in enumerate(starts) if any(a <= s < b for a, b in blocks)}
    tables = table_lines(lines)
    notes = []
    for i, line in enumerate(lines):
        if i in in_fence:
            continue
        bare = re.sub(r"(`+)(.+?)\1", "", line)
        where = f"line {offset + i + 1}"
        for seg in re.findall(r"\$\$(.*?)\$\$", bare):
            if re.search(r"(?<!\\)\|", seg) or (i in tables and "\\|" in seg):
                notes.append(f"{where}: `|` inside $$...$$ {'splits the table cell' if i in tables else 'can turn the line into a table'}; write \\vert, \\Vert or \\mid")
                break
        no_math = re.sub(r"\$\$.*?\$\$", "", bare)
        if re.search(r"(?<![\\$\w])\$(?![\s$\d])[^$\n]*?[^\s\\$]\$(?![$\d])", no_math):
            notes.append(f"{where}: `$...$` is plain text on the blog; math needs $$...$$")
        if i in tables:
            continue
        prev = lines[i - 1] if i else ""
        item = LIST_ITEM.match(no_math)
        quote_start = line.lstrip().startswith(">") and not prev.lstrip().startswith(">")
        para_start = not prev.strip() and not line.lstrip().startswith(("<", ">"))
        if item or quote_start or para_start:
            text = no_math[item.end():] if item else MARKERS.sub("", no_math)
            if re.search(r"(?<!\\)\|", text):
                kind = "list item" if item else "box" if quote_start else "paragraph"
                notes.append(f"{where}: a `|` in the first line of a {kind} turns it into a table; write \\| (or \\vert, \\mid in math)")
    return notes


def main(argv):
    kinds, fields = bt.blog_data()
    files = [Path(a) for a in argv] or bt.post_files()
    by_address, _ = bt.addresses()
    errors, warnings = [], []
    if bt.yaml is None:
        print("note: PyYAML not found, using a simple YAML reader; for exact results run\n"
              "      uv run --no-project --with pyyaml python tools/check_posts.py\n")
    for path in files:
        name = path.name
        text = path.read_text()
        try:
            fm, body, offset = bt.split_front_matter(text)
        except bt.FrontMatterError as e:
            errors.append(f"{name}: front matter is not valid YAML ({e}); Jekyll publishes the post empty")
            continue
        if not bt.POST_NAME.fullmatch(name):
            warnings.append(f"{name}: not a post; the name must be YYYY-MM-DD-slug.md")
        elif fm.get("published") is not False:
            addr = bt.post_address(path, fm)
            if addr in bt.RESERVED:
                errors.append(f"{name}: its address {addr} is {bt.RESERVED[addr]}; change the slug")
            others = [p.name for p in by_address.get(addr, []) if p.resolve() != path.resolve()]
            if others:
                errors.append(f"{name}: {addr} is also the address of {', '.join(others)}; Jekyll keeps only one")
        kind = fm.get("kind")
        if kind is not None and kind not in kinds:
            errors.append(f"{name}: kind {kind!r} is not in docs/_data/blog.yml ({', '.join(kinds)})")
        fv = fm.get("fields")
        if isinstance(fv, str):
            warnings.append(f"{name}: fields is one word; write it as a list, fields: [{fv}]")
            fv = [fv]
        for f in fv or []:
            if f not in fields:
                errors.append(f"{name}: field {f!r} is not in docs/_data/blog.yml ({', '.join(fields)})")
        if "<" in str(fm.get("title", "")):
            warnings.append(f"{name}: '<' in the title; the feed drops text that looks like a tag")
        desc = str(fm.get("description") or fm.get("summary") or "")
        if "](" in desc or re.search(r"<a\s|<https?:", desc):
            warnings.append(f"{name}: a link in the description breaks the list of posts (the whole entry is a link)")
        elif re.search(r"<[A-Za-z/]", desc):
            warnings.append(f"{name}: `<...>` in the description; the page shows it, but the feed drops it")
        head = text[: text.find("\n---", 3) + 4] if text.startswith("---") else ""
        left = [p for p in PLACEHOLDERS if p in head] + (["fields: []"] if "fields: []" in head else [])
        if left:
            warnings.append(f"{name}: still has template text: {', '.join(left)}")
        bad, meant = liquid(body, offset)
        errors += [f"{name}: {m}" for m in bad]
        warnings += [f"{name}: {m}" for m in meant]
        if path.suffix != ".html":  # .html posts come from the editor: no Markdown to check
            warnings += [f"{name}: {m}" for m in text_checks(body, offset)]
    for w in warnings:
        print("warning:", w)
    for e in errors:
        print("error:", e)
    if not errors and not warnings:
        print(f"{len(files)} post(s): no problems")
    return 1 if errors else 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
