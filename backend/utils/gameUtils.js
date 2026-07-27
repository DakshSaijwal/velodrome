const WORDS = [
  'the','of','and','a','to','in','is','you','that','it','he','was','for','on',
  'are','as','with','his','they','at','be','this','have','from','or','one','had','by',
  'word','but','not','what','all','were','we','when','your','can','said','there','use','an',
  'each','which','she','do','how','their','if','will','up','other','about','out','many','then',
  'them','these','so','some','would','make','like','him','into','time','has','look','two','more',
  'write','go','see','number','no','way','could','people','my','than','first','water','been','call',
  'who','its','now','find','long','down','day','did','get','come','made','may','part','over',
  'new','sound','take','only','little','work','know','place','years','live','back','give','most','very',
  'after','things','our','just','name','good','sentence','man','think','say','great','where','help','through',
  'much','before','line','right','too','means','old','any','same','tell','boy','follow','came','want',
  'show','also','around','form','three','small','set','put','end','does','another','well','large','must',
  'big','even','such','because','turn','here','why','ask','went','men','read','need','land','different',
  'home','us','move','try','kind','hand','picture','again','change','off','play','spell','air','away',
  'animal','house','point','page','letter','mother','answer','found','study','still','learn','should','high','every',
  'near','add','food','between','own','below','country','plant','last','school','father','keep','tree','never',
  'start','city','earth','eyes','light','thought','head','under','story','saw','left','few','while','along',
  'might','close','something','seem','next','hard','open','example','begin','life','always','those','both','paper',
  'together','got','group','often','run','important','until','children','side','feet','car','mile','night','walk',
  'white','sea','began','grow','took','river','four','carry','state','once','book','hear','stop','without',
  'second','later','miss','idea','enough','eat','face','watch','far','really','almost','let','above','girl',
  'sometimes','mountain','cut','young','talk','soon','list','song','being','leave','family','body','music','color',
  'stand','sun','questions','fish','area','mark','dog','horse','birds','problem','complete','room','knew','since',
  'ever','piece','told','usually','friends','easy','heard','order','red','door','sure','become','top','ship',
  'across','today','during','short','better','best','however','low','hours','black','products','happened','whole','measure',
  'remember','early','waves','reached','listen','wind','rock','space','covered','fast','several','hold','himself','toward',
  'five','step','morning','passed','vowel','true','hundred','against','pattern','numeral','table','north','slowly','money',
  'map','farm','pulled','draw','voice','seen','cold','cried','plan','notice','south','sing','war','ground',
  'fall','king','town','unit','figure','certain','field','travel','wood','fire','upon','done','road','half',
  'ten','fly','gave','box','finally','wait','correct','oh','quickly','person','became','shown','minutes','strong',
  'verb','stars','front','feel','fact','inches','street','decided','contain','course','surface','produce','building','ocean',
  'class','note','nothing','rest','carefully','scientists','inside','wheels','stay','green','known','island','week','less',
  'machine','base','ago','stood','plane','system','behind','ran','round','boat','game','force','brought','understand',
  'warm','common','bring','explain','dry','though','language','shape','deep','thousands','yes','clear','equation','government',
  'filled','heat','full','hot','check','object','rule','among','noun','power','cannot','able','six','size',
  'dark','ball','material','special',
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
