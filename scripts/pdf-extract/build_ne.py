"""Merge Nepali rows into questions and parse options."""
import json
import re

d = json.load(open('ne_rows.json'))
rows = d['rows']
headings = d['headings']

# merge continuation rows
qs = []
for r in rows:
    if r['num']:
        qs.append({'num': int(r['num']), 'pages': [r['page']], 'lines': list(r['lines']),
                   'ticks': list(r['ticks']), 'images': [dict(i, page=r['page']) for i in r['images']],
                   'legacy': list(r['legacy']), 'y0': r['y0'], 'y1': r['y1']})
    else:
        q = qs[-1]
        q['pages'].append(r['page'])
        q['lines'] += r['lines']
        q['ticks'] += r['ticks']
        q['images'] += [dict(i, page=r['page']) for i in r['images']]
        q['legacy'] += r['legacy']

# section of each question from heading positions
sec_starts = []
for si, h in enumerate(headings, start=1):
    first = min((q for q in qs if (q['pages'][0], q['y0']) > (h['page'], h['y'])),
                key=lambda q: (q['pages'][0], q['y0']))
    sec_starts.append((first['num'], si, h['text']))
print('section starts:', [(n, s) for n, s, _ in sec_starts])

MARK = re.compile(r'(?:\(\s*|(?<=\s)|^)(क|ख|ग|घ)\s*\)')
LABELS = ['क', 'ख', 'ग', 'घ']


def split_options(stream):
    """Split 'question (क) a (ख) b (ग) c (घ) d' into question + 4 options.

    Labels are matched in sequence so that option text such as
    '(क) र (ख) दुवै' stays intact.  If the source mislabels an option
    (e.g. two '(ग)'), fall back to the first four markers in order.
    """
    marks = [(m.start(), m.end(), m.group(1)) for m in MARK.finditer(stream)]
    chosen = []
    pos = 0
    for lab in LABELS:
        nxt = next((m for m in marks if m[0] >= pos and m[2] == lab), None)
        if nxt is None:
            chosen = None
            break
        chosen.append(nxt)
        pos = nxt[1]
    how = 'seq'
    if chosen is None:
        chosen = marks[:4] if len(marks) >= 4 else None
        how = 'positional'
    if chosen is None:
        return None, None, 'fail'
    question = stream[:chosen[0][0]].strip()
    opts = []
    for k, m in enumerate(chosen):
        end = chosen[k + 1][0] if k + 1 < len(chosen) else len(stream)
        opts.append(stream[m[1]:end].strip())
    return question, opts, how


problems = []
for q in qs:
    stream = ' '.join(q['lines'])
    stream = stream.replace('⦃ ⦄', ' ').replace('⦃⦄', '')
    # eyelash ra: Kokila's dev2 tables encode it as RRA+virama; Nepali uses RA+virama+ZWJ
    stream = stream.replace('\u0931\u094d ', '\u0930\u094d\u200d').replace('\u0931\u094d', '\u0930\u094d\u200d')
    stream = re.sub(r'\s+', ' ', stream).strip()
    q['stream'] = stream
    question, opts, how = split_options(stream)
    q['question'] = question
    q['options'] = opts
    q['parse'] = how
    if how != 'seq':
        problems.append((q['num'], 'parse ' + how))
    ticks = q['ticks']
    if len(ticks) != 1:
        problems.append((q['num'], 'ticks ' + ','.join(ticks)))
    elif ticks[0].endswith('?'):
        problems.append((q['num'], 'tick is .notdef glyph in column ' + ticks[0]))
    if not question:
        problems.append((q['num'], 'empty question'))
    for lab, t in zip(LABELS, opts or []):
        if not t:
            problems.append((q['num'], 'empty option ' + lab))
        if MARK.search(t) and how == 'seq':
            problems.append((q['num'], f'marker inside option {lab}: {t}'))
    if '�' in stream:
        problems.append((q['num'], 'undecoded glyph'))
    if '⦃' in stream:
        problems.append((q['num'], 'legacy font text'))
    sec = max(s for n, s, _ in sec_starts if n <= q['num'])
    q['section'] = sec

print('problems:', len(problems))
for p in problems:
    print('  ', p)
json.dump(qs, open('ne_questions_raw.json', 'w'), ensure_ascii=False, indent=1)
