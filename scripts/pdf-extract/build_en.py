"""Merge English rows into questions and parse options."""
import json
import re

d = json.load(open('en_rows.json'))
rows = d['rows']
headings = d['headings']

qs = []
for r in rows:
    if r['num']:
        qs.append({'num': int(r['num']), 'pages': [r['page']], 'lines': list(r['lines']),
                   'ticks': list(r['ticks']), 'images': [dict(i, page=r['page']) for i in r['images']],
                   'y0': r['y0'], 'y1': r['y1']})
    else:
        if not r['lines'] or r['lines'] == ['Question']:
            continue  # header row of a second table on the same page
        q = qs[-1]
        q['pages'].append(r['page'])
        q['lines'] += r['lines']
        q['ticks'] += r['ticks']
        q['images'] += [dict(i, page=r['page']) for i in r['images']]

sec_starts = []
for si, h in enumerate(headings, start=1):
    first = min((q for q in qs if (q['pages'][0], q['y0']) > (h['page'], h['y'])),
                key=lambda q: (q['pages'][0], q['y0']))
    sec_starts.append((first['num'], si, h['text']))
print('section starts:', [(n, s, t) for n, s, t in sec_starts])

MARK = re.compile(r'(?:\(\s*|(?<=\s)|^)([ABCDabcd])\s*\)')
LABELS = ['A', 'B', 'C', 'D']


def split_options(stream):
    marks = [(m.start(), m.end(), m.group(1).upper()) for m in MARK.finditer(stream)]
    chosen, pos = [], 0
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
    stream = stream.replace('А', 'A').replace('В', 'B').replace('С', 'C')  # Cyrillic look-alikes
    stream = re.sub(r'\s+', ' ', stream).strip()
    q['stream'] = stream
    question, opts, how = split_options(stream)
    q['question'], q['options'], q['parse'] = question, opts, how
    if how != 'seq':
        problems.append((q['num'], 'parse ' + how, stream))
    if len(q['ticks']) != 1:
        problems.append((q['num'], 'ticks ' + ','.join(q['ticks'])))
    if not question:
        problems.append((q['num'], 'empty question', stream))
    for lab, t in zip(LABELS, opts or []):
        if not t:
            problems.append((q['num'], 'empty option ' + lab, stream))
        elif MARK.search(t):
            problems.append((q['num'], f'marker inside option {lab}', t))
    q['section'] = max(s for n, s, _ in sec_starts if n <= q['num'])

print('problems:', len(problems))
for p in problems:
    print('  ', p)
json.dump(qs, open('en_questions_raw.json', 'w'), ensure_ascii=False, indent=1)
