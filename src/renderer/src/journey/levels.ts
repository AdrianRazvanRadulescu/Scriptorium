import type { Language } from '@shared/types'

type Bilingual = Record<Language, string>

export interface JourneyLevel {
  id: string
  title: Bilingual
  // What this level actually teaches — short and direct, no fluff
  lesson: Bilingual
  // The concrete exercise, referencing the matching scene in the Exercitii project
  exercise: Bilingual
  quote: { text: Bilingual; author: string }
}

// The path from zero to writing short stories. Levels are appended over time —
// the id is stable and stored in journey.json, so never rename or reorder ids.
export const LEVELS: JourneyLevel[] = [
  {
    id: 'inventory',
    title: { ro: 'Inventarul', en: 'The Inventory' },
    lesson: {
      ro: 'Ce cari in cap nu e inca material. Devine material abia cand e pe hartie, o propozitie pe idee. Ce se repeta in lista e obsesia ta reala.',
      en: 'What you carry in your head is not material yet. It becomes material only on paper, one sentence per idea. What repeats in the list is your real obsession.',
    },
    exercise: {
      ro: 'Deschide scena "Inventarul din cap" din proiectul Exercitii. O propozitie seaca pentru fiecare scena sau idee pe care o cari in cap.',
      en: 'Open the "Inventarul din cap" scene in the Exercitii project. One dry sentence for every scene or idea you carry in your head.',
    },
    quote: {
      text: {
        ro: 'Scriu ca sa aflu ce gandesc.',
        en: 'I write entirely to find out what I am thinking.',
      },
      author: 'Joan Didion',
    },
  },
  {
    id: 'concrete',
    title: { ro: 'Concretul', en: 'The Concrete' },
    lesson: {
      ro: 'Emotia nu se numeste, se arata printr-un obiect. Abstractul e refugiul incepatorului; obiectul precis e ce salveaza pagina.',
      en: 'Emotion is not named, it is shown through an object. Abstraction is the beginner’s refuge; the precise object is what saves the page.',
    },
    exercise: {
      ro: 'Scena "150 de cuvinte, zero abstractiuni": 150 de cuvinte despre ceva vazut azi. Fara "frumos", "trist", "interesant".',
      en: 'Scene "150 de cuvinte, zero abstractiuni": 150 words about something you saw today. No "beautiful", "sad", "interesting".',
    },
    quote: {
      text: {
        ro: 'Nu-mi spune ca luna straluceste; arata-mi sclipirea luminii pe sticla sparta.',
        en: 'Don’t tell me the moon is shining; show me the glint of light on broken glass.',
      },
      author: 'Anton Cehov',
    },
  },
  {
    id: 'voice',
    title: { ro: 'Vocea', en: 'The Voice' },
    lesson: {
      ro: 'Cine povesteste conteaza mai mult decat ce se intampla. Starea unui om se vede in propozitiile lui — lungimea lor, ce observa, ce repeta — nu in etichete.',
      en: 'Who tells matters more than what happens. A man’s state shows in his sentences — their length, what he notices, what he repeats — not in labels.',
    },
    exercise: {
      ro: 'Scena "Trei pagini, acelasi om, trei stadii": acelasi personaj la trei momente din degradare. Interzis sa numesti starea.',
      en: 'Scene "Trei pagini, acelasi om, trei stadii": the same character at three stages of decline. Naming the state is forbidden.',
    },
    quote: {
      text: {
        ro: 'Orice scriitor mare reface lumea dupa propriile lui specificatii.',
        en: 'Every great or even every very good writer makes the world over according to his own specifications.',
      },
      author: 'Raymond Carver',
    },
  },
  {
    id: 'dialogue',
    title: { ro: 'Dialogul', en: 'The Dialogue' },
    lesson: {
      ro: 'Oamenii nu spun ce vor. Dialogul adevarat e ce se misca sub cuvinte — restul e doar schimb de informatii.',
      en: 'People do not say what they want. Real dialogue is what moves beneath the words — the rest is just an exchange of information.',
    },
    exercise: {
      ro: 'Scena "Dialog cu vrute ascunse": o pagina, doi oameni care vor lucruri diferite si niciunul nu spune direct ce vrea.',
      en: 'Scene "Dialog cu vrute ascunse": one page, two people who want different things and neither says it directly.',
    },
    quote: {
      text: {
        ro: 'Demnitatea miscarii unui aisberg sta in faptul ca doar o optime din el e deasupra apei.',
        en: 'The dignity of movement of an iceberg is due to only one-eighth of it being above water.',
      },
      author: 'Ernest Hemingway',
    },
  },
  {
    id: 'perspective',
    title: { ro: 'Perspectiva', en: 'The Perspective' },
    lesson: {
      ro: 'Faptele nu exista singure. Fiecare narator vede alta poveste in acelasi eveniment — iar cititorul il cunoaste pe narator din ce alege sa vada.',
      en: 'Facts do not exist alone. Each narrator sees a different story in the same event — and the reader knows the narrator by what he chooses to see.',
    },
    exercise: {
      ro: 'Scena "Acelasi eveniment, doi naratori": acelasi eveniment banal, o data povestit de unul care crede ca e iubit, o data de unul care crede ca e urmarit.',
      en: 'Scene "Acelasi eveniment, doi naratori": the same mundane event, told once by someone who believes he is loved, once by someone who believes he is followed.',
    },
    quote: {
      text: {
        ro: 'Nu exista fapte, doar interpretari.',
        en: 'There are no facts, only interpretations.',
      },
      author: 'Friedrich Nietzsche',
    },
  },
  {
    id: 'justification',
    title: { ro: 'Indreptatirea', en: 'The Justification' },
    lesson: {
      ro: 'Nimeni nu e ticalos in propria poveste. Personajul care se indreptateste singur e mai adevarat decat cel judecat de autor.',
      en: 'No one is a villain in his own story. The character who justifies himself is truer than the one judged by the author.',
    },
    exercise: {
      ro: 'Scena "O ticalosie mica, indreptatita imediat": o pagina in care personajul comite o ticalosie mica si gaseste imediat motivul pentru care era indreptatit.',
      en: 'Scene "O ticalosie mica, indreptatita imediat": one page where the character commits a small meanness and immediately finds the reason he was entitled to it.',
    },
    quote: {
      text: {
        ro: 'Nimic nu e mai usor decat sa condamni raufacatorul; nimic mai greu decat sa-l intelegi.',
        en: 'Nothing is easier than to denounce the evildoer; nothing is more difficult than to understand him.',
      },
      author: 'F.M. Dostoievski',
    },
  },
  {
    id: 'imitation',
    title: { ro: 'Imitatia', en: 'The Imitation' },
    lesson: {
      ro: 'Vocea proprie nu se gaseste in gol. Se gaseste rescriind constient pe cei pe care ii admiri, pana vezi cum e facuta fraza pe dinauntru.',
      en: 'Your own voice is not found in a void. It is found by consciously rewriting those you admire, until you see how the sentence is built from the inside.',
    },
    exercise: {
      ro: 'Scena "Rescriere dupa un autor": o pagina dintr-un autor iubit, rescrisa cu personajele si locul tau.',
      en: 'Scene "Rescriere dupa un autor": a page from an author you love, rewritten with your characters and your place.',
    },
    quote: {
      text: {
        ro: 'Cartile sunt facute din carti.',
        en: 'Books are made out of books.',
      },
      author: 'Cormac McCarthy',
    },
  },
  {
    id: 'first-story',
    title: { ro: 'Prima povestire', en: 'The First Story' },
    lesson: {
      ro: 'A termina e o abilitate separata de a scrie bine — si se antreneaza doar terminand. O povestire dusa la capat valoreaza mai mult decat trei inceputuri stralucite.',
      en: 'Finishing is a skill separate from writing well — and it is trained only by finishing. One story carried to the end is worth more than three brilliant beginnings.',
    },
    exercise: {
      ro: 'In proiectul Povestiri: o povestire de 1500-3000 de cuvinte, dusa pana la capat, oricat de imperfecta ar iesi.',
      en: 'In the Povestiri project: a story of 1500-3000 words, carried to the end, however imperfect it turns out.',
    },
    quote: {
      text: {
        ro: 'Scrisul e ca mersul cu masina noaptea prin ceata. Vezi doar cat bat farurile, dar poti face tot drumul asa.',
        en: 'Writing is like driving at night in the fog. You can only see as far as your headlights, but you can make the whole trip that way.',
      },
      author: 'E.L. Doctorow',
    },
  },
]
