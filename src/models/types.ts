export interface Folder {
  id: string;
  name: string;
  color: string;
  createdAt: string;
}

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

export interface ChunkInfo {
  index: number;
  startIndex: number;
  endIndex: number;
  totalQuestions: number;
}

export interface ChunkConfig {
  enabled: boolean;
  chunkSize: number;
  activeChunkIndex: number | null; // null = entire test
}

export interface SpacedRepetitionData {
  efactor: number;       // Easy factor, default 2.5
  interval: number;      // Current interval in days
  dueDate: number;       // Timestamp when this question should be reviewed
  repetitions: number;   // Number of consecutive correct answers
}

export interface SessionState {
  version: number;            // for migration
  questions: Question[];
  queue: QueueItem[];
  done: string[];
  doneStats: DoneStat[];
  repeatMode: number | 'spaced';
  elapsedSeconds: number;
  totalFirstAttempts: number;
  totalFirstCorrect: number;
  startedAt: string;
  updatedAt?: string;
  phase: 'test' | 'summary';
  currentQuestionIndex: number;
  shuffledAnswerOrder: number[];
  baseName: string;
  synced?: boolean;
  syncedSeconds?: number;
  syncedCorrect?: number;
  syncedAnswers?: number;
  targetDate?: string;
  chunkConfig?: ChunkConfig;
  folderId?: string;
  srData?: Record<string, SpacedRepetitionData>;
}

export interface SavedSessionMetadata {
  id: string;
  baseName: string;
  createdAt: string;
  updatedAt: string;
  totalQuestions: number;
  completedQuestions: number;
  currentPhase: 'test' | 'summary';
  targetDate?: string;
  chunkConfig?: ChunkConfig;
  folderId?: string;
}

type FeedbackState = 'correct' | 'wrong';

export interface AnswerFeedback {
  selectedAnswerIndices: number[];
  state: FeedbackState;
  correctShuffledIndices: number[];
}
