"""Crop the traffic-sign pictures (questions 416–500) from a 400 dpi render of the Nepali PDF.

Reads ne_questions_raw.json (image boxes found during extraction); writes signs_ne/<id>.png.
"""
import json
import os
import subprocess
from PIL import Image

DPI = 400
SCALE = DPI / 72


def page_png(page: int) -> Image.Image:
    os.makedirs('img', exist_ok=True)
    out = f'img/ne-{page:03d}-{DPI}'
    if not os.path.exists(out + '.png'):
        subprocess.run(['pdftoppm', '-r', str(DPI), '-f', str(page), '-l', str(page), '-png', '-singlefile', 'ne.pdf', out], check=True)
    return Image.open(out + '.png').convert('RGB')


def main():
    os.makedirs('signs_ne', exist_ok=True)
    questions = {q['num']: q for q in json.load(open('ne_questions_raw.json'))}
    count = 0
    for qid, q in sorted(questions.items()):
        if not q['images']:
            continue
        first_page = q['images'][0]['page']
        boxes = [i for i in q['images'] if i['page'] == first_page]
        x0 = min(i['x0'] for i in boxes)
        y0 = min(i['top'] for i in boxes)
        x1 = max(i['x1'] for i in boxes)
        y1 = max(i['bottom'] for i in boxes)
        crop = page_png(first_page).crop((int(x0 * SCALE) + 1, int(y0 * SCALE) + 1, int(x1 * SCALE) - 1, int(y1 * SCALE) - 1))
        crop.save(f'signs_ne/{qid}.png')
        count += 1
    print('signs', count)


if __name__ == '__main__':
    main()
