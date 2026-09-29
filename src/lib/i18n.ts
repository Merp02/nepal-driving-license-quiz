import type { Lang, OptionId } from './types'

const DEVANAGARI_DIGITS = ['०', '१', '२', '३', '४', '५', '६', '७', '८', '९']

/** Render digits in the reader's script: Devanagari numerals in Nepali. */
export function num(value: number | string, lang: Lang): string {
  const s = String(value)
  return lang === 'ne' ? s.replace(/[0-9]/g, (d) => DEVANAGARI_DIGITS[Number(d)]) : s
}

const NE_MONTHS = ['जनवरी', 'फेब्रुअरी', 'मार्च', 'अप्रिल', 'मे', 'जुन', 'जुलाई', 'अगस्ट', 'सेप्टेम्बर', 'अक्टोबर', 'नोभेम्बर', 'डिसेम्बर']

/**
 * Date and time of a finished quiz. Browsers ship patchy Nepali locale data,
 * so the Nepali format is built by hand (Gregorian calendar, Devanagari digits).
 */
export function formatDateTime(timestamp: number, lang: Lang): string {
  const d = new Date(timestamp)
  const hh = String(d.getHours()).padStart(2, '0')
  const mm = String(d.getMinutes()).padStart(2, '0')
  if (lang === 'ne') {
    return num(`${d.getDate()} ${NE_MONTHS[d.getMonth()]} ${d.getFullYear()}, ${hh}:${mm}`, 'ne')
  }
  return new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(d)
}

const NE_LETTERS: Record<OptionId, string> = { A: 'क', B: 'ख', C: 'ग', D: 'घ' }

/** Option label as printed in the question bank: क ख ग घ in Nepali, A B C D in English. */
export function optionLabel(id: OptionId, lang: Lang): string {
  return lang === 'ne' ? NE_LETTERS[id] : id
}

type Vars = Record<string, string | number>

const en = {
  appName: 'Nepal Driving License Quiz for my babes Samikshyaaaa',
  appNameShort: 'License Quiz',
  appTagline: 'Written test practice, categories A and K',
  skipToContent: 'Skip to content',
  langLabel: 'Question language',

  homeTitle: 'Nepal Driving License Quiz',
  homeLede:
    'Practise all 500 official questions for the category A and K (motorcycle, scooter and moped) written test, then take a timed mock exam marked the same way as the real one.',
  practiceMode: 'Practice mode',
  practiceModeDesc: 'Work through the question bank at your own pace. Every answer is checked straight away.',
  startPractice: 'Start practice',
  examMode: 'Mock exam',
  examModeDesc: '{q} questions drawn from all six topics, {min} minutes, {pass} marks to pass.',
  startExam: 'Start mock exam',

  resumeTitle: 'Pick up where you left off',
  resumeExam: 'Resume mock exam',
  resumeExamMeta: '{answered} of {total} answered, {time} left',
  discardExam: 'Discard',
  resumePractice: 'Continue',
  resumePracticeMeta: 'Question {i} of {n}',

  factsTitle: 'How the written test works',
  factBank: 'Questions in the official bank',
  factPerExam: 'Questions in each test',
  factMarksEach: 'Marks per question',
  factMarksEachNote: 'Every question carries the same marks',
  factTotal: 'Total marks',
  factPass: 'Marks needed to pass',
  factPassNote: '{pct}% of the total',
  factTime: 'Time allowed',
  factTimeValue: '{min} minutes',
  factsSource: 'From the Department of Transport Management’s instructions to transport offices, printed at the end of the question bank.',

  topicsTitle: 'Practise by topic',
  topicsLede: 'The test draws a fixed number of questions from each topic.',
  topicMeta: '{pool} questions, {exam} in each test',
  topicProgress: '{n} of {pool} answered correctly',
  allTopicsName: 'All questions',
  allTopicsMeta: 'The full bank of {n} questions, in official order',
  mistakesName: 'Your mistakes',
  mistakesMeta: '{n} questions you last answered wrong',
  mistakesEmpty: 'Questions you answer wrong will collect here.',

  historyTitle: 'Recent mock exams',
  historyEmpty: 'Your mock exam results will appear here.',
  historyMarks: '{marks}/{max} marks',
  passed: 'Passed',
  notPassed: 'Not passed',
  resetProgress: 'Clear my progress',
  resetConfirm: 'Clear all saved answers, sessions and results on this device?',

  footerSource:
    'Questions and answers come from the Department of Transport Management question bank for category A and K licences (revision FY 2082/2083). This is an independent practice site and is not run by the Government of Nepal.',
  footerDataNote: 'Where the Nepali and English versions of the bank disagree, the official Nepali version is followed and the question shows a note.',

  // quiz
  backHome: 'Back to home',
  practiceTitleAll: 'Practice: all questions',
  practiceTitleTopic: 'Practice: {topic}',
  practiceTitleMistakes: 'Practice: your mistakes',
  examTitle: 'Mock exam',
  statCorrect: 'correct',
  statWrong: 'wrong',
  statScore: 'score',
  statMarks: 'marks',
  statTimeLeft: 'time left',
  statAnswered: 'answered',
  questionOf: 'Question {i} of {n}',
  officialNo: 'Official question no. {id}',
  signAlt: 'Traffic sign for question {id}',
  answersLabel: 'Answer options',
  feedbackCorrect: 'Correct!',
  feedbackWrong: 'Not quite. The correct answer is ({letter}) {text}',
  infoMarks: 'Marks for this question: {marks}',
  infoTopic: 'Topic: {topic}',
  infoSource: 'Question {id} of the official question bank',
  noteTitle: 'Note on this answer',
  showTranslation: 'Also show Nepali',
  hideTranslation: 'Hide Nepali',
  previous: 'Previous',
  next: 'Next question',
  skip: 'Skip',
  finish: 'See my results',
  submitExam: 'Submit exam',
  leavePractice: 'Leave practice',
  leaveExam: 'Leave exam',
  leaveExamNote: 'Your answers are saved and the timer pauses until you come back.',
  restartSet: 'Start this set again',
  jumpTo: 'Go to question',
  jumpGo: 'Go',
  keyboardHint: 'Keyboard: press 1–4 to answer, ← and → to move between questions.',
  jumpInvalid: 'Enter a number from 1 to {n}.',
  navigatorLabel: 'Exam questions',
  navigatorItem: 'Question {i}, {state}',
  stateAnswered: 'answered',
  stateUnanswered: 'not answered',
  confirmSubmitTitle: 'Submit your exam?',
  confirmSubmitUnanswered: 'You have {n} unanswered questions. Unanswered questions score no marks.',
  confirmSubmitAll: 'You have answered every question.',
  keepGoing: 'Keep going',
  timeUp: 'Time is up. Your exam was submitted automatically.',
  emptyMistakesTitle: 'No mistakes to practise',
  emptyMistakesBody: 'Questions you answer wrong in practice or mock exams are collected here so you can try them again.',
  loading: 'Loading questions…',

  // results
  examResultTitle: 'Mock exam result',
  practiceResultTitle: 'Practice summary',
  resultPassHeading: 'You passed',
  resultFailHeading: 'Not passed this time',
  resultBody: 'You scored {marks} of {max} marks ({pct}%). The pass mark is {pass}.',
  resultBodyPractice: 'You answered {correct} of {total} questions correctly ({pct}%).',
  resultTimedOut: 'Time ran out, so the exam was submitted automatically.',
  resultPercentage: 'Percentage',
  resultUnanswered: '{n} questions were not answered.',
  retakeExam: 'Take another mock exam',
  practiseMistakes: 'Practise your mistakes',
  byTopicTitle: 'Marks by topic',
  byTopicRow: '{correct} of {total} correct',
  reviewTitle: 'Review your answers',
  filterAll: 'All',
  filterWrong: 'Incorrect',
  filterUnanswered: 'Unanswered',
  yourAnswer: 'Your answer',
  correctAnswer: 'Correct answer',
  notAnswered: 'Not answered',
  reviewEmpty: 'Nothing to show for this filter.',
  resultNotFound: 'This result is no longer saved on this device.',
  notFoundTitle: 'Page not found',
  notFoundBody: 'The page you opened does not exist.',
}

type Key = keyof typeof en

const ne: Record<Key, string> = {
  appName: 'नेपाल ड्राइभिङ लाइसेन्स क्विज मेरी प्रिय समीक्षाको लागि',
  appNameShort: 'लाइसेन्स क्विज',
  appTagline: 'वर्ग A र K लिखित परीक्षा अभ्यास',
  skipToContent: 'मुख्य सामग्रीमा जानुहोस्',
  langLabel: 'प्रश्नको भाषा',

  homeTitle: 'नेपाल ड्राइभिङ लाइसेन्स क्विज',
  homeLede:
    'वर्ग A र K (मोटरसाइकल, स्कुटर र मोपेड) को लिखित परीक्षाका सबै ५०० आधिकारिक प्रश्न अभ्यास गर्नुहोस्, अनि वास्तविक परीक्षाकै नियमअनुसार समय र अंक गणना हुने नमुना परीक्षा दिनुहोस्।',
  practiceMode: 'अभ्यास मोड',
  practiceModeDesc: 'आफ्नै गतिमा प्रश्नहरू हल गर्नुहोस्। हरेक उत्तर तुरुन्तै जाँचिन्छ।',
  startPractice: 'अभ्यास सुरु गर्नुहोस्',
  examMode: 'नमुना परीक्षा',
  examModeDesc: 'छवटै विषयबाट {q} प्रश्न, {min} मिनेट, उत्तीर्ण हुन {pass} अंक।',
  startExam: 'नमुना परीक्षा सुरु गर्नुहोस्',

  resumeTitle: 'छाडेकै ठाउँबाट सुरु गर्नुहोस्',
  resumeExam: 'नमुना परीक्षा जारी राख्नुहोस्',
  resumeExamMeta: '{total} मध्ये {answered} को उत्तर दिइयो, {time} बाँकी',
  discardExam: 'हटाउनुहोस्',
  resumePractice: 'जारी राख्नुहोस्',
  resumePracticeMeta: 'प्रश्न {i} / {n}',

  factsTitle: 'लिखित परीक्षा कसरी हुन्छ',
  factBank: 'आधिकारिक प्रश्न संग्रहमा प्रश्न',
  factPerExam: 'प्रत्येक परीक्षामा प्रश्न',
  factMarksEach: 'प्रतिप्रश्न अंकभार',
  factMarksEachNote: 'सबै प्रश्नको अंकभार बराबर',
  factTotal: 'पूर्णाङ्क',
  factPass: 'उत्तीर्णाङ्क',
  factPassNote: 'पूर्णाङ्कको {pct}%',
  factTime: 'समय',
  factTimeValue: '{min} मिनेट',
  factsSource: 'यातायात व्यवस्था विभागले प्रश्न संग्रहको अन्त्यमा "कार्यालयहरूलाई निर्देशन" मा तोकेअनुसार।',

  topicsTitle: 'विषयअनुसार अभ्यास',
  topicsLede: 'परीक्षामा प्रत्येक विषयबाट तोकिएको संख्यामा प्रश्न सोधिन्छ।',
  topicMeta: '{pool} प्रश्न, परीक्षामा {exam} वटा',
  topicProgress: '{pool} मध्ये {n} सही',
  allTopicsName: 'सबै प्रश्न',
  allTopicsMeta: 'आधिकारिक क्रममा सबै {n} प्रश्न',
  mistakesName: 'गलत भएका प्रश्न',
  mistakesMeta: 'पछिल्लो पटक गलत उत्तर दिएका {n} प्रश्न',
  mistakesEmpty: 'गलत उत्तर दिएका प्रश्नहरू यहाँ जम्मा हुन्छन्।',

  historyTitle: 'हालका नमुना परीक्षा',
  historyEmpty: 'तपाईंका नमुना परीक्षाका नतिजा यहाँ देखिन्छन्।',
  historyMarks: '{max} मध्ये {marks} अंक',
  passed: 'उत्तीर्ण',
  notPassed: 'अनुत्तीर्ण',
  resetProgress: 'मेरो प्रगति मेटाउनुहोस्',
  resetConfirm: 'यस उपकरणमा सुरक्षित सबै उत्तर, अभ्यास र नतिजा मेटाउने हो?',

  footerSource:
    'प्रश्न र उत्तरहरू यातायात व्यवस्था विभागको वर्ग A र K सवारी चालक अनुमतिपत्रको प्रश्न संग्रह (परिमार्जन आ.व. २०८२/२०८३) बाट लिइएका हुन्। यो स्वतन्त्र अभ्यास साइट हो, नेपाल सरकारद्वारा सञ्चालित होइन।',
  footerDataNote: 'प्रश्न संग्रहका नेपाली र अंग्रेजी संस्करणमा उत्तर फरक परेमा आधिकारिक नेपाली संस्करण मानिएको छ र सम्बन्धित प्रश्नमा टिप्पणी राखिएको छ।',

  backHome: 'गृहपृष्ठमा फर्कनुहोस्',
  practiceTitleAll: 'अभ्यास: सबै प्रश्न',
  practiceTitleTopic: 'अभ्यास: {topic}',
  practiceTitleMistakes: 'अभ्यास: गलत भएका प्रश्न',
  examTitle: 'नमुना परीक्षा',
  statCorrect: 'सही',
  statWrong: 'गलत',
  statScore: 'प्रतिशत',
  statMarks: 'अंक',
  statTimeLeft: 'बाँकी समय',
  statAnswered: 'उत्तर दिइयो',
  questionOf: 'प्रश्न {i} / {n}',
  officialNo: 'आधिकारिक प्रश्न नं. {id}',
  signAlt: 'प्रश्न नं. {id} को ट्राफिक चिन्ह',
  answersLabel: 'उत्तरका विकल्पहरू',
  feedbackCorrect: 'सही उत्तर!',
  feedbackWrong: 'गलत उत्तर। सही उत्तर: ({letter}) {text}',
  infoMarks: 'यस प्रश्नको अंकभार: {marks}',
  infoTopic: 'विषय: {topic}',
  infoSource: 'आधिकारिक प्रश्न संग्रहको प्रश्न नं. {id}',
  noteTitle: 'यस उत्तरबारे टिप्पणी',
  showTranslation: 'अंग्रेजी अनुवाद पनि देखाउनुहोस्',
  hideTranslation: 'अंग्रेजी अनुवाद लुकाउनुहोस्',
  previous: 'अघिल्लो',
  next: 'अर्को प्रश्न',
  skip: 'छोड्नुहोस्',
  finish: 'नतिजा हेर्नुहोस्',
  submitExam: 'परीक्षा बुझाउनुहोस्',
  leavePractice: 'अभ्यास छोड्नुहोस्',
  leaveExam: 'परीक्षा छोड्नुहोस्',
  leaveExamNote: 'तपाईंका उत्तर सुरक्षित रहन्छन् र फर्किनुभएसम्म समय रोकिन्छ।',
  restartSet: 'यो सेट फेरि सुरु गर्नुहोस्',
  jumpTo: 'प्रश्न नम्बरमा जानुहोस्',
  jumpGo: 'जानुहोस्',
  keyboardHint: 'किबोर्ड: उत्तर छान्न १–४ थिच्नुहोस्, प्रश्न बदल्न ← र → थिच्नुहोस्।',
  jumpInvalid: '१ देखि {n} सम्मको नम्बर लेख्नुहोस्।',
  navigatorLabel: 'परीक्षाका प्रश्नहरू',
  navigatorItem: 'प्रश्न {i}, {state}',
  stateAnswered: 'उत्तर दिइएको',
  stateUnanswered: 'उत्तर नदिइएको',
  confirmSubmitTitle: 'परीक्षा बुझाउने हो?',
  confirmSubmitUnanswered: '{n} वटा प्रश्नको उत्तर दिइएको छैन। उत्तर नदिएका प्रश्नमा अंक पाइँदैन।',
  confirmSubmitAll: 'तपाईंले सबै प्रश्नको उत्तर दिनुभयो।',
  keepGoing: 'जारी राख्नुहोस्',
  timeUp: 'समय सकियो। तपाईंको परीक्षा आफैं बुझाइयो।',
  emptyMistakesTitle: 'अभ्यास गर्नुपर्ने गलत प्रश्न छैनन्',
  emptyMistakesBody: 'अभ्यास वा नमुना परीक्षामा गलत उत्तर दिएका प्रश्नहरू फेरि प्रयास गर्न यहाँ जम्मा हुन्छन्।',
  loading: 'प्रश्नहरू लोड हुँदैछन्…',

  examResultTitle: 'नमुना परीक्षाको नतिजा',
  practiceResultTitle: 'अभ्यासको सारांश',
  resultPassHeading: 'तपाईं उत्तीर्ण हुनुभयो',
  resultFailHeading: 'यस पटक अनुत्तीर्ण',
  resultBody: 'तपाईंले {max} मध्ये {marks} अंक ({pct}%) पाउनुभयो। उत्तीर्णाङ्क {pass} हो।',
  resultBodyPractice: 'तपाईंले {total} मध्ये {correct} प्रश्नको सही उत्तर दिनुभयो ({pct}%)।',
  resultTimedOut: 'समय सकिएकाले परीक्षा आफैं बुझाइएको थियो।',
  resultPercentage: 'प्रतिशत',
  resultUnanswered: '{n} वटा प्रश्नको उत्तर दिइएन।',
  retakeExam: 'अर्को नमुना परीक्षा दिनुहोस्',
  practiseMistakes: 'गलत भएका प्रश्न अभ्यास गर्नुहोस्',
  byTopicTitle: 'विषयअनुसार अंक',
  byTopicRow: '{total} मध्ये {correct} सही',
  reviewTitle: 'उत्तरहरूको पुनरावलोकन',
  filterAll: 'सबै',
  filterWrong: 'गलत',
  filterUnanswered: 'उत्तर नदिइएको',
  yourAnswer: 'तपाईंको उत्तर',
  correctAnswer: 'सही उत्तर',
  notAnswered: 'उत्तर दिइएन',
  reviewEmpty: 'यस फिल्टरमा देखाउने प्रश्न छैन।',
  resultNotFound: 'यो नतिजा अब यस उपकरणमा सुरक्षित छैन।',
  notFoundTitle: 'पृष्ठ भेटिएन',
  notFoundBody: 'तपाईंले खोल्नुभएको पृष्ठ अवस्थित छैन।',
}

const STRINGS: Record<Lang, Record<Key, string>> = { en, ne }

export type TKey = Key

/** Translate a UI string; numbers in `vars` are rendered in the reader's script. */
export function translate(lang: Lang, key: Key, vars?: Vars): string {
  let s = STRINGS[lang][key] ?? en[key]
  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      s = s.replaceAll(`{${k}}`, typeof v === 'number' ? num(v, lang) : v)
    }
  }
  return s
}
