#!/usr/bin/env python3
"""Convert the usage report markdown to styled HTML (letter, print-friendly)."""
import sys
from pathlib import Path
import markdown

md_path = Path(sys.argv[1])
html_path = Path(sys.argv[2])

body = markdown.markdown(
    md_path.read_text(encoding="utf-8"),
    extensions=["tables", "fenced_code", "toc", "sane_lists"],
    output_format="html5",
)

css = """
@page { size: Letter; margin: 0.6in 0.7in; }
* { box-sizing: border-box; }
body {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Inter", Helvetica, Arial, sans-serif;
  color: #1b1c1d;
  font-size: 10.5pt;
  line-height: 1.45;
  max-width: 7.1in;
  margin: 0 auto;
}
h1 { font-size: 20pt; margin: 0 0 0.4rem 0; color: #0b1220; }
h2 { font-size: 14pt; margin: 1.4rem 0 0.4rem; color: #0b1220; border-bottom: 1px solid #d0d7de; padding-bottom: 4px; }
h3 { font-size: 11.5pt; margin: 1.0rem 0 0.3rem; color: #0b1220; }
p { margin: 0.35rem 0; }
strong { color: #0b1220; }
code { font-family: "SF Mono", Menlo, Consolas, monospace; font-size: 9.2pt; background: #f2f4f7; padding: 0 3px; border-radius: 3px; }
hr { border: none; border-top: 1px solid #d0d7de; margin: 1.1rem 0; }
ul, ol { margin: 0.35rem 0 0.35rem 1.3rem; padding: 0; }
li { margin: 0.15rem 0; }
table { border-collapse: collapse; width: 100%; margin: 0.5rem 0 0.8rem; font-size: 9.6pt; page-break-inside: avoid; }
th, td { border: 1px solid #d0d7de; padding: 4px 8px; text-align: left; vertical-align: top; }
th { background: #f5f7fa; font-weight: 600; color: #0b1220; }
tr:nth-child(even) td { background: #fafbfc; }
em { color: #556; }
"""

html = f"""<!doctype html>
<html><head><meta charset="utf-8">
<title>Dashboard Usage Report — 2026-08-07</title>
<style>{css}</style></head>
<body>
{body}
</body></html>
"""
html_path.write_text(html, encoding="utf-8")
print(f"Wrote {html_path}")
