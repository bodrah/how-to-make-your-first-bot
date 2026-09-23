#!/usr/bin/env python3
"""Stamp a version onto every script URL so a deploy is never served stale.

GitHub Pages sends cache-control: max-age=600, and a hard refresh does not
reliably re-fetch ES modules. A changing query string does.
"""
import re, subprocess, pathlib

root = pathlib.Path(__file__).parent
version = subprocess.run(["git", "log", "-1", "--format=%h"], capture_output=True, text=True,
                         cwd=root).stdout.strip() or "dev"
stamp = f"?v={version}"

html = (root / "index.html").read_text()
html = re.sub(r'(src="app\.js)(\?v=[^"]*)?"', rf'\1{stamp}"', html)
html = re.sub(r'(href="style\.css)(\?v=[^"]*)?"', rf'\1{stamp}"', html)
(root / "index.html").write_text(html)

for name in ("app.js", "ai.js"):
    path = root / name
    text = path.read_text()
    text = re.sub(r'(from "\./[a-z-]+\.js)(\?v=[^"]*)?"', rf'\1{stamp}"', text)
    path.write_text(text)

print("stamped", version)
