# Question data: sources, extraction and verification

This page records where every question, answer and exam rule in the app comes from. It also lists each place where the app departs from the PDFs, and why.

## Sources

| File | Contents | Pages |
| --- | --- | ---: |
| `123.pdf` | **Official Nepali question bank**: *वर्ग क/A र वर्ग ट/K को सवारी चालक अनुमतिपत्रका लागि लिइने लिखित परीक्षाको वस्तुगत प्रश्नोत्तर संग्रह, परिमार्जन आ.व. २०८२/२०८३*, Government of Nepal, Ministry of Physical Infrastructure and Transport, Department of Transport Management | 69 |
| `1234.pdf` | English translation of the same bank ("Collection of objective questions and answers … Revision Fiscal Year 2082/2083") | 59 |

The Nepali PDF is the primary source. The English PDF was used for the English text and to cross-check the answers.

## Exam rules

These come from *कार्यालयहरूलाई निर्देशन* (page 66 of the Nepali PDF) and "Instructions to offices" (page 56 of the English PDF). The two agree.

1. Offices must build the written paper only from questions in this collection.
2. The written exam lasts **30 minutes**.
3. A candidate needs at least **60 marks** to pass.
4. Questions are drawn from each section in fixed numbers, at **4 marks each**:

| Section | Pool | In exam | Marks each | Total |
| --- | ---: | ---: | ---: | ---: |
| सवारी सञ्चालन सम्बन्धी ज्ञान (vehicle operation) | 130 | 6 | 4 | 24 |
| सवारी कानून सम्बन्धी ज्ञान (vehicle laws) | 90 | 5 | 4 | 20 |
| सवारी साधनको प्राविधिक तथा यान्त्रिक ज्ञान (technical) | 80 | 3 | 4 | 12 |
| वातावरण प्रदूषण सम्बन्धी अवधारणात्मक ज्ञान (environment) | 30 | 2 | 4 | 8 |
| दुर्घटना सचेतना सम्बन्धी ज्ञान (accident awareness) | 60 | 3 | 4 | 12 |
| ट्राफिक सङ्केत सम्बन्धी ज्ञान (traffic signs) | 110 | 6 | 4 | 24 |
| **Total** | **500** | **25** | – | **100** |

The foreword states the same numbers: 25 questions from all sections, and 60 % to pass. Checks: 25 × 4 = 100, 60 % × 100 = 60, and the pools sum to 500. The mock exam draws exactly these per-section numbers. The foreword also mentions the practical test (70 % to pass), which is outside the scope of this quiz.

## How the questions were extracted

**Nepali text.** The PDF's text layer is not usable. Word wrote the Devanagari with a broken character map, so copy-and-paste gives "र्ने" for "गर्ने", drops conjuncts, and scrambles vowel signs. Instead of trusting it, the pipeline in [`scripts/pdf-extract`](../scripts/pdf-extract) works as follows:

1. It reads the **glyph ID** of every character drawn with the embedded Devanagari fonts (Kokila, Kalimati, Mangal).
2. It builds a glyph-to-text map from each font's own `cmap` and `GSUB` tables. Every conjunct, half form, reph and matra glyph is traced back to the characters it was shaped from.
3. It re-orders glyphs from visual order to logical Unicode order: the ि matra moves after its consonant cluster, and the reph (र्) moves before it.
4. It converts four options in Q499 that are typed in the legacy *Preeti* font, which has no Unicode text.

**Structure.** Question boundaries come from the table rulings on each page. Options are split on the (क)–(घ) labels, matched in sequence so that options such as "(क) र (ख) दुवै" stay intact. Section boundaries come from the section headings.

**Answers** come from the position of the √ mark relative to the क/ख/ग/घ column headers. Every one of the 500 questions has exactly one mark in each PDF.

**Traffic signs.** The 85 sign pictures (Q416–500) were cropped from 400 dpi page renders and saved as WebP.

## Verification

- **Complete numbering.** Both PDFs contain questions 1–500 with no gaps or duplicates, and the section boundaries agree (1, 131, 221, 301, 331, 391).
- **Independent OCR.** Every Nepali question cell was OCR'd from a 300 dpi page image with Tesseract's Nepali model and compared with the glyph decode. 410 of 500 questions agree at 99 % or better, and 267 match exactly. Every remaining difference was reviewed:
  - most are OCR errors (dropped spaces, misread matras, English words inside Nepali text);
  - the rest are spelling slips that really are in the source.
- **Spot checks against the page images:** all 8 answer conflicts, the legacy-font question, and every question the parser flagged.
- **Automated tests** (`npm test`) enforce the exam arithmetic, the 500 numbered questions, four non-empty options in both languages, valid answers, topic ranges, one image file per sign question, and the absence of decoding debris.

The Nepali text is kept **as printed**, including the source's own spelling variants (for example "गनुपर्दछ", "अवघि", "अघिकतम"). The only exceptions are the few corrections listed below.

## Answer-key conflicts

In 8 questions the two PDFs mark different answers. As the brief requires, **the official Nepali key is used**, with one exception (Q215). Each of these questions shows a short note in the app.

| Q | Question | Nepali PDF | English PDF | Used in app |
| ---: | --- | --- | --- | --- |
| 178 | From whom must approval be taken to change basic vehicle parts? | (क) यातायात व्यवस्था कार्यालयका प्रमुखबाट | (D) None of the above | **(A)** Head of Transport Management Office |
| 215 | According to the Driving License Examination Operating Guidelines, 2077 B.S., how many marks must be obtained to pass the written exam for motorcycles and scooters? | (ग) ७० अंक | (D) 60 marks | **(D)** 60 marks |
| 237 | What is the typical voltage of a motorcycle battery? | (घ) माथिका सबै | (B) 12 volts | **(D)** All of the above |
| 286 | What is the main work of a motor controller (Controller)? | (ग) मोटरको गति र टर्क नियन्त्रण गर्ने | (B) To charge the battery | **(C)** To control the speed and torque of the motor |
| 310 | What is the function of a fuse (Fuse)? | (ख) अतिरिक्त करेन्टबाट सुरक्षा दिने | (A) To increase speed | **(B)** To provide protection from excess current |
| 322 | Where can you take your vehicle for pollution testing? | (ग) क र ख दुबै | (D) All of the above | **(C)** Both A and B |
| 415 | What color are the boards placed to indicate direction? | (क) हरियो | (D) Black | **(A)** Green |
| 454 | What does this traffic sign indicate? | (ख) बाँया च्याप | (C) Keep Left of your vehicle | **(B)** Keep left |

- **Q215.** The Nepali tick (70 marks) contradicts the same document's rule that the written exam needs 60 marks. The English PDF also marks 60, so the app uses (D) 60.
- **Q178.** In the Nepali PDF the mark is printed as an unrenderable symbol (□) in column क. The app reads it as (A).
- **Q322 and Q454.** The English PDF lists different or shifted options. These are translation errors rather than a real disagreement about the answer.
- **Q237.** The official key says "all of the above" for a motorcycle's battery voltage. The app keeps the official key, because that is how the exam is marked, and the note points out the difference.

## Corrections to the text

All corrections live in [`scripts/pdf-extract/corrections.json`](../scripts/pdf-extract/corrections.json) and are applied by the build script.

**Nepali text.** Only printing slips that would confuse a reader were fixed:

| Q | Field | Reason |
| ---: | --- | --- |
| 73 | options.B | Stray '(' from the option marker that the source split across two lines. |
| 139 | options.D | Typo in source: 'पोपेड' for 'मोपेड' (moped). |
| 191 | options.B | Source repeats the label '(ख)' before '(ग)'. |
| 268 | options.C | Misspelled English word inside the Nepali option. |
| 352 | question | Stray vowel sign in source that renders as a broken cluster. |
| 367 | options.B | Misspelled English words inside the Nepali option. |
| 499 | options | These four options are typed in the legacy Preeti font (no Unicode text layer); converted and checked against the page image and OCR. |

**English text.** The English PDF is a reference translation. Clear mistranslations and garbled lines were re-translated from the official Nepali:

| Q | Field | Reason |
| ---: | --- | --- |
| 26 | options.B | Capitalisation. |
| 54 | question | Missing question mark. |
| 66 | question | Mistranslation: हिलो means mud, not water. |
| 110 | options.B | Mistranslation: source 'नयाँ अवस्थाको' was rendered as 'Runs on gas'. |
| 133 | options.B | Garbled translation ('Black yellow letter on a yellow plate'). |
| 149 | options.C | Translation inverted the Nepali meaning ('असंयमित रुपमा सवारी चलाउने'). |
| 177 | question | Double question mark. |
| 183 | options.A | Grammar. |
| 203 | options.A | Mistranslation: रतन्धो means night blindness, not colour blindness. |
| 206 | options.D | Translation added 'and vehicle seizure', which is not in the Nepali option. |
| 268 | options.B | Casing. |
| 268 | options.C | Misspelling ('Manul'). |
| 279 | options.A | Garbled translation ('accilarate the accelerator'). |
| 287 | question | Mistranslation: the Nepali asks what the piston sits inside. |
| 292 | options.D | Mistranslation ('Non of the above'). |
| 307 | options.D | Stray ')' at the start. |
| 322 | options | The English PDF lists different options (C 'Transport Service Office', D 'All of the above'); re-translated from the official Nepali options. |
| 340 | options.A | Unclear wording ('To evade the traffic's eyes'). |
| 353 | options.D | Garbled translation ('to turn the a lateral position'). |
| 408 | question | Stray text ('edge, signal') at the start of the question. |
| 427 | options.C | Misspelled translation ('Hot Tea and brevarae') of 'जलपान'. |
| 454 | options | The English PDF shifted the meanings (B 'Narrow Left Shoulder', C 'Keep Left of your vehicle'); re-translated from the official Nepali options. |

The English PDF's line-break hyphenation ("two- wheeler") was also joined up automatically, and lowercase option starts were capitalised.

## Explanations

Neither PDF contains explanations, so the `explanation` field is empty for all 500 questions. No explanations were invented. The app shows the correct answer after every attempt, plus the source note where there is one. It will display an explanation automatically for any question whose `explanation` is filled in.
