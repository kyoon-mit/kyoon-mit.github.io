"""Start a blog post from a template.

    python3 tools/new_post.py paper "My summary of the paper" --fields ml physics
    python3 tools/new_post.py concept "Fourier transforms" --fields physics
    python3 tools/new_post.py concept "Attention" --slug attention-2027

Writes docs/_posts/YYYY-MM-DD-<slug>.md from docs/_templates/<kind>.md, with
today's date and time, and prints its path. The slug comes from the title
unless --slug is given; it is the post's address, /blog/<slug>/, so it must
differ from every other post's address (on any date) and from the reserved
/blog/style/. Field keys are in docs/_data/blog.yml.
"""

import argparse
import datetime
import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import blogtools as bt  # noqa: E402


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("kind", help="template name in docs/_templates (paper or concept)")
    ap.add_argument("title")
    ap.add_argument("--fields", nargs="*", default=[], help="field keys from docs/_data/blog.yml")
    ap.add_argument("--slug", help="the post's address under /blog/, default from the title")
    ap.add_argument("--date", help="YYYY-MM-DD, default today")
    a = ap.parse_args()

    template = bt.DOCS / "_templates" / f"{a.kind}.md"
    if not template.exists():
        sys.exit(f"no template {template}")

    now = datetime.datetime.now().astimezone()
    if a.date:
        try:
            day = datetime.date.fromisoformat(a.date)
        except ValueError:
            sys.exit(f"bad --date {a.date!r}, want YYYY-MM-DD")
        stamp = now.replace(year=day.year, month=day.month, day=day.day)
    else:
        stamp = now

    known = bt.blog_data()[1]
    fields = [f for arg in a.fields for f in re.split(r"[,\s]+", arg) if f]
    unknown = [f for f in fields if f not in known]
    if unknown:
        sys.exit(f"unknown field(s) {unknown}; known: {known} (add new ones to docs/_data/blog.yml)")

    slug = bt.new_slug(a.slug or a.title)
    if not slug:
        sys.exit("the title gives an empty slug; pass --slug")
    address = f"/blog/{slug}/"
    if address in bt.RESERVED:
        sys.exit(f"{address} is {bt.RESERVED[address]}; pass --slug")
    by_address, unreadable = bt.addresses()
    for bad in unreadable:
        print(f"warning: {bad} has front matter that is not valid YAML; its address was not checked", file=sys.stderr)
    taken = by_address.get(address)
    if taken:
        sys.exit(f"{taken[0]} already has the address {address}; pass --slug")

    title = a.title.replace("\\", "\\\\").replace('"', '\\"')
    text = template.read_text().replace('title: "TITLE"', f'title: "{title}"', 1)
    text = text.replace("fields: [FIELD]", f"fields: [{', '.join(fields)}]", 1)
    text = text.replace("\n---\n", f"\ndate: {stamp.strftime('%Y-%m-%d %H:%M:%S %z')}\n---\n", 1)
    out = bt.POSTS / f"{stamp.date().isoformat()}-{slug}.md"
    bt.POSTS.mkdir(exist_ok=True)
    out.write_text(text)
    print(out)


if __name__ == "__main__":
    main()
