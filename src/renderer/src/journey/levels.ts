import type { Language } from '@shared/types'

type Bilingual = Record<Language, string>

export interface JourneyStep {
  id: string
  // Short label — used as the scene title in the binder and above the editor
  title: Bilingual
  // The full instruction, shown in the Path panel and above the writing space
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
// Step ids are stored in journey.json and in project.json nodes,
// so never rename or reorder them.
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
        title: { ro: 'Inventarul din cap', en: 'The Inventory' },
        text: {
          ro: 'O propozitie seaca pentru fiecare scena sau idee pe care o cari in cap. Nu literatura — inventar. Ce se repeta in lista, in trei costume diferite, e obsesia ta reala si materialul tau adevarat.',
          en: 'One dry sentence for every scene or idea you carry in your head. Not literature — an inventory. What repeats in the list, in three different costumes, is your real obsession and your true material.',
        },
      },
      {
        id: 'concrete.150',
        title: { ro: '150 de cuvinte, zero abstractiuni', en: '150 Words, Zero Abstractions' },
        text: {
          ro: '150 de cuvinte despre ceva ce ai vazut azi. Niciun adjectiv abstract: fara "frumos", "trist", "interesant". Doar ce a vazut ochiul, in ordinea in care a vazut.',
          en: '150 words about something you saw today. No abstract adjective: no "beautiful", "sad", "interesting". Only what the eye saw, in the order it saw it.',
        },
      },
      {
        id: 'concrete.room',
        title: { ro: 'Camera fara nume', en: 'The Unnamed Room' },
        text: {
          ro: 'Descrie o camera fara sa spui cine locuieste acolo, dar cititorul sa-si dea seama. Obiectele fac toata munca: ce e uzat, ce lipseste, ce a fost mutat.',
          en: 'Describe a room without saying who lives there, but the reader must work it out. The objects do all the work: what is worn, what is missing, what has been moved.',
        },
      },
      {
        id: 'concrete.ten-lines',
        title: { ro: 'Zece randuri concrete', en: 'Ten Concrete Lines' },
        text: {
          ro: 'Zece randuri facute numai din lucruri concrete. Interdictie totala pe "suflet", "dor", "vesnicie", "lacrima". Doar ce vede si ce atinge corpul. Asta e forma de start a poeziei.',
          en: 'Ten lines made only of concrete things. Total ban on "soul", "longing", "eternity", "tear". Only what the body sees and touches. This is the starting form of poetry.',
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
        title: { ro: 'Omul care asteapta', en: 'The Man Who Waits' },
        text: {
          ro: 'O pagina din capul unui om care asteapta pe cineva care intarzie. Fara cuvantul "ingrijorat" si fara sinonimele lui. Ingrijorarea se vede in ce numara, ce reciteste, la ce se uita a treia oara.',
          en: 'One page inside the head of a man waiting for someone who is late. Without the word "worried" or its synonyms. The worry shows in what he counts, what he rereads, what he looks at a third time.',
        },
      },
      {
        id: 'voice.three-stages',
        title: { ro: 'Trei pagini, trei stadii', en: 'Three Pages, Three Stages' },
        text: {
          ro: 'Acelasi personaj, trei momente din degradare sau transformare. Trei pagini. Interzis sa numesti starea. Se schimba doar propozitiile lui: lungimea, ce observa, ce rateaza, ce repeta obsesiv. Daca cititorul isi da seama fara sa-i spui, ai invatat lucrul cel mai greu.',
          en: 'The same character, three moments of decline or transformation. Three pages. Naming the state is forbidden. Only his sentences change: their length, what he notices, what he misses, what he repeats obsessively. If the reader works it out without being told, you have learned the hardest thing.',
        },
      },
      {
        id: 'voice.two-narrators',
        title: { ro: 'Doi naratori', en: 'Two Narrators' },
        text: {
          ro: 'Acelasi eveniment banal, scris de doua ori. O data de un narator care crede ca e iubit, o data de unul care crede ca e urmarit. Aceleasi fapte, alt om.',
          en: 'The same mundane event, written twice. Once by a narrator who believes he is loved, once by one who believes he is followed. The same facts, a different man.',
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
        title: { ro: 'Dialog cu vrute ascunse', en: 'Dialogue with Hidden Wants' },
        text: {
          ro: 'O pagina de dialog intre doi oameni care vor lucruri diferite si niciunul nu spune direct ce vrea. Vorbesc despre altceva tot timpul.',
          en: 'One page of dialogue between two people who want different things and neither says directly what they want. They talk about something else the entire time.',
        },
      },
      {
        id: 'dialogue.cut-info',
        title: { ro: 'Taie informatia', en: 'Cut the Information' },
        text: {
          ro: 'Reia pagina de mai sus si taie orice replica ce doar transmite informatie catre cititor. Ce ramane in picioare e dialog adevarat.',
          en: 'Take the page above and cut every line that merely delivers information to the reader. What remains standing is real dialogue.',
        },
      },
      {
        id: 'dialogue.quiet-fight',
        title: { ro: 'Cearta cu voce joasa', en: 'The Quiet Fight' },
        text: {
          ro: 'O cearta in care niciunul nu ridica vocea si niciunul nu spune de la ce e cearta de fapt. Politetea e arma.',
          en: 'A fight where neither raises their voice and neither says what the fight is really about. Politeness is the weapon.',
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
        title: { ro: 'Ticalosia indreptatita', en: 'The Justified Meanness' },
        text: {
          ro: 'Personajul comite o mica ticalosie si gaseste imediat motivul pentru care era indreptatit. O pagina. Toata tehnica lui Dostoievski, la scara mica.',
          en: 'The character commits a small meanness and immediately finds the reason he was entitled to it. One page. All of Dostoyevsky’s technique, at small scale.',
        },
      },
      {
        id: 'character.ugly-kindness',
        title: { ro: 'Bunatate din motive urate', en: 'Kindness from Ugly Motives' },
        text: {
          ro: 'Un gest de bunatate facut din motive urate — vanitate, vinovatie, frica. Nu numi motivele niciunde. Se vad in ce face imediat dupa.',
          en: 'An act of kindness done for ugly reasons — vanity, guilt, fear. Do not name the reasons anywhere. They show in what he does immediately after.',
        },
      },
      {
        id: 'character.denied-want',
        title: { ro: 'Dorinta refuzata', en: 'The Denied Want' },
        text: {
          ro: 'Personajul vrea ceva banal si concret — un loc la masa, un raspuns, o cheie — si nu-l obtine. O pagina. De aici incep toate scenele.',
          en: 'The character wants something mundane and concrete — a seat at the table, an answer, a key — and does not get it. One page. Every scene starts here.',
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
        title: { ro: 'Scena completa', en: 'The Complete Scene' },
        text: {
          ro: 'O scena completa de 500-800 de cuvinte: personajul intra cu o dorinta, se loveste de ceva, iese schimbat. Tot ce ai invatat pana aici, intr-un singur loc.',
          en: 'A complete scene of 500-800 words: the character enters with a want, hits something, leaves changed. Everything you have learned so far, in one place.',
        },
      },
      {
        id: 'scene.late-early',
        title: { ro: 'Intra tarziu, iesi devreme', en: 'Enter Late, Leave Early' },
        text: {
          ro: 'Taie primul si ultimul paragraf din scena de mai sus. Aproape intotdeauna scena devine mai buna. Asta e tot ce trebuie sa stii despre unde incepe si unde se termina o scena.',
          en: 'Cut the first and last paragraph of the scene above. Almost always the scene gets better. That is all you need to know about where a scene begins and ends.',
        },
      },
      {
        id: 'scene.imitation',
        title: { ro: 'Rescriere dupa un autor', en: 'Rewrite after an Author' },
        text: {
          ro: 'Ia o pagina dintr-un autor care iti place si rescrie-o cu personajele si locul tau. Imitatia constienta e cea mai rapida metoda de a intelege cum e facuta o fraza pe dinauntru.',
          en: 'Take a page from an author you love and rewrite it with your characters and your place. Conscious imitation is the fastest way to understand how a sentence is built from the inside.',
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
        title: { ro: 'Alege ideea', en: 'Pick the Idea' },
        text: {
          ro: 'Din inventarul de la primul pas, alege ideea la care tii cel mai putin. Pe aia o scrii prima — nu doare daca iese prost, si asa treci peste socul dintre scena din cap si pagina reala.',
          en: 'From the inventory in the first step, pick the idea you care about least. That one goes first — it does not hurt if it comes out bad, and that is how you get past the shock between the scene in your head and the real page.',
        },
      },
      {
        id: 'story.outline',
        title: { ro: 'Schita in cinci propozitii', en: 'Five-Sentence Outline' },
        text: {
          ro: 'Cinci propozitii: cine vrea ce, ce ii sta in cale, ce alege, ce pierde, ce se schimba la final. Atat. Nu mai mult.',
          en: 'Five sentences: who wants what, what stands in the way, what he chooses, what he loses, what changes at the end. That is all. No more.',
        },
      },
      {
        id: 'story.write',
        title: { ro: 'Scrie povestirea', en: 'Write the Story' },
        text: {
          ro: 'Scrie povestirea in proiectul Povestiri: 1500-3000 de cuvinte, dusa pana la capat, oricat de imperfecta ar iesi. La prima versiune nu corectezi nimic.',
          en: 'Write the story in the Povestiri project: 1500-3000 words, carried to the end, however imperfect it turns out. On the first draft you correct nothing.',
        },
      },
      {
        id: 'story.cut',
        title: { ro: 'Las-o si taie 10%', en: 'Leave It, Cut 10%' },
        text: {
          ro: 'Las-o trei zile fara sa te uiti la ea. Apoi reciteste-o cu creionul si taie 10 la suta. Aici se recupereaza tot ce s-a pierdut intre cap si hartie.',
          en: 'Leave it for three days without looking at it. Then reread it with a pencil and cut 10 percent. This is where everything lost between head and paper is recovered.',
        },
      },
    ],
  },
]

export const TOTAL_STEPS = LEVELS.reduce((sum, level) => sum + level.steps.length, 0)

const STEPS_BY_ID = new Map<string, JourneyStep>(
  LEVELS.flatMap(level => level.steps).map(step => [step.id, step])
)

export function findStep(stepId: string): JourneyStep | undefined {
  return STEPS_BY_ID.get(stepId)
}
