// ─────────────────────────────────────────────────────────────────────────────
// Data Models
// ─────────────────────────────────────────────────────────────────────────────

export interface Answer {
  id: string;
  text: string;
  isCorrect: boolean;
}

export interface Question {
  id: string;           // original ID from file (e.g. "X0100")
  sourceFile: string;   // which file it came from
  text: string;
  answers: Answer[];    // answers in ORIGINAL order (before shuffle)
  correctAnswerIndex?: number; // 0-based index of FIRST correct answer (legacy / single, optional)
  correctAnswerIndices: number[]; // all correct answer indices (supports multiple)
}

// ─────────────────────────────────────────────────────────────────────────────
// Queue item — tracks per-question runtime state
// ─────────────────────────────────────────────────────────────────────────────

export interface QueueItem {
  questionId: string;
  requiredCorrectStreak: number;  // how many consecutive correct answers still needed
  consecutiveCorrect: number;     // current consecutive correct answers
  wrongCount: number;             // total wrong answers in this session
  firstAnswerWrong: boolean;      // was the FIRST attempt wrong?
}

// ─────────────────────────────────────────────────────────────────────────────
// Stats for a question that has been completed (moved out of queue)
// ─────────────────────────────────────────────────────────────────────────────

export interface DoneStat {
  questionId: string;
  wrongCount: number;
  firstAnswerWrong: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// Session state — persisted to localStorage
// ─────────────────────────────────────────────────────────────────────────────

export interface SessionState {
  version: number;            // schema version for migration
  questions: Question[];      // full question bank
  queue: QueueItem[];         // active queue (remaining questions)
  done: string[];             // questionIds that passed
  doneStats: DoneStat[];      // stats for completed questions
  repeatMode: number;         // 1 | 2 | 3 — wrong-answer repeat threshold
  elapsedSeconds: number;     // time spent so far
  totalFirstAttempts: number; // total first-attempt answers given
  totalFirstCorrect: number;  // first-attempt correct answers
  startedAt: string;          // ISO timestamp
  phase: 'test' | 'summary';
  currentQuestionIndex: number; // index into queue
  shuffledAnswerOrder: number[]; // per-question shuffled answer indices
  baseName: string;           // name of the question base (editable)
}

// ─────────────────────────────────────────────────────────────────────────────
// Saved Session Metadata (for session list)
// ─────────────────────────────────────────────────────────────────────────────

export interface SavedSessionMetadata {
  id: string;                 // unique ID (timestamp when created)
  baseName: string;           // name of the question base
  createdAt: string;          // ISO timestamp
  totalQuestions: number;     // total questions in test
  completedQuestions: number; // how many completed
  currentPhase: 'test' | 'summary';
}

// ─────────────────────────────────────────────────────────────────────────────
// Answer feedback state
// ─────────────────────────────────────────────────────────────────────────────

export type FeedbackState = 'correct' | 'wrong';

export interface AnswerFeedback {
  selectedAnswerIndices: number[]; // which answers (in shuffled order) were selected
  state: FeedbackState;
  correctShuffledIndices: number[]; // all correct positions (in shuffled order)
}
