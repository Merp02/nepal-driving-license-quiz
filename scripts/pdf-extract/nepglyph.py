"""Glyph-level extraction for the Nepali PDF.

Patches pdfminer so every glyph drawn with an embedded Devanagari CID font is
reported as a private-use token carrying (font id, glyph id).  Tokens are later
decoded with maps built from each embedded font's own cmap + GSUB tables, then
re-ordered from visual glyph order to logical Unicode order.
"""
import hashlib
import pdfminer.pdffont as pf
from devfont import build_gid_map

DEV_FONTS = ('Kokila', 'Kalimati', 'Mangal', 'Nirmala')
TOKEN_BASE = 0xF0000
STRIDE = 8192

FONT_REGISTRY = []   # index -> {'name', 'gids'}
_by_hash = {}
_orig_to_unichr = pf.PDFCIDFont.to_unichr


def _font_index(font):
    idx = getattr(font, '_dev_idx', None)
    if idx is not None:
        return idx
    idx = -1
    if any(n in font.basefont for n in DEV_FONTS) and getattr(font, 'fontfile', None) is not None:
        data = font.fontfile.get_data()
        h = hashlib.sha1(data).hexdigest()
        if h not in _by_hash:
            import tempfile, os
            with tempfile.NamedTemporaryFile(suffix='.ttf', delete=False) as tf:
                tf.write(data)
                path = tf.name
            gids = build_gid_map(path)
            os.unlink(path)
            _by_hash[h] = len(FONT_REGISTRY)
            FONT_REGISTRY.append({'name': font.basefont, 'gids': gids})
        idx = _by_hash[h]
    font._dev_idx = idx
    return idx


def _patched(self, cid):
    idx = _font_index(self)
    if idx < 0:
        return _orig_to_unichr(self, cid)
    return chr(TOKEN_BASE + idx * STRIDE + cid)


pf.PDFCIDFont.to_unichr = _patched


def token_info(ch):
    """Return (font_idx, gid, info) for a token char, else None."""
    o = ord(ch) if len(ch) == 1 else 0
    if o < TOKEN_BASE:
        return None
    k = o - TOKEN_BASE
    idx, gid = divmod(k, STRIDE)
    return idx, gid, FONT_REGISTRY[idx]['gids'].get(gid, {})


VIRAMA = '्'
I_MATRA = 'ि'
REPH = 'र्'
CONSONANTS = set(chr(c) for c in range(0x915, 0x93A)) | set('क़ख़ग़ज़ड़ढ़फ़य़')
DEP_VOWELS = set(chr(c) for c in range(0x93E, 0x94D)) | {'ॢ', 'ॣ'}
MARKS = {'ँ', 'ं', 'ः', '़'}


def classify(text, info):
    """Classify a decoded glyph for re-ordering."""
    if text is None:
        return 'unk'
    if text == I_MATRA:
        return 'imatra'
    if info.get('cls') == 3 and text.startswith(REPH):
        return 'reph'            # reph (possibly + anusvara)
    if REPH in text and text[0] in DEP_VOWELS and not any(c in CONSONANTS for c in text[:1]):
        return 'matra+reph'      # e.g. 'ेर्', 'ीर्', 'ोर्ं'
    if text and text[0] in CONSONANTS:
        if text.endswith(VIRAMA):
            if text == REPH and info.get('adv', 0):
                return 'eyelash'   # spacing half-ra (र्‍)
            return 'half'
        return 'cons'
    if text and (text[0] in DEP_VOWELS or text[0] in MARKS or text[0] == VIRAMA):
        return 'mark'
    return 'other'


def decode_glyphs(glyphs):
    """glyphs: list of (text, kind). Visual -> logical order. Returns str."""
    out = []   # list of [text, kind]
    pending_i = []  # i-matras waiting for their cluster
    i = 0
    items = list(glyphs)
    # Pass 1: move i-matra after its consonant cluster.
    res = []
    n = len(items)
    while i < n:
        t, k = items[i]
        if k == 'imatra':
            # cluster = half* cons (mark starting with virama/nukta)*
            j = i + 1
            while j < n and items[j][1] in ('half', 'eyelash'):
                j += 1
            if j < n and items[j][1] == 'cons':
                j += 1
                while j < n and items[j][1] == 'mark' and (items[j][0].startswith(VIRAMA) or items[j][0] == '़'):
                    j += 1
                res.extend(items[i + 1:j])
                res.append((t, 'mark'))
                i = j
                continue
            res.append((t, 'mark'))
            i += 1
            continue
        res.append((t, k))
        i += 1
    # Pass 2: move reph to the start of its syllable.
    final = []
    for t, k in res:
        if k in ('reph', 'matra+reph'):
            if k == 'reph':
                reph_part, rest = REPH, t[len(REPH):]
            else:
                p = t.index(REPH)
                reph_part, rest = REPH, t[:p] + t[p + len(REPH):]
            # walk back over marks of this syllable, then the base, then half forms
            j = len(final)
            while j > 0 and final[j - 1][1] in ('mark',):
                j -= 1
            if j > 0 and final[j - 1][1] == 'cons':
                j -= 1
                while j > 0 and final[j - 1][1] in ('half', 'eyelash'):
                    j -= 1
            final.insert(j, (reph_part, 'rephmoved'))
            if rest:
                final.append((rest, 'mark'))
            continue
        if k == 'eyelash':
            final.append((REPH + '‍', 'half'))
            continue
        final.append((t, k))
    return ''.join(t for t, _ in final)
