#!/usr/bin/env python3
"""Encrypt the superconducting magnet section into docs/projects/superconducting-magnets/vault/.

The plaintext lives outside the repository (default ../site-private/magnets/):

    meetings.yml        slide calendar: meetings, talks, files, notes
    slides/*.pdf        the decks
    pages/<id>.html     section pages (overview, background, ...): YAML front matter, then HTML
    updates/<slug>.md   update entries: YAML front matter (title, date, summary), then Markdown
    updates/<slug>.html update entries already rendered to HTML (same front matter)
    img/...             figures; pages and updates refer to them as /assets/img/magnets/...
    glossary.yml        terms for the definitions page and the hover links

Run with uv so nothing is installed outside an environment:

    uv run --no-project --with cryptography --with markdown --with pyyaml python tools/magnets_encrypt.py

The password comes from MAGNETS_PASSWORD, else from ~/.config/kyoon-site/magnets.pass,
else it is prompted for twice and saved to that file (mode 600, outside the repository;
--no-save skips saving). If the vault exists, its salt is kept, so remembered logins stay
valid, and the password must open the old vault. --new-password re-keys everything.

Format: PBKDF2-HMAC-SHA256 (1,000,000 iterations, 16-byte salt) -> 32-byte AES-256-GCM key.
site.json holds the page data (associated data "magnets-vault-v1"). Each file is
f/<id>.bin = 12-byte IV || ciphertext || tag (associated data "magnets-vault-v1/<id>").
IVs and ids are HMACs of the content under a key derived from the AES key, so an unchanged
file gives the same bytes and git sees no change; nothing about the content is readable
without the password.

--plain FILE writes the same page data unencrypted to FILE (no password needed), with each
file's path in the private repository instead of a vault blob; the page reads it, and the
files, from kyoon-mit/site-private after GitHub sign-in:

    uv run --no-project --with cryptography --with markdown --with pyyaml python tools/magnets_encrypt.py --plain ../site-private/build/magnets.json
"""
import argparse
import base64
import datetime
import getpass
import hashlib
import hmac
import html
import json
import os
import re
import secrets
import stat
import sys
from pathlib import Path

import markdown
import yaml
from cryptography.exceptions import InvalidTag
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC

ITER = 1_000_000
AAD = b"magnets-vault-v1"
REPO = Path(__file__).resolve().parent.parent
OUT = REPO / "docs" / "projects" / "superconducting-magnets" / "vault"
SRC_DEFAULT = REPO.parent / "site-private" / "magnets"
PW_FILE = Path.home() / ".config" / "kyoon-site" / "magnets.pass"
BASE = "/projects/superconducting-magnets/"
IMG_PREFIX = "/assets/img/magnets/"
TYPES = {".pdf": "application/pdf", ".pptx": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
         ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg",
         ".svg": "image/svg+xml", ".gif": "image/gif", ".webp": "image/webp"}


def b64(b: bytes) -> str:
    return base64.b64encode(b).decode("ascii")


def derive(pw: str, salt: bytes, iters: int) -> bytes:
    return PBKDF2HMAC(algorithm=hashes.SHA256(), length=32, salt=salt, iterations=iters).derive(pw.encode("utf-8"))


class Sealer:
    """Deterministic AES-GCM: IV and file id are HMACs of the content (synthetic IV)."""

    def __init__(self, key: bytes):
        self.aes = AESGCM(key)
        self.mac = hmac.new(key, b"magnets-vault-v1/mac", hashlib.sha256).digest()

    def _h(self, tag: bytes, data: bytes) -> bytes:
        return hmac.new(self.mac, tag + b"|" + hashlib.sha256(data).digest(), hashlib.sha256).digest()

    def seal(self, data: bytes, aad: bytes) -> tuple[bytes, bytes]:
        iv = self._h(b"iv|" + aad, data)[:12]
        return iv, self.aes.encrypt(iv, data, aad)

    def file_id(self, data: bytes) -> str:
        return self._h(b"id", data)[:16].hex()


# ---------------------------------------------------------------------------- reading the plaintext
def front_matter(text: str) -> tuple[dict, str]:
    if text.startswith("---\n"):
        end = text.find("\n---\n", 4)
        if end > 0:
            return yaml.safe_load(text[4:end]) or {}, text[end + 5:]
    return {}, text


MATH = re.compile(r"(\$\$.+?\$\$|\\\[.+?\\\]|\\\(.+?\\\)|(?<![\\$\w])\$(?!\s)[^$\n]+?(?<!\s)\$(?!\w))", re.S)


def render_md(text: str) -> str:
    """Markdown to HTML, with TeX kept verbatim for KaTeX in the browser."""
    keep: list[str] = []

    def stash(m):
        keep.append(m.group(0))
        return f"\x02{len(keep) - 1}\x03"

    body = markdown.markdown(MATH.sub(stash, text), extensions=["extra", "sane_lists", "toc"],
                             output_format="html")
    return re.sub(r"\x02(\d+)\x03", lambda m: html.escape(keep[int(m.group(1))], quote=False), body)


def read_entry(path: Path) -> tuple[dict, str]:
    meta, body = front_matter(path.read_text())
    return meta, (render_md(body) if path.suffix == ".md" else body)


class Builder:
    def __init__(self, src: Path, sealer: Sealer):
        self.src, self.sealer = src, sealer
        self.files: dict[str, dict] = {}
        self.blobs: dict[str, bytes] = {}

    def add_file(self, rel: str, name: str | None = None) -> str:
        p = (self.src / rel).resolve()
        if not p.is_file() or self.src.resolve() not in p.parents:
            raise SystemExit(f"missing or outside the source folder: {rel}")
        data = p.read_bytes()
        fid = self.sealer.file_id(data)
        if fid not in self.files:
            iv, ct = self.sealer.seal(data, AAD + b"/" + fid.encode())
            self.blobs[fid] = iv + ct
            self.files[fid] = {"name": name or p.name, "type": TYPES.get(p.suffix.lower(), "application/octet-stream"),
                               "size": len(data)}
        return fid

    def fix_html(self, body: str) -> str:
        """Images become vault files; links into the old public section become in-page routes."""
        def img(m):
            rel = "img/" + m.group(2)[len(IMG_PREFIX):]
            return f'{m.group(1)}data-vault="{self.add_file(rel)}"'
        body = re.sub(r'(<img\b[^>]*?)src="(' + re.escape(IMG_PREFIX) + r'[^"]+)"', img, body)

        def full(m):
            rel = "img/" + m.group(2)[len(IMG_PREFIX):]
            return f'{m.group(1)}href="#" data-vault-href="{self.add_file(rel)}"'
        body = re.sub(r'(<a\b[^>]*?)href="(' + re.escape(IMG_PREFIX) + r'[^"]+)"', full, body)

        def link(m):
            path = m.group(2)[len(BASE):].strip("/")
            return f'{m.group(1)}"#/{path}"' if path else f'{m.group(1)}"#/"'
        body = re.sub(r'(href=)"(' + re.escape(BASE) + r'[^"#]*)"', link, body)
        return re.sub(r'(href=)"' + re.escape(BASE) + r'#([^"]*)"', r'\1"#/overview#\2"', body)

    def build(self) -> dict:
        src = self.src
        meetings_doc = yaml.safe_load((src / "meetings.yml").read_text()) if (src / "meetings.yml").exists() else {}
        meetings = []
        for m in meetings_doc.get("meetings", []):
            talks = []
            for t in m.get("talks", []):
                talk = {k: t[k] for k in ("title", "speakers", "notes") if k in t}
                if t.get("file"):
                    fid = self.add_file(t["file"], t.get("download_name"))
                    talk["file"] = {"id": fid, **self.files[fid]}
                talk["links"] = [{"label": str(x["label"]), "url": str(x["url"])} for x in t.get("links", [])
                                 if str(x.get("url", "")).startswith("https://")]
                talk["extra"] = []
                for x in t.get("extra", []):
                    fid = self.add_file(x["file"], x.get("download_name"))
                    talk["extra"].append({"id": fid, "label": x.get("label", "Download"), **self.files[fid]})
                talks.append(talk)
            meetings.append({"id": f"{m['date']}-{m['series']}", "date": str(m["date"]), "series": m["series"],
                             "title": m.get("title", ""), "notes": m.get("notes", []), "talks": talks})
        meetings.sort(key=lambda m: m["date"], reverse=True)

        pages = {}
        for p in sorted((src / "pages").glob("*.*")) if (src / "pages").exists() else []:
            if p.suffix not in (".md", ".html"):
                continue
            meta, body = read_entry(p)
            pages[p.stem] = {"title": meta.get("title", p.stem), "summary": meta.get("summary", ""),
                             "html": self.fix_html(body)}

        updates = []
        for p in sorted((src / "updates").glob("*.*")) if (src / "updates").exists() else []:
            if p.suffix not in (".md", ".html"):
                continue
            meta, body = read_entry(p)
            updates.append({"slug": p.stem, "title": meta.get("title", p.stem), "date": str(meta.get("date", p.stem[:10]))[:10],
                            "summary": meta.get("summary", ""), "talk": meta.get("talk"), "html": self.fix_html(body)})
        updates.sort(key=lambda u: (u["date"], u["slug"]))

        glossary = []
        if (src / "glossary.yml").exists():
            for t in yaml.safe_load((src / "glossary.yml").read_text()) or []:
                glossary.append({"id": t["id"], "n": t["term"], "a": t.get("also") or [], "c": bool(t.get("case")),
                                 "o": bool(t.get("only_also")), "s": str(t.get("short", "")).strip(),
                                 "g": t.get("group", ""), "d": render_md(str(t.get("def") or t.get("short", ""))),
                                 "src": render_md(str(t.get("source", ""))).removeprefix("<p>").removesuffix("</p>")})

        data_doc = yaml.safe_load((src / "data.yml").read_text()) if (src / "data.yml").exists() else {}
        datasets = [{k: str(d[k]) for k in ("title", "description", "source", "size", "url") if d.get(k)}
                    for d in (data_doc or {}).get("datasets", [])]
        datasets = [d for d in datasets if d.get("url", "https://").startswith("https://")]

        plan = yaml.safe_load((src / "plan.yml").read_text()) if (src / "plan.yml").exists() else None

        def safe_links(node):
            """Drop any link whose href is not an in-section route or https."""
            if isinstance(node, dict):
                if "href" in node and not str(node["href"]).startswith(("#/", "https://")):
                    return None
                return {k: v for k, v in ((k, safe_links(v)) for k, v in node.items()) if v is not None}
            if isinstance(node, list):
                return [x for x in (safe_links(v) for v in node) if x is not None]
            return node

        return {"v": 1, "built": datetime.date.today().isoformat(), "series": meetings_doc.get("series", {}),
                "meetings": meetings, "pages": pages, "updates": updates, "glossary": glossary,
                "datasets": datasets, "plan": safe_links(plan), "files": self.files}


class PlainBuilder(Builder):
    """Files keep their path in the private repository; nothing is encrypted."""

    def __init__(self, src: Path):
        super().__init__(src, None)

    def add_file(self, rel: str, name: str | None = None) -> str:
        p = (self.src / rel).resolve()
        if not p.is_file() or self.src.resolve() not in p.parents:
            raise SystemExit(f"missing or outside the source folder: {rel}")
        data = p.read_bytes()
        fid = hashlib.sha256(data).hexdigest()[:32]
        if fid not in self.files:
            path = f"{self.src.resolve().name}/{p.relative_to(self.src.resolve()).as_posix()}"
            self.files[fid] = {"name": name or p.name, "type": TYPES.get(p.suffix.lower(), "application/octet-stream"),
                               "size": len(data), "path": path}
        return fid


# ---------------------------------------------------------------------------- password
def read_password(new: bool, save: bool) -> str:
    pw = os.environ.get("MAGNETS_PASSWORD")
    if pw:
        return pw
    if PW_FILE.exists() and not new:
        return PW_FILE.read_text().rstrip("\n")
    pw = getpass.getpass("Password for the magnet pages: ")
    if not pw or getpass.getpass("Repeat: ") != pw:
        raise SystemExit("empty or different passwords")
    if save:
        PW_FILE.parent.mkdir(parents=True, exist_ok=True, mode=0o700)
        fd = os.open(PW_FILE, os.O_WRONLY | os.O_CREAT | os.O_TRUNC, stat.S_IRUSR | stat.S_IWUSR)
        with os.fdopen(fd, "w") as f:
            f.write(pw + "\n")
        os.chmod(PW_FILE, 0o600)
        print(f"saved the password to {PW_FILE} (readable only by you)")
    return pw


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("src", type=Path, nargs="?", default=SRC_DEFAULT, help="plaintext folder (default ../site-private/magnets)")
    ap.add_argument("--out", type=Path, default=OUT, help="output folder (default the site's vault folder)")
    ap.add_argument("--new-password", action="store_true", help="re-key with a new password and salt")
    ap.add_argument("--no-save", action="store_true", help="do not save a prompted password")
    ap.add_argument("--plain", type=Path, help="write the page data unencrypted to this file instead of the vault")
    args = ap.parse_args()

    if args.plain:
        builder = PlainBuilder(args.src)
        data = builder.build()
        args.plain.parent.mkdir(parents=True, exist_ok=True)
        args.plain.write_text(json.dumps(data, ensure_ascii=False, indent=1, sort_keys=True) + "\n")
        print(f"wrote {args.plain}: {len(data['meetings'])} meetings, {len(data['pages'])} pages, "
              f"{len(data['updates'])} updates, {len(data['glossary'])} terms, {len(data['files'])} files")
        return 0

    out: Path = args.out
    site = out / "site.json"
    old = json.loads(site.read_text()) if site.exists() else None
    pw = read_password(args.new_password or not old, not args.no_save)
    if old and not args.new_password:
        salt = base64.b64decode(old["salt"])
        try:
            AESGCM(derive(pw, salt, old["iter"])).decrypt(base64.b64decode(old["iv"]), base64.b64decode(old["ct"]), AAD)
        except InvalidTag:
            print("This password does not open the existing vault. Use --new-password to change it.", file=sys.stderr)
            return 2
    else:
        salt = secrets.token_bytes(16)

    key = derive(pw, salt, ITER)
    sealer = Sealer(key)
    builder = Builder(args.src, sealer)
    data = builder.build()
    payload = json.dumps(data, ensure_ascii=False, separators=(",", ":"), sort_keys=True).encode("utf-8")
    iv, ct = sealer.seal(payload, AAD)

    (out / "f").mkdir(parents=True, exist_ok=True)
    for fid, blob in builder.blobs.items():
        p = out / "f" / f"{fid}.bin"
        if not p.exists() or p.read_bytes() != blob:
            p.write_bytes(blob)
    stale = [p for p in (out / "f").glob("*.bin") if p.stem not in builder.blobs]
    for p in stale:
        p.unlink()
    site.write_text(json.dumps({"v": 1, "kdf": "PBKDF2-SHA256", "iter": ITER, "salt": b64(salt),
                                "iv": b64(iv), "ct": b64(ct)}, indent=1) + "\n")
    print(f"wrote {site}: {len(data['meetings'])} meetings, {len(data['pages'])} pages, {len(data['updates'])} updates, "
          f"{len(data['glossary'])} terms, {len(builder.blobs)} files ({sum(len(b) for b in builder.blobs.values())} bytes)"
          + (f"; removed {len(stale)} stale files" if stale else ""))
    return 0


if __name__ == "__main__":
    sys.exit(main())
