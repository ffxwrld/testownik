export interface Answer {
  id: string;
  text: string;
  isCorrect: boolean;
}

export interface Question {
  id: string;
  sourceFile: string;
  text: string;
  answers: Answer[];
  correctAnswerIndex?: number; // legacy
  correctAnswerIndices: number[];
}

export interface QueueItem {
  questionId: string;
  requiredCorrectStreak: number;
  consecutiveCorrect: number;
  wrongCount: number;
  firstAnswerWrong: boolean;
}

export interface DoneStat {
  questionId: string;
  wrongCount: number;
  firstAnswerWrong: boolean;
}

export interface SessionState {
  version: number;            // for migration
  questions: Question[];
  queue: QueueItem[];
  done: string[];
  doneStats: DoneStat[];
  repeatMode: number;
  elapsedSeconds: number;
  totalFirstAttempts: number;
  totalFirstCorrect: number;
  startedAt: string;
  phase: 'test' | 'summary';
  currentQuestionIndex: number;
  shuffledAnswerOrder: number[];
  baseName: string;
}

export interface SavedSessionMetadata {
  id: string;
  baseName: string;
  createdAt: string;
  totalQuestions: number;
  completedQuestions: number;
  currentPhase: 'test' | 'summary';
}

type FeedbackState = 'correct' | 'wrong';

export interface AnswerFeedback {
  selectedAnswerIndices: number[];
  state: FeedbackState;
  correctShuffledIndices: number[];
}
