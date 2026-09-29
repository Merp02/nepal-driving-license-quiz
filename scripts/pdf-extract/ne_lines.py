import re
import nepglyph  # noqa: F401  (patches pdfminer before pdfplumber loads fonts)
from nepglyph import token_info, classify, decode_glyphs
import pdfplumber

PREETI = {}


def char_units(chars):
    """Turn a stream-ordered list of pdfplumber chars into text, decoding tokens.

    Consecutive Devanagari glyph tokens form a run decoded together; other
    characters pass through. Adds spaces for visible gaps.
    """
    out = []
    run = []
    last_x1 = None
    last_size = 10

    def flush():
        if run:
            out.append(decode_glyphs(run))
            run.clear()

    # Word draws ZWJ/ZWNJ with the space glyph but gives it no advance; the
    # next glyph starts where the "space" starts.  Drop those.
    kept = []
    for i, c in enumerate(chars):
        if i + 1 < len(chars):
            ti = token_info(c['text']) if len(c['text']) == 1 else None
            is_space = c['text'] == ' ' or (ti and ti[2].get('text') == ' ')
            nxt = chars[i + 1]
            if is_space and nxt['x0'] < c['x0'] + 0.3 * max(c['x1'] - c['x0'], 0.1):
                continue
        kept.append(c)
    chars = kept

    for c in chars:
        t = c['text']
        ti = token_info(t) if len(t) == 1 else None
        # gap-based space insertion (only for spacing glyphs)
        width = c['x1'] - c['x0']
        joined = bool(run) and run[-1][1] in ('half', 'eyelash')  # half forms always join the next consonant
        if last_x1 is not None and width > 0.01 and c['x0'] - last_x1 > 0.22 * last_size and not joined:
            flush()
            if not (out and out[-1].endswith(' ')) and t != ' ':
                out.append(' ')
        if ti:
            idx, gid, info = ti
            txt = info.get('text')
            if txt is None:
                txt = '�'
            run.append((txt, classify(txt, info)))
        else:
            flush()
            if 'Preeti' in c['fontname'] or 'PCS' in c['fontname']:
                out.append('⦃' + t + '⦄')  # mark legacy-font text for later conversion
            else:
                out.append(t)
        if width > 0.01:
            last_x1 = c['x1']
            last_size = c['size']
    flush()
    s = ''.join(out)
    s = s.replace('⦄⦃', '')
    return s


def lines_of(chars, tol=4.5):
    """Group chars into lines by baseline; keep stream order inside a line.

    Zero-width glyphs (combining marks that Word nudges up/down with GPOS)
    inherit the baseline of the glyph drawn just before them.
    """
    eff = []
    prev = None
    for c in chars:
        w = c['x1'] - c['x0']
        if w <= 0.01 and prev is not None and abs(c['bottom'] - prev) < 12:
            eff.append(prev)
        else:
            eff.append(c['bottom'])
            prev = c['bottom']
    items = sorted(range(len(chars)), key=lambda i: eff[i])
    groups = []
    for i in items:
        if groups and abs(eff[i] - groups[-1]['y']) <= tol:
            groups[-1]['idx'].append(i)
        else:
            groups.append({'y': eff[i], 'idx': [i]})
    res = []
    for g in groups:
        idxs = sorted(g['idx'])
        res.append((g['y'], [chars[i] for i in idxs]))
    return res


if __name__ == '__main__':
    import sys
    pdf = pdfplumber.open('ne.pdf')
    pn = int(sys.argv[1])
    page = pdf.pages[pn - 1]
    for y, cs in lines_of(page.chars):
        segs = []
        # split line into x-segments (cells) by big gaps
        cur = [cs[0]]
        for a, b in zip(cs, cs[1:]):
            if b['x0'] - a['x1'] > 18 and (b['x1'] - b['x0']) > 0.01:
                segs.append(cur)
                cur = [b]
            else:
                cur.append(b)
        segs.append(cur)
        print(round(y), ' || '.join(f"[{round(s[0]['x0'])}] " + char_units(s).strip() for s in segs))
