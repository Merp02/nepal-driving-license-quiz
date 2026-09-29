"""Extract all questions from the Nepali PDF (123.pdf) into rows.

Output: ne_rows.json  -> list of {num, page, text_stream, ticks, images, legacy}
"""
import json
import re
import sys
import nepglyph  # noqa: F401
from nepglyph import token_info
import pdfplumber
from ne_lines import lines_of, char_units

PDF = 'ne.pdf'
LETTERS = ['क', 'ख', 'ग', 'घ']


def glyph_text(c):
    ti = token_info(c['text']) if len(c['text']) == 1 else None
    if ti:
        return ti[2].get('text')
    return c['text']


def find_header(page_lines):
    """Return (y, {letter: xcenter}) for header line with क ख ग घ, else None."""
    for y, cs in page_lines:
        found = {}
        for c in cs:
            t = glyph_text(c)
            if t in LETTERS and c['x0'] > 380:
                found[t] = (c['x0'] + c['x1']) / 2
        if len(found) == 4:
            return y, found
    return None


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
    rows = []
    headings = []
    for pno in range(4, len(pdf.pages) + 1):
        page = pdf.pages[pno - 1]
        plines = lines_of(page.chars)
        hdr = find_header(plines)
        if not hdr:
            print('no header on page', pno, file=sys.stderr)
            continue
        hy, cols = hdr
        # section headings (above tables): lines starting with a Devanagari digit + '.'
        for y, cs in plines:
            s = char_units(cs).strip()
            if re.match(r'^[१२३४५६]\.\s', s):
                headings.append({'page': pno, 'y': y, 'text': s})
        # column boundaries from vertical edges
        vs = sorted(set(round(e['x0']) for e in page.edges if e['orientation'] == 'v' and (e['bottom'] - e['top']) > 40))
        qnum_right = 104
        ans_left = min(cols.values()) - 12
        seps = separators(page, hy)
        # rows: between consecutive separators
        bands = list(zip(seps, seps[1:]))
        for (y0, y1) in bands:
            band_lines = [(y, cs) for y, cs in plines if y0 < y <= y1 + 1]
            if not band_lines:
                continue
            num = ''
            ticks = []
            text_lines = []
            legacy = []
            for y, cs in band_lines:
                left = [c for c in cs if (c['x0'] + c['x1']) / 2 < qnum_right]
                mid = [c for c in cs if qnum_right <= (c['x0'] + c['x1']) / 2 < ans_left]
                right = [c for c in cs if (c['x0'] + c['x1']) / 2 >= ans_left]
                num += ''.join(c['text'] for c in left if c['text'].isdigit())
                for c in right:
                    ti = token_info(c['text']) if len(c['text']) == 1 else None
                    notdef = bool(ti and ti[2].get('name') == '.notdef')
                    if c['text'] == '√' or notdef:
                        xc = (c['x0'] + c['x1']) / 2
                        best = min(cols, key=lambda k: abs(cols[k] - xc))
                        ticks.append(best + ('?' if notdef else ''))
                if mid:
                    t = char_units(mid)
                    if '⦃' in t:
                        legacy.append(t)
                    text_lines.append(t)
            imgs = [
                {'x0': i['x0'], 'top': i['top'], 'x1': i['x1'], 'bottom': i['bottom']}
                for i in page.images
                if y0 - 2 < (i['top'] + i['bottom']) / 2 < y1 + 2
            ]
            rows.append({
                'page': pno, 'y0': y0, 'y1': y1, 'num': num,
                'lines': [re.sub(r'\s+', ' ', t).strip() for t in text_lines if t.strip()],
                'ticks': ticks, 'images': imgs, 'legacy': legacy,
            })
    json.dump({'rows': rows, 'headings': headings}, open('ne_rows.json', 'w'), ensure_ascii=False, indent=1)
    print('rows', len(rows))


if __name__ == '__main__':
    main()
