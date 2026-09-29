#!/usr/bin/env bash
# Rebuild the question bank from the two DoTM PDFs.
#
#   scripts/pdf-extract/run.sh path/to/123.pdf path/to/1234.pdf
#
# 123.pdf  = official Nepali question bank (primary source)
# 1234.pdf = English translation (reference)
#
# Writes src/data/questions.json, src/data/examConfig.json and public/signs/*.webp.
# Needs: python3 with the packages in requirements.txt, and poppler-utils (pdftoppm).
set -euo pipefail

if [ $# -ne 2 ]; then
  echo "usage: $0 NEPALI_PDF ENGLISH_PDF" >&2
  exit 1
fi

HERE="$(cd "$(dirname "$0")" && pwd)"
ROOT="$(cd "$HERE/../.." && pwd)"
WORK="${WORK:-$HERE/work}"

mkdir -p "$WORK"
cp "$1" "$WORK/ne.pdf"
cp "$2" "$WORK/en.pdf"
cd "$WORK"
export PYTHONPATH="$HERE"

python3 "$HERE/extract_ne.py"
python3 "$HERE/build_ne.py"
python3 "$HERE/extract_en.py"
python3 "$HERE/build_en.py"
python3 "$HERE/crop_signs.py"
python3 "$HERE/build_dataset.py"

python3 - "$ROOT" <<'PY'
import json, shutil, sys, glob, os
root = sys.argv[1]
questions = json.load(open('out/questions.json'))
with open(os.path.join(root, 'src/data/questions.json'), 'w') as f:
    json.dump(questions, f, ensure_ascii=False, indent=2)
    f.write('\n')
shutil.copy('out/examConfig.json', os.path.join(root, 'src/data/examConfig.json'))
os.makedirs(os.path.join(root, 'public/signs'), exist_ok=True)
for path in glob.glob('out/signs/*.webp'):
    shutil.copy(path, os.path.join(root, 'public/signs'))
print('installed', len(questions), 'questions into', root)
PY

echo "Done. Run 'npm test' to validate the data."
