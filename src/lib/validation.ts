import { z } from 'zod';

export const CreateProfileSchema = z.object({
  username: z.string()
    .min(3, 'Username musi mieć min. 3 znaki')
    .max(30, 'Username może mieć max. 30 znaków')
    .regex(/^[a-zA-Z0-9_]+$/, 'Dozwolone: litery, cyfry, _'),
});

export const SyncStatsSchema = z.object({
  total_xp:           z.number().int().min(0).max(1_000_000),
  total_sessions:     z.number().int().min(0).max(100_000),
  total_questions:     z.number().int().min(0).max(10_000_000),
  total_correct_first: z.number().int().min(0).max(10_000_000),
  total_study_seconds: z.number().int().min(0).max(100_000_000),
  current_streak:     z.number().int().min(0).max(3650),
  longest_streak:     z.number().int().min(0).max(3650),
  last_study_date:     z.string().date().nullable(),
});

export const SyncDeltaSchema = z.object({
  xpDelta:           z.number().int().min(0).max(500),
  sessionsDelta:     z.number().int().min(0).max(1),
  questionsDelta:    z.number().int().min(0).max(500),
  studySecondsDelta: z.number().int().min(0).max(43_200),
});
