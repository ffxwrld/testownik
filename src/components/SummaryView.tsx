import { useState, useMemo, FC } from 'react';
import { SessionState } from '../models/types';
import { getHardestQuestions, formatTime } from '../utils/session';
import { Card } from './ui/Card';
import { Badge } from './ui/Badge';
import { Button } from './ui/Button';
import { ProgressBar } from './ui/ProgressBar';
import { QuestionRenderer } from './QuestionRenderer';

interface SummaryViewProps {
  session: SessionState;
  sessionId: string;
  onNewTest: () => void;
}

const getAccuracyColor = (pct: number) => {
  if (pct >= 80) return 'emerald';
  if (pct >= 60) return 'amber';
  return 'red';
};

const getAccuracyLabel = (pct: number) => {
  if (pct >= 90) return { text: 'Wybitny!', color: 'success' as const };
  if (pct >= 80) return { text: 'Bardzo dobry', color: 'success' as const };
  if (pct >= 70) return { text: 'Dobry', color: 'info' as const };
  if (pct >= 60) return { text: 'Dostateczny', color: 'warning' as const };
  return { text: 'Wymaga poprawy', color: 'danger' as const };
};

export const SummaryView: FC<SummaryViewProps> = ({
  session,
  sessionId,
  onNewTest,
}) => {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [showBeerModal, setShowBeerModal] = useState(true);

  const toggleExpand = (id: string) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const totalQuestions = session.questions.length;
  const accuracy =
    session.totalFirstAttempts > 0
      ? Math.round((session.totalFirstCorrect / session.totalFirstAttempts) * 100)
      : 0;
  const hardest = useMemo(() => getHardestQuestions(session, 10), [session]);

  const label = getAccuracyLabel(accuracy);

  // Count total errors across all questions
  const totalErrors = session.doneStats.reduce((sum, s) => sum + s.wrongCount, 0);

  return (
    <div className="flex-1 bg-gradient-to-b from-zinc-100 to-zinc-50 dark:from-zinc-900 dark:to-zinc-950 flex items-center justify-center p-6">
      
      {/* ── Beer Modal ── */}
      {showBeerModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-fadeIn"
          onClick={() => setShowBeerModal(false)}
        >
          <div 
            className="bg-white dark:bg-zinc-900 p-8 rounded-3xl shadow-2xl max-w-sm w-full text-center border border-zinc-200 dark:border-zinc-800 animate-slideDown"
            onClick={e => e.stopPropagation()}
          >
            <div className="text-6xl mb-4 animate-bounce">🍻</div>
            <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 mb-2">
              Koniec testu!
            </h2>
            <p className="text-zinc-500 dark:text-zinc-400 mb-6 leading-relaxed">
              Gratulacje, świetna robota! W pełni zasłużyłeś na zimne piwo.
            </p>
            <Button onClick={() => setShowBeerModal(false)} variant="primary" className="w-full">
              Dzięki!
            </Button>
          </div>
        </div>
      )}

      <div className="w-full max-w-2xl space-y-6">

        {/* Header */}
        <div className="text-center space-y-3">
          <div className="flex justify-center">
            <div className="relative w-20 h-20">
              <div className="w-20 h-20 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-full flex items-center justify-center shadow-xl shadow-emerald-500/30">
                <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 01-.982-3.172M9.497 14.25a7.454 7.454 0 00.981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 007.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.25 9.71 2 12 2c2.291 0 4.545.25 6.75.721v1.515m0 0A6.003 6.003 0 0118.27 9.728m0-5.492c.982.143 1.954.317 2.916.52a6.003 6.003 0 01-5.395 5.472m0 0V9.75m0 0a5.982 5.982 0 01-2.48 4.978M18.75 4.236V4.5" />
                </svg>
              </div>
              <div className="absolute -top-1 -right-1 w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center shadow">
                <svg className="w-3.5 h-3.5 text-yellow-900" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
              </div>
            </div>
          </div>
          <div>
            <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">
              Test zakończony!
            </h1>
            <p className="text-zinc-500 dark:text-zinc-400 mt-1 text-sm">
              Gratulacje! Odpowiedziałeś poprawnie na wszystkie {totalQuestions} pytań.
            </p>
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-4">
          {/* Time */}
          <Card className="text-center">
            <div className="flex items-center justify-center gap-2 text-zinc-500 dark:text-zinc-400 mb-2">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-xs font-semibold uppercase tracking-wider">Czas</span>
            </div>
            <p className="text-3xl font-bold font-mono text-zinc-900 dark:text-zinc-50 tabular-nums">
              {formatTime(session.elapsedSeconds)}
            </p>
            <p className="text-xs text-zinc-400 dark:text-zinc-600 mt-1">całkowity czas sesji</p>
          </Card>

          {/* Accuracy */}
          <Card className="text-center">
            <div className="flex items-center justify-center gap-2 text-zinc-500 dark:text-zinc-400 mb-2">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-xs font-semibold uppercase tracking-wider">Skuteczność</span>
            </div>
            <p className={`text-3xl font-bold ${accuracy >= 80 ? 'text-emerald-600 dark:text-emerald-400' : accuracy >= 60 ? 'text-amber-600 dark:text-amber-400' : 'text-red-600 dark:text-red-400'}`}>
              {accuracy}%
            </p>
            <div className="flex justify-center mt-1">
              <Badge variant={label.color}>{label.text}</Badge>
            </div>
          </Card>

          {/* Total questions */}
          <Card className="text-center">
            <div className="flex items-center justify-center gap-2 text-zinc-500 dark:text-zinc-400 mb-2">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 9.75a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375m-13.5 3.01c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.184-4.183a1.14 1.14 0 01.778-.332 48.294 48.294 0 005.83-.498c1.585-.233 2.708-1.626 2.708-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
              </svg>
              <span className="text-xs font-semibold uppercase tracking-wider">Pytania</span>
            </div>
            <p className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">
              {totalQuestions}
            </p>
            <p className="text-xs text-zinc-400 dark:text-zinc-600 mt-1">
              {session.totalFirstCorrect} poprawnie za pierwszym razem
            </p>
          </Card>

          {/* Errors */}
          <Card className="text-center">
            <div className="flex items-center justify-center gap-2 text-zinc-500 dark:text-zinc-400 mb-2">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
              <span className="text-xs font-semibold uppercase tracking-wider">Błędy</span>
            </div>
            <p className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">
              {totalErrors}
            </p>
            <p className="text-xs text-zinc-400 dark:text-zinc-600 mt-1">łączna liczba błędów</p>
          </Card>
        </div>

        {/* Accuracy progress bar */}
        <Card>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
              Skuteczność pierwszych odpowiedzi
            </h3>
            <span className="text-sm font-bold text-zinc-900 dark:text-zinc-50">
              {session.totalFirstCorrect} / {session.totalFirstAttempts}
            </span>
          </div>
          <ProgressBar
            value={accuracy}
            color={getAccuracyColor(accuracy)}
            size="lg"
            showLabel
          />
          <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs text-zinc-500 dark:text-zinc-400">
            <div>
              <div className="font-bold text-emerald-600 dark:text-emerald-400 text-base">
                {session.totalFirstCorrect}
              </div>
              <div>poprawnych</div>
            </div>
            <div>
              <div className="font-bold text-red-500 dark:text-red-400 text-base">
                {session.totalFirstAttempts - session.totalFirstCorrect}
              </div>
              <div>błędnych</div>
            </div>
            <div>
              <div className="font-bold text-zinc-900 dark:text-zinc-50 text-base">
                {session.totalFirstAttempts}
              </div>
              <div>łącznie</div>
            </div>
          </div>
        </Card>

        {/* Hardest questions — with expandable correct answers */}
        {hardest.length > 0 && (
          <Card>
            <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-4 flex items-center gap-2">
              <svg className="w-4 h-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.362 5.214A8.252 8.252 0 0112 21 8.25 8.25 0 016.038 7.048 8.287 8.287 0 009 9.6a8.983 8.983 0 013.361-6.867 8.21 8.21 0 003 2.48z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 18a3.75 3.75 0 00.495-7.467 5.99 5.99 0 00-1.925 3.546 5.974 5.974 0 01-2.133-1A3.75 3.75 0 0012 18z" />
              </svg>
              Najtrudniejsze pytania
              <span className="text-xs font-normal text-zinc-400 dark:text-zinc-600 ml-1">
                — kliknij, aby zobaczyć poprawną odpowiedź
              </span>
            </h3>
            <div className="space-y-2">
              {hardest.map(({ question, wrongCount }, index) => {
                const isExpanded = expandedIds.has(question.id);
                const correctIndices = question.correctAnswerIndices ?? [question.correctAnswerIndex];
                const correctAnswers = correctIndices.map(i => question.answers[i]).filter(Boolean);

                return (
                  <div key={question.id}>
                    <button
                      onClick={() => toggleExpand(question.id)}
                      className="w-full flex items-start gap-3 p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-zinc-200 dark:border-zinc-700/50 hover:border-zinc-300 dark:hover:border-zinc-600 hover:bg-zinc-100/80 dark:hover:bg-zinc-800 transition-all text-left"
                    >
                      <div className="w-6 h-6 flex-shrink-0 bg-red-100 dark:bg-red-900/40 rounded-full flex items-center justify-center mt-0.5">
                        <span className="text-xs font-bold text-red-600 dark:text-red-400">
                          {index + 1}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed">
                          <QuestionRenderer 
                            text={question.text} 
                            sourceFile={question.sourceFile} 
                            sessionId={sessionId} 
                          />
                        </div>
                        <p className="text-xs text-zinc-400 dark:text-zinc-600 mt-0.5">
                          {question.sourceFile.split('/').pop()?.replace('.txt', '')}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Badge variant="danger">
                          {wrongCount}×
                        </Badge>
                        <svg
                          className={`w-4 h-4 text-zinc-400 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2}
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                        </svg>
                      </div>
                    </button>

                    {/* Expanded correct answers */}
                    {isExpanded && (
                      <div className="mx-3 mb-1 px-4 py-3 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/50 border-t-0 rounded-b-xl animate-slideDown">
                        <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 mb-2 flex items-center gap-1.5">
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                          </svg>
                          {correctAnswers.length > 1 ? 'Poprawne odpowiedzi:' : 'Poprawna odpowiedź:'}
                        </p>
                        <div className="space-y-1.5">
                          {correctAnswers.map((answer, ai) => (
                            <p
                              key={ai}
                              className="text-sm text-emerald-800 dark:text-emerald-200 leading-relaxed flex items-start gap-2"
                            >
                              <span className="w-5 h-5 flex-shrink-0 bg-emerald-500 rounded-full flex items-center justify-center mt-0.5">
                                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                                </svg>
                              </span>
                              {answer.text}
                            </p>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </Card>
        )}

        {/* CTA */}
        <Button
          variant="primary"
          size="xl"
          fullWidth
          onClick={onNewTest}
          className="shadow-xl shadow-primary-600/20"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
          </svg>
          Wróć do strony głównej
        </Button>
      </div>
    </div>
  );
};
