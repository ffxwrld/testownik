import { describe, it, expect } from 'vitest';
import { parseISO, format, differenceInCalendarDays, startOfDay, isValid } from 'date-fns';
import { SavedSessionMetadata } from '../../models/types';
import { CalendarEvent } from './types';

// Helper matching ScheduleView logic
function buildCalendarEvents(sessions: SavedSessionMetadata[]): CalendarEvent[] {
  const list: CalendarEvent[] = [];

  sessions.forEach((s) => {
    if (!s.targetDate) return;

    const dateObj = parseISO(s.targetDate);
    if (!isValid(dateObj) || isNaN(dateObj.getTime())) return;

    const start = startOfDay(dateObj);
    const end = startOfDay(dateObj);

    const isCompleted =
      s.currentPhase === 'summary' ||
      (s.totalQuestions > 0 && s.completedQuestions >= s.totalQuestions);

    list.push({
      id: s.id,
      title: `${isCompleted ? '✓ ' : ''}${s.baseName}`,
      start,
      end,
      allDay: true,
      resource: s,
    });
  });

  return list;
}

function getUpcomingExams(sessions: SavedSessionMetadata[], referenceDate: Date = new Date()): SavedSessionMetadata[] {
  const today = startOfDay(referenceDate);
  return sessions
    .filter((s) => s.targetDate && parseISO(s.targetDate) >= today)
    .sort((a, b) => parseISO(a.targetDate!).getTime() - parseISO(b.targetDate!).getTime());
}

describe('Schedule / Calendar Logic', () => {
  const mockSessions: SavedSessionMetadata[] = [
    {
      id: 'session-1',
      baseName: 'Biologia Komórkowa',
      totalQuestions: 100,
      completedQuestions: 50,
      currentPhase: 'test',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      targetDate: '2026-09-25',
    },
    {
      id: 'session-2',
      baseName: 'Anatomia Człowieka',
      totalQuestions: 80,
      completedQuestions: 80,
      currentPhase: 'summary',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      targetDate: '2026-09-20',
    },
    {
      id: 'session-3',
      baseName: 'Fizjologia',
      totalQuestions: 60,
      completedQuestions: 10,
      currentPhase: 'test',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      // brak targetDate
    },
    {
      id: 'session-4',
      baseName: 'Niepoprawna data',
      totalQuestions: 40,
      completedQuestions: 0,
      currentPhase: 'test',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      targetDate: 'nie-data',
    },
  ];

  it('correctly maps valid sessions to CalendarEvents and ignores invalid/missing dates', () => {
    const events = buildCalendarEvents(mockSessions);
    expect(events).toHaveLength(2);

    const session1Event = events.find((e) => e.id === 'session-1');
    expect(session1Event).toBeDefined();
    expect(session1Event?.title).toBe('Biologia Komórkowa');
    expect(session1Event?.allDay).toBe(true);
    expect(format(session1Event!.start, 'yyyy-MM-dd')).toBe('2026-09-25');

    const session2Event = events.find((e) => e.id === 'session-2');
    expect(session2Event).toBeDefined();
    expect(session2Event?.title).toBe('✓ Anatomia Człowieka');
  });

  it('parses YYYY-MM-DD consistently without UTC midnight shift', () => {
    const parsed = parseISO('2026-09-25');
    expect(isValid(parsed)).toBe(true);
    expect(parsed.getDate()).toBe(25);
    expect(parsed.getMonth()).toBe(8); // 0-indexed September
    expect(parsed.getFullYear()).toBe(2026);
  });

  it('filters and sorts upcoming exams chronologically', () => {
    const refDate = parseISO('2026-09-18');
    const upcoming = getUpcomingExams(mockSessions, refDate);

    expect(upcoming).toHaveLength(2);
    expect(upcoming[0].id).toBe('session-2'); // 2026-09-20
    expect(upcoming[1].id).toBe('session-1'); // 2026-09-25
  });

  it('filters out past exams', () => {
    const refDate = parseISO('2026-09-22');
    const upcoming = getUpcomingExams(mockSessions, refDate);

    expect(upcoming).toHaveLength(1);
    expect(upcoming[0].id).toBe('session-1'); // only 2026-09-25 is >= Sep 22
  });

  it('calculates days left and daily question goal accurately', () => {
    const target = parseISO('2026-09-25');
    const today = parseISO('2026-09-20');

    const daysLeft = differenceInCalendarDays(target, today);
    expect(daysLeft).toBe(5);

    const questionsLeft = 100 - 50; // 50 questions
    const dailyGoal = Math.ceil(questionsLeft / daysLeft);
    expect(dailyGoal).toBe(10);
  });
});
