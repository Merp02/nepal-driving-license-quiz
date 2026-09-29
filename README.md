# Nepal Driving License Quiz

Interactive Nepal driving license exam quiz website built from official Nepali and English question PDFs. Practice questions, simulate exams, and track scores.

**Live site:** https://nepal-driving-license-quiz.vercel.app (once deployed, see [Deploy to Vercel](#deploy-to-vercel))

It covers the written test for **category A** (motorcycle, scooter, moped) and **category K** (scooter, moped) licences. All 500 questions come from the Department of Transport Management (DoTM) question bank, revision FY 2082/2083.

## Features

- **Practice mode.** Work through all 500 questions, one of the six topics, or only the questions you last got wrong. Each answer is checked immediately: green for correct, red for wrong, with the right answer highlighted.
- **Mock exam.** 25 questions drawn with the official quota from each topic, a 30-minute countdown, 4 marks per question and a pass mark of 60/100. Unanswered questions score zero, and there is no negative marking.
- **Results page.** Shows your marks, pass or fail, marks by topic, and a review of every answer that you can filter to incorrect or unanswered questions.
- **Nepali and English.** Questions appear in the official Nepali by default. You can switch to English, or show both languages side by side. Nepali mode labels options क/ख/ग/घ and uses Devanagari digits.
- **All 85 traffic-sign pictures** are included (questions 416–500).
- **Progress is saved in the browser.** Unfinished practice sets and mock exams resume where you left off, and the site keeps your completed results and per-question history. No account or server is needed.
- **Mobile-first and accessible.** Works down to 320 px wide, with keyboard shortcuts (1–4 or A–D to answer, ← → to move), proper focus handling, and colours that meet WCAG AA contrast.

## Exam rules

These come from *कार्यालयहरूलाई निर्देशन* ("Instructions to offices") on the last page of the question bank. They are stored in [`src/data/examConfig.json`](src/data/examConfig.json).

| Rule | Value |
| --- | --- |
| Questions in the bank | 500 |
| Questions per exam | 25 |
| Marks per question | 4 (all questions equal) |
| Total marks | 100 |
| Pass mark | 60 (60 %) |
| Time allowed | 30 minutes |

Consistency checks: 25 × 4 = 100 and 60 % × 100 = 60. These are also enforced by the test suite.

| Topic | Questions in bank | In each exam | Marks |
| --- | ---: | ---: | ---: |
| 1. Vehicle operation (सवारी सञ्चालन) | 130 (Q1–130) | 6 | 24 |
| 2. Vehicle laws and regulations (सवारी ऐन नियम) | 90 (Q131–220) | 5 | 20 |
| 3. Technical knowledge (प्राविधिक ज्ञान) | 80 (Q221–300) | 3 | 12 |
| 4. Environment and pollution (वातावरण प्रदूषण) | 30 (Q301–330) | 2 | 8 |
| 5. Accident awareness (दुर्घटना सचेतना) | 60 (Q331–390) | 3 | 12 |
| 6. Traffic signs (ट्राफिक सङ्केत) | 110 (Q391–500) | 6 | 24 |

## Tech stack

- [React 19](https://react.dev) + TypeScript, built with [Vite](https://vite.dev)
- [Tailwind CSS 4](https://tailwindcss.com)
- [React Router](https://reactrouter.com) for client-side routes
- [Mukta](https://fonts.google.com/specimen/Mukta), self-hosted through Fontsource. It covers both Devanagari and Latin in one family.
- [Vitest](https://vitest.dev) for tests and [oxlint](https://oxc.rs) for linting

The site is fully static: no backend, no database, no environment variables.

## Local development

**Requirements:** Node.js 22 (see `.nvmrc`; 20.19+ also works) and npm.

```bash
git clone https://github.com/Merp02/nepal-driving-license-quiz.git
cd nepal-driving-license-quiz
npm install
npm run dev          # http://localhost:5173
```

Other scripts:

```bash
npm run build        # type-check and build to dist/
npm run preview      # serve the production build locally
npm test             # data integrity + exam logic tests
npm run lint         # oxlint
```

### Environment setup

No environment variables or secrets are needed, locally or on Vercel. The question bank ships inside the bundle. All user data stays in the visitor's browser (`localStorage`, keys prefixed `ndlq:v1:`).

## Deploy to Vercel

The repository is ready to deploy as it is. [`vercel.json`](vercel.json) sets the build command, the output folder, SPA routing (so links like `/exam` or `/results/…` work on reload) and cache headers.

### One-time setup (about two minutes)

1. Sign in at [vercel.com](https://vercel.com) with your GitHub account.
2. Click **Add New… → Project**, then **Import** the `Merp02/nepal-driving-license-quiz` repository. If it isn't listed, choose **Adjust GitHub App Permissions** and give Vercel access to it.
3. Keep the project name **`nepal-driving-license-quiz`**. Vercel uses the name for the free domain, which gives `https://nepal-driving-license-quiz.vercel.app`.
4. Leave the settings as detected. Framework preset: *Vite*. Build command: `npm run build`. Output directory: `dist`. Install command: `npm ci`. No environment variables.
5. Click **Deploy**. The first build takes about a minute.

After that, every push to `main` redeploys the live site automatically, and pull requests get their own preview URLs.

> If the name `nepal-driving-license-quiz.vercel.app` is already taken by another Vercel user, Vercel adds a suffix. You can check or change the domain under **Project → Settings → Domains**, or attach your own domain there.

### Alternative: deploy from the command line

```bash
npm i -g vercel
vercel link          # create or link the project (name it nepal-driving-license-quiz)
vercel --prod        # build and deploy to production
```

## Project structure

```
src/
├── components/
│   ├── QuestionCard.tsx        question text, sign image, options, feedback
│   ├── AnswerOption.tsx        one answer card (idle / selected / correct / wrong)
│   ├── ProgressBar.tsx
│   ├── ResultCard.tsx          score band and pass/fail verdict
│   ├── ReviewList.tsx          answer review with filters
│   ├── QuestionNavigator.tsx   25-question grid in the mock exam
│   ├── StatsBand.tsx, ConfirmDialog.tsx, LanguageSwitch.tsx, Layout.tsx, Icons.tsx, LangProvider.tsx
├── data/
│   ├── questions.json          500 questions (Nepali + English)
│   ├── examConfig.json         exam rules and topic quotas
│   └── data.test.ts            integrity tests for both files
├── lib/
│   ├── exam.ts                 paper generation and scoring (pure, unit-tested)
│   ├── storage.ts              localStorage persistence
│   ├── i18n.ts                 UI strings in Nepali and English
│   └── config.ts, questions.ts, lang.ts, types.ts
├── pages/
│   ├── Home.tsx
│   ├── Quiz.tsx                practice mode and mock exam
│   └── Results.tsx
public/signs/                   85 traffic-sign images (WebP)
scripts/pdf-extract/            pipeline that builds the data from the PDFs
```

## The question data

Each entry in `src/data/questions.json` looks like this:

```json
{
  "id": 2,
  "category": "vehicle-operation",
  "questionNepali": "जेब्रा क्रसिङ केका लागि प्रयोग गरिन्छ ?",
  "questionEnglish": "What is a zebra crossing used for?",
  "options": [
    { "id": "A", "textNepali": "उभिन", "textEnglish": "For standing" },
    { "id": "B", "textNepali": "पैदल यात्रीले बाटो काट्न", "textEnglish": "For pedestrians to cross the road" },
    { "id": "C", "textNepali": "गाडी रोक्न", "textEnglish": "For stopping vehicles" },
    { "id": "D", "textNepali": "सवारीको गति बढाउन", "textEnglish": "To increase vehicle speed" }
  ],
  "correctAnswer": "B",
  "explanation": ""
}
```

Traffic-sign questions also have an `image`. The 8 questions whose answer differs between the Nepali and English PDFs carry a `sourceNote`, which is shown to the user.

- **Answers** follow the ticks in the official Nepali PDF. The one exception is Q215, where the Nepali tick contradicts the document's own pass-mark rule.
- **Explanations** are empty because neither PDF contains any. The app shows an explanation automatically wherever one is added.

[docs/DATA.md](docs/DATA.md) explains how the data was extracted and verified, and lists every answer-key conflict and correction.

To rebuild the data from the PDFs:

```bash
pip install -r scripts/pdf-extract/requirements.txt   # also needs poppler-utils
scripts/pdf-extract/run.sh path/to/123.pdf path/to/1234.pdf
npm test
```

## Disclaimer

This is an independent practice site. It is not run by, or affiliated with, the Government of Nepal or the Department of Transport Management. Always check current rules with your Transport Management Office.
