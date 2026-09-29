"""Independent check: OCR every Nepali question cell and compare with the glyph decode.

Needs tesseract with the Nepali model (tessdata_best/nep.traineddata). Writes ocr_check.json.
"""
import json
import os
import re
import subprocess
import sys
from concurrent.futures import ThreadPoolExecutor
from difflib import SequenceMatcher
from PIL import Image

DPI = 300
S = DPI / 72
TESS = os.environ.get('TESSDATA_PREFIX', '/usr/share/tesseract-ocr/5/tessdata')  # needs nep.traineddata
rows = json.load(open('ne_rows.json'))['rows']
qs = {q['num']: q for q in json.load(open('ne_questions_raw.json'))}
os.makedirs('ocr', exist_ok=True)


def page_png(p):
    out = f'img/ne-{p:03d}-{DPI}'
    if not os.path.exists(out + '.png'):
        subprocess.run(['pdftoppm', '-r', str(DPI), '-f', str(p), '-l', str(p), '-png', '-singlefile', 'ne.pdf', out], check=True)
    return out + '.png'


# group bands by question number (continuations attach to previous)
bands = {}
cur = None
for r in rows:
    if r['num']:
        cur = int(r['num'])
    bands.setdefault(cur, []).append(r)


def ocr_q(n):
    parts = []
    for k, r in enumerate(bands[n]):
        im = Image.open(page_png(r['page']))
        x0 = 106
        if r['images']:
            x0 = max(i['x1'] for i in r['images']) + 3
        x1 = 428 if r['page'] < 56 else 438
        box = (int(x0 * S), int((r['y0'] + 1) * S), int(x1 * S), int((r['y1'] - 1) * S))
        crop = im.crop(box)
        path = f'ocr/q{n}_{k}.png'
        crop.save(path)
        res = subprocess.run(['tesseract', path, '-', '-l', 'nep', '--psm', '6'],
                             capture_output=True, text=True, env=dict(os.environ, TESSDATA_PREFIX=TESS))
        parts.append(res.stdout)
    return n, ' '.join(parts)


def norm(s):
    s = re.sub(r'[\s\(\)\?।,.\-–/:;\'"“”‘’|]', '', s)
    s = s.replace('‍', '').replace('‌', '')
    return s


if __name__ == '__main__':
    nums = sorted(bands)
    # render pages first (serially) to avoid races
    for p in sorted({r['page'] for r in rows}):
        page_png(p)
    with ThreadPoolExecutor(max_workers=8) as ex:
        results = dict(ex.map(ocr_q, nums))
    out = []
    for n in nums:
        dec = qs[n]['stream']
        o = results[n]
        ratio = SequenceMatcher(None, norm(dec), norm(o), autojunk=False).ratio()
        out.append({'num': n, 'ratio': round(ratio, 4), 'ocr': o.strip(), 'dec': dec})
    json.dump(out, open('ocr_check.json', 'w'), ensure_ascii=False, indent=1)
    rs = sorted(x['ratio'] for x in out)
    print('median', rs[len(rs) // 2], 'min', rs[0], 'p10', rs[len(rs) // 10])
