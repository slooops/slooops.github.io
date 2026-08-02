#!/usr/bin/env bash
# scripts/md-to-pdf.sh
# ---------------------------------------------------------------------------
# Renders a Markdown file (with Mermaid diagrams and KaTeX math) to PDF via
# headless Chrome. Handles the "mermaid doesn't render in PDF" problem by
# pre-rendering all ```mermaid blocks to SVG images with @mermaid-js/mermaid-cli
# before piping through md-to-pdf (which uses Puppeteer under the hood).
#
# Prereqs: Node.js (for npx), Google Chrome installed.
#          Both tooling packages are pulled on-demand via `npx --yes`; no
#          global installs required.
#
# Usage:
#   scripts/md-to-pdf.sh <input.md> [output.pdf]
#
# Examples:
#   scripts/md-to-pdf.sh JUL26_YE_WD1_PIPELINE_REPORT.md
#   scripts/md-to-pdf.sh docs/report.md ~/Desktop/report.pdf
# ---------------------------------------------------------------------------

set -euo pipefail

if [[ $# -lt 1 ]]; then
  echo "Usage: $0 <input.md> [output.pdf]" >&2
  exit 1
fi

INPUT_MD="$1"

if [[ ! -f "$INPUT_MD" ]]; then
  echo "Error: input file not found: $INPUT_MD" >&2
  exit 1
fi

# Resolve absolute paths
INPUT_MD="$(cd "$(dirname "$INPUT_MD")" && pwd)/$(basename "$INPUT_MD")"
INPUT_DIR="$(dirname "$INPUT_MD")"
INPUT_BASE="$(basename "$INPUT_MD" .md)"
OUTPUT_PDF="${2:-$INPUT_DIR/$INPUT_BASE.pdf}"

# Locate repo root (this script's parent dir's parent)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
CONFIG_JSON="$SCRIPT_DIR/md-to-pdf.config.json"

if [[ ! -f "$CONFIG_JSON" ]]; then
  echo "Error: config not found: $CONFIG_JSON" >&2
  exit 1
fi

WORK_DIR="$(mktemp -d -t md2pdf-XXXXXX)"
if [[ "${MD2PDF_KEEP_WORKDIR:-}" != "1" ]]; then
  trap 'rm -rf "$WORK_DIR"' EXIT
else
  echo "==> Keeping work dir: $WORK_DIR"
fi

# Copy input into work dir so mmdc writes SVGs alongside it and md-to-pdf
# resolves relative image refs correctly.
REWRITTEN_MD="$WORK_DIR/$INPUT_BASE.md"
cp "$INPUT_MD" "$REWRITTEN_MD"

echo "==> [1/3] Pre-rendering Mermaid blocks to PNG..."
# mmdc replaces ```mermaid ...``` fenced blocks with <img src="./file-N.png">
# tags inline. PNG at scale=3 = crisp on retina + robust across PDF pipelines.
npx --yes -p @mermaid-js/mermaid-cli@11.4.0 mmdc \
  --input  "$REWRITTEN_MD" \
  --output "$REWRITTEN_MD" \
  --outputFormat png \
  --scale 3 \
  --backgroundColor white \
  --theme default

echo "==> [2/3] Inlining PNG images as base64 data URIs..."
# md-to-pdf's Puppeteer uses page.setContent() with about:blank base URL, so
# relative './file.png' refs never resolve. Base64-inlining sidesteps that
# entirely — the image bytes travel inside the markdown.
node - "$REWRITTEN_MD" <<'NODE_INLINE'
const fs = require('fs');
const path = require('path');
const mdPath = process.argv[2];
const mdDir = path.dirname(mdPath);
let md = fs.readFileSync(mdPath, 'utf8');
const re = /!\[([^\]]*)\]\(\.\/([^)\s]+\.(png|jpe?g|gif|svg))\)/g;
let count = 0;
md = md.replace(re, (match, alt, fname, ext) => {
  const filePath = path.join(mdDir, fname);
  if (!fs.existsSync(filePath)) return match;
  const mime = ext === 'svg' ? 'image/svg+xml' : (ext === 'jpg' ? 'image/jpeg' : `image/${ext}`);
  const b64 = fs.readFileSync(filePath).toString('base64');
  count++;
  return `![${alt}](data:${mime};base64,${b64})`;
});
fs.writeFileSync(mdPath, md);
console.log(`   Inlined ${count} image(s).`);
NODE_INLINE

echo "==> [3/3] Rendering PDF via headless Chrome..."
# md-to-pdf reads its config from --config-file; script + KaTeX + styling
# live in scripts/md-to-pdf.config.json.
npx --yes md-to-pdf@5.2.4 \
  --config-file "$CONFIG_JSON" \
  "$REWRITTEN_MD"

GENERATED_PDF="$WORK_DIR/$INPUT_BASE.pdf"
if [[ ! -f "$GENERATED_PDF" ]]; then
  echo "Error: md-to-pdf did not produce $GENERATED_PDF" >&2
  exit 1
fi

mv "$GENERATED_PDF" "$OUTPUT_PDF"
echo ""
echo "✓ PDF written to: $OUTPUT_PDF"
echo "  ($(du -h "$OUTPUT_PDF" | cut -f1))"
