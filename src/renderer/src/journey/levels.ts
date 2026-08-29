import type { Language } from '@shared/types'

type Bilingual = Record<Language, string>

export interface JourneyStep {
  id: string
  text: Bilingual
}

export interface JourneyLevel {
  id: string
  title: Bilingual
  // What this stage actually teaches — short and direct, no fluff
  lesson: Bilingual
  quote: { text: Bilingual; author: string }
  steps: JourneyStep[]
}

// The path from zero to the first finished short story.
// Six stages, each broken into small checkable steps — methodical, no filler.
// Step ids are stored in journey.json, so never rename or reorder them.
export const LEVELS: JourneyLevel[] = [
  {
    id: 'concrete',
    title: { ro: 'Concretul', en: 'The Concrete' },
    lesson: {
      ro: 'Ochiul inainte de fraza. Emotia nu se numeste — se arata printr-un obiect precis.',
      en: 'The eye before the sentence. Emotion is not named — it is shown through a precise object.',
    },
    quote: {
      text: {
        ro: 'Nu-mi spune ca luna straluceste; arata-mi sclipirea luminii pe sticla sparta.',
        en: 'Don’t tell me the moon is shining; show me the glint of light on broken glass.',
      },
      author: 'Anton Cehov',
    },
    steps: [
      {
        id: 'concrete.inventory',
        text: {
          ro: 'Inventarul: o propozitie seaca pentru fiecare idee pe care o cari in cap. Ce se repeta e materialul tau adevarat.',
          en: 'The inventory: one dry sentence for every idea you carry in your head. What repeats is your real material.',
        },
      },
      {
        id: 'concrete.150',
        text: {
          ro: '150 de cuvinte despre ceva vazut azi. Zero adjective abstracte: fara frumos, trist, interesant.',
          en: '150 words about something you saw today. Zero abstract adjectives: no beautiful, sad, interesting.',
        },
      },
      {
        id: 'concrete.room',
        text: {
          ro: 'O camera descrisa asa incat cititorul sa stie cine locuieste in ea, fara sa-l numesti.',
          en: 'A room described so the reader knows who lives there, without naming them.',
        },
      },
      {
        id: 'concrete.ten-lines',
        text: {
          ro: 'Zece randuri numai din lucruri concrete. Interzis: suflet, dor, vesnicie, lacrima.',
          en: 'Ten lines made only of concrete things. Forbidden: soul, longing, eternity, tear.',
        },
      },
    ],
  },
  {
    id: 'voice',
    title: { ro: 'Vocea', en: 'The Voice' },
    lesson: {
      ro: 'Starea unui om se vede in propozitiile lui — lungimea lor, ce observa, ce repeta — nu in etichete.',
      en: 'A man’s state shows in his sentences — their length, what he notices, what he repeats — not in labels.',
    },
    quote: {
      text: {
        ro: 'Orice scriitor mare reface lumea dupa propriile lui specificatii.',
        en: 'Every great or even every very good writer makes the world over according to his own specifications.',
      },
      author: 'Raymond Carver',
    },
    steps: [
      {
        id: 'voice.waiting',
        text: {
          ro: 'O pagina din capul unui om care asteapta pe cineva care intarzie. Fara cuvantul "ingrijorat".',
          en: 'One page inside the head of a man waiting for someone who is late. Without the word "worried".',
        },
      },
      {
        id: 'voice.three-stages',
        text: {
          ro: 'Acelasi om, trei momente din degradare. Trei pagini. Interzis sa numesti starea.',
          en: 'The same man, three moments of decline. Three pages. Naming the state is forbidden.',
        },
      },
      {
        id: 'voice.two-narrators',
        text: {
          ro: 'Acelasi eveniment banal, doi naratori: unul crede ca e iubit, altul ca e urmarit.',
          en: 'The same mundane event, two narrators: one believes he is loved, one believes he is followed.',
        },
      },
    ],
  },
  {
    id: 'dialogue',
    title: { ro: 'Dialogul', en: 'The Dialogue' },
    lesson: {
      ro: 'Oamenii nu spun ce vor. Dialogul adevarat e ce se misca sub cuvinte.',
      en: 'People do not say what they want. Real dialogue is what moves beneath the words.',
    },
    quote: {
      text: {
        ro: 'Demnitatea miscarii unui aisberg sta in faptul ca doar o optime din el e deasupra apei.',
        en: 'The dignity of movement of an iceberg is due to only one-eighth of it being above water.',
      },
      author: 'Ernest Hemingway',
    },
    steps: [
      {
        id: 'dialogue.hidden-wants',
        text: {
          ro: 'O pagina de dialog: doi oameni care vor lucruri diferite si niciunul nu spune direct.',
          en: 'One page of dialogue: two people who want different things and neither says it directly.',
        },
      },
      {
        id: 'dialogue.cut-info',
        text: {
          ro: 'Reia pagina si taie orice replica ce doar da informatie. Ce ramane e dialog.',
          en: 'Take the page again and cut every line that merely gives information. What remains is dialogue.',
        },
      },
      {
        id: 'dialogue.quiet-fight',
        text: {
          ro: 'O cearta in care niciunul nu ridica vocea si niciunul nu spune de la ce e cearta de fapt.',
          en: 'A fight where neither raises their voice and neither says what the fight is really about.',
        },
      },
    ],
  },
  {
    id: 'character',
    title: { ro: 'Personajul', en: 'The Character' },
    lesson: {
      ro: 'Nimeni nu e ticalos in propria poveste. Personajul adevarat se indreptateste singur.',
      en: 'No one is a villain in his own story. The true character justifies himself.',
    },
    quote: {
      text: {
        ro: 'Nimic nu e mai usor decat sa condamni raufacatorul; nimic mai greu decat sa-l intelegi.',
        en: 'Nothing is easier than to denounce the evildoer; nothing is more difficult than to understand him.',
      },
      author: 'F.M. Dostoievski',
    },
    steps: [
      {
        id: 'character.meanness',
        text: {
          ro: 'O ticalosie mica, urmata imediat de motivul pentru care personajul era indreptatit.',
          en: 'A small meanness, followed immediately by the reason the character was entitled to it.',
        },
      },
      {
        id: 'character.ugly-kindness',
        text: {
          ro: 'Un gest de bunatate facut din motive urate. Nu numi motivele.',
          en: 'An act of kindness done for ugly reasons. Do not name the reasons.',
        },
      },
      {
        id: 'character.denied-want',
        text: {
          ro: 'Personajul vrea ceva banal si concret si nu-l obtine. O pagina.',
          en: 'The character wants something mundane and concrete and does not get it. One page.',
        },
      },
    ],
  },
  {
    id: 'scene',
    title: { ro: 'Scena', en: 'The Scene' },
    lesson: {
      ro: 'Povestile sunt facute din scene. O scena: cineva intra vrand ceva si iese schimbat.',
      en: 'Stories are made of scenes. A scene: someone enters wanting something and leaves changed.',
    },
    quote: {
      text: {
        ro: 'Cartile sunt facute din carti.',
        en: 'Books are made out of books.',
      },
      author: 'Cormac McCarthy',
    },
    steps: [
      {
        id: 'scene.complete',
        text: {
          ro: 'O scena completa de 500-800 de cuvinte: personajul intra cu o dorinta, iese schimbat.',
          en: 'A complete scene of 500-800 words: the character enters with a want, leaves changed.',
        },
      },
      {
        id: 'scene.late-early',
        text: {
          ro: 'Taie primul si ultimul paragraf din scena. Intra tarziu, iesi devreme.',
          en: 'Cut the first and last paragraph of the scene. Enter late, leave early.',
        },
      },
      {
        id: 'scene.imitation',
        text: {
          ro: 'O pagina dintr-un autor iubit, rescrisa cu personajele si locul tau. Vezi cum e facuta fraza pe dinauntru.',
          en: 'A page from an author you love, rewritten with your characters and your place. See how the sentence is built from the inside.',
        },
      },
    ],
  },
  {
    id: 'story',
    title: { ro: 'Povestea scurta', en: 'The Short Story' },
    lesson: {
      ro: 'A termina e o abilitate separata de a scrie bine. Se antreneaza doar terminand.',
      en: 'Finishing is a skill separate from writing well. It is trained only by finishing.',
    },
    quote: {
      text: {
        ro: 'Scrisul e ca mersul cu masina noaptea prin ceata. Vezi doar cat bat farurile, dar poti face tot drumul asa.',
        en: 'Writing is like driving at night in the fog. You can only see as far as your headlights, but you can make the whole trip that way.',
      },
      author: 'E.L. Doctorow',
    },
    steps: [
      {
        id: 'story.pick',
        text: {
          ro: 'Alege din inventar ideea la care tii cel mai putin. Pe aia o scrii prima — nu doare daca iese prost.',
          en: 'Pick from the inventory the idea you care about least. That one goes first — it does not hurt if it comes out bad.',
        },
      },
      {
        id: 'story.outline',
        text: {
          ro: 'Schita in cinci propozitii: cine vrea ce, ce ii sta in cale, ce se schimba la final.',
          en: 'An outline in five sentences: who wants what, what stands in the way, what changes at the end.',
        },
      },
      {
        id: 'story.write',
        text: {
          ro: 'Scrie povestirea: 1500-3000 de cuvinte, in proiectul Povestiri. Dusa pana la capat, oricat de imperfecta.',
          en: 'Write the story: 1500-3000 words, in the Povestiri project. Carried to the end, however imperfect.',
        },
      },
      {
        id: 'story.cut',
        text: {
          ro: 'Las-o trei zile. Reciteste-o cu creionul si taie 10 la suta.',
          en: 'Leave it for three days. Reread it with a pencil and cut 10 percent.',
        },
      },
    ],
  },
]

export const TOTAL_STEPS = LEVELS.reduce((sum, level) => sum + level.steps.length, 0)
