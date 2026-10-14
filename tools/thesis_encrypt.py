#!/usr/bin/env python3
"""Encrypt the private thesis notes into docs/thesis/vault.json.

The notes live outside the repository, one folder per section:

    SRC/
      bns/
        _section.md       first line "# Title"; the rest is the section's note
        01-a-note.md      an article: first line "# Title", then Markdown
        02-snippet.tex    a LaTeX snippet; title from a first line "% Title"

Run with uv so nothing is installed outside an environment:

    THESIS_PASSWORD=... uv run --with cryptography tools/thesis_encrypt.py SRC

Without THESIS_PASSWORD the password is prompted for; it is never written to
disk. If vault.json exists, its salt is kept, so remembered logins stay valid,
and the password must open the old vault, so a typo cannot re-key it. Pass
--new-password to change the password (this logs everyone out).

Format: PBKDF2-HMAC-SHA256 (1,000,000 iterations, 16-byte salt) -> AES-256-GCM
(12-byte IV, tag appended, associated data "thesis-vault-v1").
"""
import argparse
import base64
import datetime
import getpass
import json
import os
import re
import secrets
import sys
from pathlib import Path

from cryptography.exceptions import InvalidTag
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC

ITER = 1_000_000
AAD = b"thesis-vault-v1"
OUT = Path(__file__).resolve().parent.parent / "docs" / "thesis" / "vault.json"


def derive(pw: str, salt: bytes, iters: int) -> bytes:
    kdf = PBKDF2HMAC(algorithm=hashes.SHA256(), length=32, salt=salt, iterations=iters)
    return kdf.derive(pw.encode("utf-8"))


def title_of(text: str, fallback: str, mark: str) -> tuple[str, str]:
    lines = text.splitlines()
    if lines and lines[0].startswith(mark + " "):
        return lines[0][len(mark) + 1:].strip(), "\n".join(lines[1:]).strip("\n")
    return fallback, text


def collect(src: Path) -> dict:
    sections = []
    for d in sorted(p for p in src.iterdir() if p.is_dir() and not p.name.startswith(".")):
        sec = {"id": re.sub(r"[^a-z0-9-]", "-", d.name.lower()), "title": d.name.upper(), "note": "", "articles": []}
        head = d / "_section.md"
        if head.exists():
            sec["title"], sec["note"] = title_of(head.read_text(), sec["title"], "#")
        for f in sorted(d.iterdir()):
            if f.name.startswith(("_", ".")) or f.suffix not in (".md", ".tex"):
                continue
            text = f.read_text()
            kind = "tex" if f.suffix == ".tex" else "md"
            title, body = title_of(text, f.stem, "%" if kind == "tex" else "#")
            sec["articles"].append({"id": f.stem, "title": title, "kind": kind, "text": body if kind == "md" else text})
        sections.append(sec)
    return {
        "title": "My unfinished LaTeX snippets",
        "built": datetime.date.today().isoformat(),
        "sections": sections,
    }


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("src", type=Path, help="folder with one subfolder per section")
    ap.add_argument("--new-password", action="store_true", help="re-key with a new password and salt")
    args = ap.parse_args()

    pw = os.environ.get("THESIS_PASSWORD") or getpass.getpass("Thesis password: ")
    if not pw:
        print("empty password", file=sys.stderr)
        return 1

    old = json.loads(OUT.read_text()) if OUT.exists() else None
    if old and not args.new_password:
        salt = base64.b64decode(old["salt"])
        try:
            AESGCM(derive(pw, salt, old["iter"])).decrypt(base64.b64decode(old["iv"]), base64.b64decode(old["ct"]), AAD)
        except InvalidTag:
            print("This password does not open the existing vault. Use --new-password to change it.", file=sys.stderr)
            return 2
    else:
        if not os.environ.get("THESIS_PASSWORD") and getpass.getpass("Repeat: ") != pw:
            print("passwords differ", file=sys.stderr)
            return 1
        salt = secrets.token_bytes(16)

    payload = json.dumps(collect(args.src), ensure_ascii=False, separators=(",", ":")).encode("utf-8")
    iv = secrets.token_bytes(12)
    ct = AESGCM(derive(pw, salt, ITER)).encrypt(iv, payload, AAD)
    b64 = lambda b: base64.b64encode(b).decode("ascii")
    OUT.write_text(json.dumps({"v": 1, "kdf": "PBKDF2-SHA256", "iter": ITER, "salt": b64(salt), "iv": b64(iv), "ct": b64(ct)}, indent=1) + "\n")
    print(f"wrote {OUT} ({len(payload)} bytes of notes)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
