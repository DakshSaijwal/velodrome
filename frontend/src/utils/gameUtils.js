// Passage generation with three difficulty modes, plus the
// scoring math used everywhere in the app.

const COMMON = [
  'the','of','and','to','in','is','you','that','it','was','for','on','are',
  'with','they','be','this','have','from','one','had','word','but','not',
  'what','all','were','when','your','can','said','there','use','each','which',
  'she','how','their','will','other','about','out','many','then','them',
  'these','some','would','make','like','him','into','time','has','look','two',
  'more','write','see','number','way','could','people','than','first','water',
  'been','call','who','its','now','find','long','down','day','did','get',
  'come','made','may','part','over','new','sound','take','only','little',
  'work','know','place','years','live','back','give','most','very','after',
  'things','our','just','name','good','man','think','say','great','where',
  'help','through','much','before','line','right','too','means','old','any',
  'same','tell','follow','came','want','show','also','around','form','three',
  'small','set','put','end','does','another','well','large','need','land',
  'different','home','move','try','kind','hand','picture','again','change',
  'spell','air','away','animal','house','point','page','letter','mother',
]

const PUNCT = [',', '.', ';', '!', '?', "'s", '-']

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)]
}

export function generatePassage(count = 50, mode = 'words') {
  const out = []
  for (let i = 0; i < count; i++) {
    let word = pick(COMMON)

    if (mode === 'punctuation') {
      if (Math.random() < 0.15) word = word[0].toUpperCase() + word.slice(1)
      if (Math.random() < 0.2) word += pick(PUNCT)
    }
    if (mode === 'numbers' && Math.random() < 0.15) {
      word = String(Math.floor(Math.random() * 1000))
    }

    out.push(word)
  }
  return out.join(' ')
}

// Standard definition: one "word" = 5 characters
export function calcWpm(correctChars, elapsedSeconds) {
  if (elapsedSeconds <= 0) return 0
  return Math.round(correctChars / 5 / (elapsedSeconds / 60))
}

export function calcAccuracy(totalTyped, errors) {
  if (totalTyped === 0) return 100
  return Math.max(0, Math.round(((totalTyped - errors) / totalTyped) * 100))
}

export function buildCharMap(target, typed) {
  return target.split('').map((char, i) => {
    if (i < typed.length) {
      return { char, status: typed[i] === char ? 'correct' : 'wrong' }
    }
    if (i === typed.length) return { char, status: 'cursor' }
    return { char, status: 'pending' }
  })
}

const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

export function generateRoomCode() {
  return Array.from({ length: 4 }, () => pick(CODE_CHARS.split(''))).join('')
}
