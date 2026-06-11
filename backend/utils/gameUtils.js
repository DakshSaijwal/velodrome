const WORDS = [
  'the','of','and','a','to','in','is','you','that','it','he','was','for','on',
  'are','as','with','his','they','at','be','this','have','from','or','one',
  'had','by','word','but','not','what','all','were','we','when','your','can',
  'said','there','use','an','each','which','she','do','how','their','if',
  'will','up','other','about','out','many','then','them','these','so','some',
  'would','make','like','him','into','time','has','look','two','more','write',
  'go','see','number','no','way','could','people','my','than','first','water',
  'been','call','who','its','now','find','long','down','day','did','get',
  'come','made','may','part','over','new','sound','take','only','little',
  'work','know','place','years','live','back','give','most','very','after',
]

export function generatePassage(count = 60) {
  const result = []
  for (let i = 0; i < count; i++) {
    result.push(WORDS[Math.floor(Math.random() * WORDS.length)])
  }
  return result.join(' ')
}

const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
export function generateRoomCode() {
  return Array.from({ length: 4 }, () =>
    CHARS[Math.floor(Math.random() * CHARS.length)]
  ).join('')
}
