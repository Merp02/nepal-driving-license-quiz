"""Assemble the final bilingual question bank + exam config for the app.

Inputs : ne_questions_raw.json, en_questions_raw.json, signs_ne/*.png (working directory)
         corrections.json (next to this script)
Outputs: out/questions.json, out/examConfig.json, out/signs/<id>.webp
"""
import json
import os
import re
from PIL import Image

NE_LETTERS = ['क', 'ख', 'ग', 'घ']
EN_LETTERS = ['A', 'B', 'C', 'D']
TO_EN = dict(zip(NE_LETTERS, EN_LETTERS))

CATEGORIES = [
    {'id': 'vehicle-operation', 'range': [1, 130], 'questionsInExam': 6,
     'nameEnglish': 'Vehicle operation', 'nameNepali': 'सवारी सञ्चालन',
     'titleEnglish': 'Knowledge of vehicle operation', 'titleNepali': 'सवारी सञ्चालन सम्बन्धी ज्ञान'},
    {'id': 'laws', 'range': [131, 220], 'questionsInExam': 5,
     'nameEnglish': 'Vehicle laws and regulations', 'nameNepali': 'सवारी ऐन नियम',
     'titleEnglish': 'Knowledge of vehicle laws and regulations', 'titleNepali': 'सवारी ऐन नियम सम्बन्धी ज्ञान'},
    {'id': 'technical', 'range': [221, 300], 'questionsInExam': 3,
     'nameEnglish': 'Technical knowledge', 'nameNepali': 'प्राविधिक ज्ञान',
     'titleEnglish': 'Technical and mechanical knowledge of vehicles', 'titleNepali': 'सवारी साधनको प्राविधिक तथा यान्त्रिक ज्ञान'},
    {'id': 'environment', 'range': [301, 330], 'questionsInExam': 2,
     'nameEnglish': 'Environment and pollution', 'nameNepali': 'वातावरण प्रदूषण',
     'titleEnglish': 'Conceptual knowledge of environmental pollution', 'titleNepali': 'वातावरण प्रदूषण सम्बन्धी अवधारणात्मक ज्ञान'},
    {'id': 'accident-awareness', 'range': [331, 390], 'questionsInExam': 3,
     'nameEnglish': 'Accident awareness', 'nameNepali': 'दुर्घटना सचेतना',
     'titleEnglish': 'Knowledge of accident awareness', 'titleNepali': 'दुर्घटना सचेतना सम्बन्धी ज्ञान'},
    {'id': 'traffic-signs', 'range': [391, 500], 'questionsInExam': 6,
     'nameEnglish': 'Traffic signs', 'nameNepali': 'ट्राफिक सङ्केत',
     'titleEnglish': 'Knowledge of traffic signs', 'titleNepali': 'ट्राफिक सङ्केत सम्बन्धी ज्ञान'},
]

# Answer keys that differ between the two PDFs (verified against the page images).
# en = what the English translation ticks. The Nepali key is used, except 215 (see note).
CONFLICTS = {178: 'D', 215: 'D', 237: 'B', 286: 'B', 310: 'A', 322: 'D', 415: 'D', 454: 'C'}
ANSWER_OVERRIDES = {215: 'D'}  # Nepali tick (ग, 70 marks) contradicts the same document's pass mark of 60


def clean_ne(s):
    s = s.replace('⦃', '').replace('⦄', '')
    return re.sub(r'\s+', ' ', s).strip()


def clean_en(s):
    s = re.sub(r'\s+', ' ', s).strip()
    s = re.sub(r'([A-Za-z])- ([a-z])', r'\1-\2', s)      # hyphen broken across lines
    s = s.replace(' ,', ',').replace('( ', '(').replace(' )', ')')
    s = re.sub(r'\bAll of above\b', 'All of the above', s)
    return s


def cap(s):
    return s[:1].upper() + s[1:] if s and s[0].islower() else s


SPECIAL_NOTES = {
    178: {
        'english': ('In the official Nepali question bank the answer mark for this question is printed as an '
                    'unreadable symbol in column (A), which this quiz reads as (A). The English translation '
                    'marks (D) instead.'),
        'nepali': ('आधिकारिक नेपाली प्रश्न संग्रहमा यस प्रश्नको उत्तर-चिन्ह (क) महलमा अस्पष्ट संकेतका रूपमा '
                   'छापिएको छ, जसलाई यहाँ (क) मानिएको छ। अंग्रेजी अनुवादमा भने (घ) लाई सही मानिएको छ।'),
    },
    322: {
        'english': ('The English translation of the question bank lists different options for this question and '
                    'marks (D) "All of the above". This quiz uses the options and answer of the official Nepali '
                    'question bank: (C) both A and B.'),
        'nepali': ('प्रश्न संग्रहको अंग्रेजी अनुवादमा यस प्रश्नका विकल्पहरू फरक छन् र (घ) "माथिका सबै" लाई सही '
                   'मानिएको छ। यो क्विजले आधिकारिक नेपाली प्रश्न संग्रहका विकल्प र उत्तर (ग) "क र ख दुबै" लाई मानेको छ।'),
    },
    454: {
        'english': ('The English translation of the question bank words these options differently and marks (C) '
                    '"Keep left of your vehicle". The official Nepali question bank marks (B), which means the same '
                    'thing; this quiz follows the Nepali version.'),
        'nepali': ('प्रश्न संग्रहको अंग्रेजी अनुवादमा विकल्पहरू फरक शब्दमा छन् र (ग) "Keep left of your vehicle" '
                   'लाई सही मानिएको छ। आधिकारिक नेपाली प्रश्न संग्रहले उही अर्थ दिने (ख) "बाँया च्याप" लाई सही '
                   'मानेको छ र यो क्विजले त्यही मानेको छ।'),
    },
}


def note_for(qid, ne_key, en_pdf_key, options_ne, options_en):
    ne_i = EN_LETTERS.index(ne_key)
    en_i = EN_LETTERS.index(en_pdf_key)
    if qid in SPECIAL_NOTES:
        return SPECIAL_NOTES[qid]
    if qid == 215:
        return {
            'english': ('The official Nepali question bank ticks (C) 70 marks here, but the same document\'s '
                        'instructions set the written-exam pass mark at 60 marks, and the English translation '
                        'also marks (D). This quiz uses (D) 60 marks.'),
            'nepali': ('आधिकारिक नेपाली प्रश्न संग्रहमा यहाँ (ग) ७० अंकमा चिन्ह लगाइएको छ, तर सोही संग्रहको '
                       '"कार्यालयहरूलाई निर्देशन" अनुसार लिखित परीक्षा उत्तीर्ण हुन न्यूनतम ६० अंक चाहिन्छ र अंग्रेजी '
                       'अनुवादले पनि (घ) लाई सही मानेको छ। त्यसैले यहाँ (घ) ६० अंकलाई सही उत्तर मानिएको छ।'),
        }
    return {
        'english': (f'The English translation of the question bank marks ({en_pdf_key}) as correct. '
                    f'This quiz follows the official Nepali question bank, which marks ({ne_key}).'),
        'nepali': (f'प्रश्न संग्रहको अंग्रेजी अनुवादमा ({NE_LETTERS[en_i]}) लाई सही उत्तर मानिएको छ। '
                   f'यो क्विजले आधिकारिक नेपाली प्रश्न संग्रहको उत्तर ({NE_LETTERS[ne_i]}) लाई मानेको छ।'),
    }


def main():
    ne = {q['num']: q for q in json.load(open('ne_questions_raw.json'))}
    en = {q['num']: q for q in json.load(open('en_questions_raw.json'))}
    corr = json.load(open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'corrections.json')))
    os.makedirs('out/signs', exist_ok=True)

    questions = []
    for qid in range(1, 501):
        a, b = ne[qid], en[qid]
        q_ne = clean_ne(a['question'])
        o_ne = [clean_ne(o) for o in a['options']]
        q_en = clean_en(b['question'])
        o_en = [cap(clean_en(o)) for o in b['options']]

        for c in corr['nepali']:
            if c['id'] != qid:
                continue
            if c['field'] == 'question':
                assert c['from'] in q_ne, (qid, c)
                q_ne = q_ne.replace(c['from'], c['to'])
            elif c['field'] == 'options' and qid == 499:
                o_ne = ['घरपालुवा जन्तु', 'जंगल', 'जंगल, वन्यजन्तु आरक्ष', 'चिडियाखाना']
            elif c['field'].startswith('options.'):
                i = EN_LETTERS.index(c['field'][-1])
                assert c['from'] in o_ne[i], (qid, c, o_ne[i])
                o_ne[i] = o_ne[i].replace(c['from'], c['to']).strip()
        for c in corr['english']:
            if c['id'] != qid:
                continue
            if c['field'] == 'question':
                q_en = c['to']
            elif c['field'] == 'options':
                o_en = list(c['to'])
            else:
                o_en[EN_LETTERS.index(c['field'][-1])] = c['to']

        ticks = [t.rstrip('?') for t in a['ticks']]
        assert len(ticks) == 1, (qid, ticks)
        key = TO_EN[ticks[0]]
        en_key = b['ticks'][0]
        if qid in CONFLICTS:
            assert en_key == CONFLICTS[qid] and en_key != key, (qid, key, en_key)
        else:
            assert en_key == key, (qid, key, en_key)
        key = ANSWER_OVERRIDES.get(qid, key)

        cat = next(c for c in CATEGORIES if c['range'][0] <= qid <= c['range'][1])
        item = {
            'id': qid,
            'category': cat['id'],
            'questionNepali': q_ne,
            'questionEnglish': q_en,
            'options': [
                {'id': EN_LETTERS[i], 'textNepali': o_ne[i], 'textEnglish': o_en[i]} for i in range(4)
            ],
            'correctAnswer': key,
            'explanation': '',
        }
        if a['images']:
            src = Image.open(f'signs_ne/{qid}.png').convert('RGB')
            src.thumbnail((320, 320), Image.LANCZOS)
            src.save(f'out/signs/{qid}.webp', 'WEBP', quality=86, method=6)
            item['image'] = f'/signs/{qid}.webp'
        if qid in CONFLICTS:
            item['sourceNote'] = note_for(qid, TO_EN[ne[qid]['ticks'][0].rstrip('?')], CONFLICTS[qid], o_ne, o_en)
        questions.append(item)

    # ---- validation -------------------------------------------------------
    assert [q['id'] for q in questions] == list(range(1, 501))
    for q in questions:
        assert q['questionNepali'] and q['questionEnglish'], q['id']
        assert len(q['options']) == 4
        for o in q['options']:
            assert o['textNepali'] and o['textEnglish'], (q['id'], o)
            assert '⦃' not in o['textNepali'] and '�' not in o['textNepali'], q['id']
        assert q['correctAnswer'] in EN_LETTERS
    for c in CATEGORIES:
        n = sum(1 for q in questions if q['category'] == c['id'])
        assert n == c['range'][1] - c['range'][0] + 1

    config = {
        'examName': 'Nepal Driving License Written Examination',
        'examNameNepali': 'सवारी चालक अनुमतिपत्र लिखित परीक्षा',
        'licenseCategories': {
            'english': 'Category A (motorcycle / scooter / moped) and category K (scooter / moped)',
            'nepali': 'वर्ग "क/A" (मोटरसाइकल/स्कुटर/मोपेड) र वर्ग "ट/K" (स्कुटर/मोपेड)',
        },
        'source': {
            'publisher': 'Government of Nepal, Ministry of Physical Infrastructure and Transport, Department of Transport Management',
            'publisherNepali': 'नेपाल सरकार, भौतिक पूर्वाधार तथा यातायात मन्त्रालय, यातायात व्यवस्था विभाग',
            'revision': 'Fiscal year 2082/2083',
            'revisionNepali': 'परिमार्जन आ.व. २०८२/२०८३',
            'rulesSection': 'कार्यालयहरूलाई निर्देशन (Instructions to offices), last page of the question bank',
        },
        'totalQuestionBankSize': len(questions),
        'questionsPerExam': sum(c['questionsInExam'] for c in CATEGORIES),
        'totalMarks': 100,
        'maximumAchievableMarks': 100,
        'marksPerQuestion': 4,
        'allQuestionsEqualMarks': True,
        'passingMarks': 60,
        'passingPercentage': 60,
        'durationMinutes': 30,
        'categories': [
            {
                'id': c['id'],
                'nameEnglish': c['nameEnglish'],
                'nameNepali': c['nameNepali'],
                'titleEnglish': c['titleEnglish'],
                'titleNepali': c['titleNepali'],
                'questionRange': c['range'],
                'poolSize': c['range'][1] - c['range'][0] + 1,
                'questionsInExam': c['questionsInExam'],
                'marksPerQuestion': 4,
                'totalMarks': c['questionsInExam'] * 4,
            }
            for c in CATEGORIES
        ],
    }
    assert config['questionsPerExam'] * config['marksPerQuestion'] == config['totalMarks']
    assert config['passingPercentage'] * config['totalMarks'] / 100 == config['passingMarks']
    assert sum(c['totalMarks'] for c in config['categories']) == config['totalMarks']
    assert sum(c['poolSize'] for c in config['categories']) == config['totalQuestionBankSize']

    json.dump(questions, open('out/questions.json', 'w'), ensure_ascii=False, indent=1)
    json.dump(config, open('out/examConfig.json', 'w'), ensure_ascii=False, indent=2)
    print('questions', len(questions), 'images', sum(1 for q in questions if 'image' in q),
          'notes', sum(1 for q in questions if 'sourceNote' in q))


if __name__ == '__main__':
    main()
