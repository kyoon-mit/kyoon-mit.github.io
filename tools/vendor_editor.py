"""Refresh the blog editor's libraries in docs/assets/vendor/.

    python3 tools/vendor_editor.py

Downloads the pinned npm packages below (checking each against the
registry's sha512), copies their ES module builds into docs/assets/vendor/
with bare imports rewritten to relative paths (so browsers load them with no
bundler), and writes LICENSES.txt. To update a library, change its version
here, run this, and test /blog/edit/ before pushing.
"""

import base64
import hashlib
import io
import json
import re
import sys
import tarfile
import tempfile
import urllib.request
from pathlib import Path

OUT = Path(__file__).resolve().parent.parent / "docs" / "assets" / "vendor"

# npm package -> (version, file name under vendor/prosemirror/)
PROSEMIRROR = {
    "prosemirror-model": ("1.25.12", "model"),
    "prosemirror-state": ("1.4.4", "state"),
    "prosemirror-view": ("1.42.6", "view"),
    "prosemirror-transform": ("1.12.2", "transform"),
    "prosemirror-commands": ("1.7.2", "commands"),
    "prosemirror-keymap": ("1.2.3", "keymap"),
    "prosemirror-history": ("1.5.1", "history"),
    "prosemirror-inputrules": ("1.5.1", "inputrules"),
    "prosemirror-schema-list": ("1.5.1", "schema-list"),
    "prosemirror-dropcursor": ("1.8.4", "dropcursor"),
    "prosemirror-gapcursor": ("1.4.1", "gapcursor"),
    "prosemirror-tables": ("1.8.5", "tables"),
    "orderedmap": ("2.1.1", "orderedmap"),
    "rope-sequence": ("1.3.4", "rope-sequence"),
    "w3c-keyname": ("2.2.8", "w3c-keyname"),
}
JS_YAML = "4.1.1"
HIGHLIGHT = "11.11.1"
LANGUAGES = ["python", "bash", "shell", "c", "cpp", "julia", "julia-repl", "javascript", "typescript",
             "json", "yaml", "ini", "latex", "markdown", "sql", "rust", "go", "xml", "css", "diff",
             "makefile", "dockerfile", "matlab", "r", "fortran", "cmake", "plaintext"]


def fetch(name, version, into):
    with urllib.request.urlopen(f"https://registry.npmjs.org/{name}/{version}") as r:
        meta = json.load(r)
    data = urllib.request.urlopen(meta["dist"]["tarball"]).read()
    algo, want = meta["dist"]["integrity"].split("-", 1)
    if base64.b64encode(hashlib.new(algo, data).digest()).decode() != want:
        sys.exit(f"{name}@{version}: download does not match the registry's checksum")
    dest = into / name
    with tarfile.open(fileobj=io.BytesIO(data)) as t:
        for m in t.getmembers():
            parts = Path(m.name).parts[1:]
            if not m.isfile() or m.name.startswith("/") or ".." in parts:
                continue
            p = dest.joinpath(*parts)
            p.parent.mkdir(parents=True, exist_ok=True)
            p.write_bytes(t.extractfile(m).read())
    return dest


def license_of(pkg, name, version):
    for cand in ("LICENSE", "LICENSE.md", "LICENSE.txt"):
        if (pkg / cand).exists():
            return f"==== {name} {version} ====\n" + (pkg / cand).read_text().strip() + "\n"
    sys.exit(f"{name}: no license file")


def main():
    licenses = []
    with tempfile.TemporaryDirectory() as tmp:
        tmp = Path(tmp)
        (OUT / "prosemirror").mkdir(parents=True, exist_ok=True)
        short = {n: s for n, (_, s) in PROSEMIRROR.items()}
        for name, (version, file) in PROSEMIRROR.items():
            pkg = fetch(name, version, tmp)
            text = (pkg / ("index.js" if name == "w3c-keyname" else "dist/index.js")).read_text()

            def rewrite(m):
                if m.group(2) not in short:
                    sys.exit(f"{name}: imports {m.group(2)}, which is not vendored")
                return f"{m.group(1)}'./{short[m.group(2)]}.js'"
            text = re.sub(r"""(\bfrom\s*)['"]([^'"]+)['"]""", rewrite, text)
            text = re.sub(r"\n//# sourceMappingURL=.*\n?$", "\n", text)
            (OUT / "prosemirror" / f"{file}.js").write_text(text)
            licenses.append(license_of(pkg, name, version))
        pkg = fetch("js-yaml", JS_YAML, tmp)
        (OUT / "js-yaml.js").write_text((pkg / "dist/js-yaml.mjs").read_text())
        licenses.append(license_of(pkg, "js-yaml", JS_YAML))
        # the ES module core comes from the CDN build, the languages from the npm package
        core = fetch("@highlightjs/cdn-assets", HIGHLIGHT, tmp)
        pkg = fetch("highlight.js", HIGHLIGHT, tmp)
        (OUT / "highlight/languages").mkdir(parents=True, exist_ok=True)
        (OUT / "highlight/core.js").write_text((core / "es/core.js").read_text())
        for lang in LANGUAGES:
            (OUT / f"highlight/languages/{lang}.js").write_text((pkg / f"es/languages/{lang}.js").read_text())
        licenses.append(license_of(pkg, "highlight.js", HIGHLIGHT))
    (OUT / "LICENSES.txt").write_text("Third-party code used by the blog editor (/blog/edit/).\n\n" + "\n".join(licenses))
    print(f"vendored into {OUT}")


if __name__ == "__main__":
    main()
