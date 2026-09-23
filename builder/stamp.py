#!/usr/bin/env python3
"""Stamp a version onto every script URL so a deploy is never served stale.

GitHub Pages sends cache-control: max-age=600, and a hard refresh does not
reliably re-fetch ES modules. A changing query string does.

The stamp is a hash of the files themselves, not the last commit — the commit
sha is always one behind when this runs before `git commit`, which served a
cached copy of a file that had in fact changed.
"""
import re, hashlib, pathlib

root = pathlib.Path(__file__).parent
FILES = ("app.js", "ai.js", "fields.js", "png.js", "master-prompt.js", "style.css")


def version():
    digest = hashlib.sha1()
    for name in sorted(FILES):
        path = root / name
        if not path.exists():
            continue
        # ignore the stamps themselves, or the hash chases its own tail
        digest.update(re.sub(r"\?v=[a-z0-9]+", "", path.read_text()).encode())
    return digest.hexdigest()[:8]


stamp = f"?v={version()}"

html = (root / "index.html").read_text()
html = re.sub(r'(src="app\.js)(\?v=[^"]*)?"', rf'\1{stamp}"', html)
html = re.sub(r'(href="style\.css)(\?v=[^"]*)?"', rf'\1{stamp}"', html)
(root / "index.html").write_text(html)

for name in ("app.js", "ai.js"):
    path = root / name
    text = path.read_text()
    text = re.sub(r'(from "\./[a-z-]+\.js)(\?v=[^"]*)?"', rf'\1{stamp}"', text)
    path.write_text(text)

print("stamped", stamp)
