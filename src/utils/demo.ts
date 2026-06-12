import { Question, Answer } from '../models/types';

// ─────────────────────────────────────────────────────────────────────────────
// Demo questions for testing the app without a ZIP file
// ─────────────────────────────────────────────────────────────────────────────

interface RawDemoQuestion {
  mask: string;
  text: string;
  answers: string[];
}

const RAW_QUESTIONS: RawDemoQuestion[] = [
  {
    mask: 'X0100',
    text: 'Jaka jest stolica Polski?',
    answers: ['Kraków', 'Warszawa', 'Gdańsk', 'Wrocław'],
  },
  {
    mask: 'X1000',
    text: 'Który pierwiastek ma symbol chemiczny "O"?',
    answers: ['Tlen', 'Złoto', 'Cynk', 'Miedź'],
  },
  {
    mask: 'X0010',
    text: 'Ile wynosi pierwiastek kwadratowy z 144?',
    answers: ['10', '11', '12', '13'],
  },
  {
    mask: 'X0001',
    text: 'Który planet jest największy w Układzie Słonecznym?',
    answers: ['Mars', 'Saturn', 'Uran', 'Jowisz'],
  },
  {
    mask: 'X0100',
    text: 'W którym roku wybuchła II Wojna Światowa?',
    answers: ['1938', '1939', '1940', '1941'],
  },
  {
    mask: 'X1000',
    text: 'Kto namalował "Mona Lisę"?',
    answers: ['Leonardo da Vinci', 'Michał Anioł', 'Rafael Santi', 'Caravaggio'],
  },
  {
    mask: 'X0010',
    text: 'Ile kości ma dorosły człowiek?',
    answers: ['156', '189', '206', '230'],
  },
  {
    mask: 'X0100',
    text: 'Jaka jest największa planeta Układu Słonecznego pod względem masy?',
    answers: ['Saturn', 'Jowisz', 'Neptun', 'Uran'],
  },
  {
    mask: 'X0001',
    text: 'Który z poniższych krajów nie należy do Unii Europejskiej?',
    answers: ['Węgry', 'Rumunia', 'Bułgaria', 'Szwajcaria'],
  },
  {
    mask: 'X1000',
    text: 'Jak nazywa się najdłuższa rzeka na świecie?',
    answers: ['Nil', 'Amazonka', 'Jangcy', 'Missisipi'],
  },
  {
    mask: 'X0100',
    text: 'Ile wynosi suma kątów wewnętrznych trójkąta?',
    answers: ['90°', '180°', '270°', '360°'],
  },
  {
    mask: 'X0010',
    text: 'Który pierwiastek ma największą liczbę atomową wśród gazów szlachetnych?',
    answers: ['Helium (2)', 'Neon (10)', 'Radon (86)', 'Argon (18)'],
  },
  {
    mask: 'X0001',
    text: 'Który z poniższych kompozytorów napisał "Symfonię nr 9 d-moll"?',
    answers: ['Mozart', 'Chopin', 'Bach', 'Beethoven'],
  },
  {
    mask: 'X1000',
    text: 'Jaka jest prędkość światła w próżni?',
    answers: ['~300 000 km/s', '~150 000 km/s', '~500 000 km/s', '~100 000 km/s'],
  },
  {
    mask: 'X0100',
    text: 'Ile boków ma sześciokąt foremny?',
    answers: ['4', '6', '8', '5'],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Build Question objects from raw demo data
// ─────────────────────────────────────────────────────────────────────────────

function decodeMask(mask: string): number[] {
  const digits = mask.replace(/^[^01]*/, '');
  const indices: number[] = [];
  for (let i = 0; i < digits.length; i++) {
    if (digits[i] === '1') indices.push(i);
  }
  return indices;
}

export function buildDemoQuestions(): Question[] {
  return RAW_QUESTIONS.map((raw, qi) => {
    const correctIndices = decodeMask(raw.mask);
    const answers: Answer[] = raw.answers.map((text, i) => ({
      id: `demo-q${qi}-a${i}`,
      text,
      isCorrect: correctIndices.includes(i),
    }));

    return {
      id: `${raw.mask}_demo_q${qi}`,
      sourceFile: `demo/pytanie_${String(qi + 1).padStart(2, '0')}.txt`,
      text: raw.text,
      answers,
      correctAnswerIndex: correctIndices[0],
      correctAnswerIndices: correctIndices,
    };
  });
}
