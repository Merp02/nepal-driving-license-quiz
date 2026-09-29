"""Extract all questions from the English PDF (1234.pdf)."""
import json
import re
import sys
import nepglyph  # noqa: F401
import pdfplumber
from ne_lines import lines_of, char_units

PDF = 'en.pdf'
LETTERS = ['A', 'B', 'C', 'D']


def find_headers(page_lines):
    """All header lines on the page (a page can hold two tables)."""
    out = []
    for y, cs in page_lines:
        found = {}
        for c in cs:
            if c['text'] in LETTERS and c['x0'] > 380:
                found[c['text']] = (c['x0'] + c['x1']) / 2
        if len(found) == 4 and len(cs) <= 12:
            out.append((y, found))
    return out


def qcol_boundary(page, y0, y1):
    mid = (y0 + y1) / 2
    xs = [e['x0'] for e in page.edges if e['orientation'] == 'v'
          and 80 < e['x0'] < 200 and e['top'] - 1 <= mid <= e['bottom'] + 1]
    return min(xs) if xs else 104


def separators(page, y_min):
    hs = [e for e in page.edges if e['orientation'] == 'h' and (e['x1'] - e['x0']) > 200]
    ys = sorted(e['top'] for e in hs if e['top'] > y_min)
    out = []
    for y in ys:
        if not out or y - out[-1] > 2.0:
            out.append(y)
    return out


def main():
    pdf = pdfplumber.open(PDF)
    rows, headings = [], []
    for pno in range(4, len(pdf.pages) + 1):
        page = pdf.pages[pno - 1]
        plines = lines_of(page.chars)
        for y, cs in plines:
            s = char_units(cs).strip()
            if re.match(r'^[1-6]\.\s+[A-Z]', s) and 'Instructions' not in s:
                headings.append({'page': pno, 'y': y, 'text': s})
        hdrs = find_headers(plines)
        if not hdrs:
            print('no header on page', pno, file=sys.stderr)
            continue
        seps = separators(page, hdrs[0][0])
        for (y0, y1) in zip(seps, seps[1:]):
            above = [h for h in hdrs if h[0] <= y0 + 1]
            if not above or any(y0 < h[0] <= y1 + 1 for h in hdrs):
                continue  # header band of a second table
            cols = above[-1][1]
            ans_left = min(cols.values()) - 12
            qnum_right = qcol_boundary(page, y0, y1)
            band_lines = [(y, cs) for y, cs in plines if y0 < y <= y1 + 1]
            if not band_lines:
                continue
            num, ticks, text_lines = '', [], []
            for y, cs in band_lines:
                left = [c for c in cs if (c['x0'] + c['x1']) / 2 < qnum_right]
                mid = [c for c in cs if qnum_right <= (c['x0'] + c['x1']) / 2 < ans_left]
                right = [c for c in cs if (c['x0'] + c['x1']) / 2 >= ans_left]
                num += ''.join(c['text'] for c in left if c['text'].isdigit())
                for c in right:
                    if c['text'] in ('√', '✓', '✔'):
                        xc = (c['x0'] + c['x1']) / 2
                        ticks.append(min(cols, key=lambda k: abs(cols[k] - xc)))
                    elif c['text'].strip():
                        ticks.append('odd:' + c['text'])
                if mid:
                    text_lines.append(char_units(mid))
            imgs = [
                {'x0': i['x0'], 'top': i['top'], 'x1': i['x1'], 'bottom': i['bottom']}
                for i in page.images
                if y0 - 2 < (i['top'] + i['bottom']) / 2 < y1 + 2
            ]
            rows.append({'page': pno, 'y0': y0, 'y1': y1, 'num': num,
                         'lines': [re.sub(r'\s+', ' ', t).strip() for t in text_lines if t.strip()],
                         'ticks': ticks, 'images': imgs})
    json.dump({'rows': rows, 'headings': headings}, open('en_rows.json', 'w'), ensure_ascii=False, indent=1)
    print('rows', len(rows))


if __name__ == '__main__':
    main()
