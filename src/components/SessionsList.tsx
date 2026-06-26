import { type FC, useState } from 'react';
import { SavedSessionMetadata } from '../models/types';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';

interface SessionsListProps {
  sessions: SavedSessionMetadata[];
  onResume: (sessionId: string) => void;
  onDelete: (sessionId: string) => void;
  onRename: (sessionId: string, newName: string) => void;
  onRestart: (sessionId: string, newRepeatMode?: number) => void;
  onEditInCreator: (sessionId: string) => void;
}

export const SessionsList: FC<SessionsListProps> = ({
  sessions,
  onResume,
  onDelete,
  onRename,
  onRestart,
  onEditInCreator,
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [restartingId, setRestartingId] = useState<string | null>(null);
  const [restartRepeatMode, setRestartRepeatMode] = useState(1);

  const startEdit = (session: SavedSessionMetadata) => {
    setEditingId(session.id);
    setEditValue(session.baseName || '');
  };

  const commitEdit = (sessionId: string) => {
    if (editValue.trim()) {
      onRename(sessionId, editValue.trim());
    }
    setEditingId(null);
  };

  if (sessions.length === 0) {
    return (
      <div className="text-center py-10 space-y-2">
        <div className="text-4xl">📚</div>
        <p className="text-zinc-500 dark:text-zinc-400 text-sm font-medium">
          Brak zapisanych testów.
        </p>
        <p className="text-zinc-400 dark:text-zinc-600 text-xs">
          Stwórz nowy test, aby zacząć.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {sessions.map((session) => {
        const progress = session.totalQuestions > 0
          ? Math.round((session.completedQuestions / session.totalQuestions) * 100)
          : 0;
        const isCompleted = session.currentPhase === 'summary';
        const date = new Date(session.createdAt);
        const dateStr = date.toLocaleDateString('pl-PL');
        const timeStr = date.toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' });
        const isEditing = editingId === session.id;

        return (
          <div
            key={session.id}
            className={`p-4 bg-white dark:bg-zinc-800 rounded-xl border transition-shadow hover:shadow-md ${
              isCompleted
                ? 'border-emerald-200 dark:border-emerald-800/50'
                : 'border-zinc-200 dark:border-zinc-700'
            }`}
          >
            {/* Name row */}
            <div className="flex items-start gap-3 mb-3">
              {isEditing ? (
                <div className="flex items-center gap-2 flex-1">
                  <input
                    type="text"
                    value={editValue}
                    onChange={e => setEditValue(e.target.value)}
                    onBlur={() => commitEdit(session.id)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') commitEdit(session.id);
                      if (e.key === 'Escape') setEditingId(null);
                    }}
                    autoFocus
                    className="flex-1 px-3 py-1 text-sm font-semibold bg-white dark:bg-zinc-900 border-2 border-primary-400 rounded-lg text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-primary-500/40"
                    placeholder="Nazwa bazy pytań..."
                  />
                  <button
                    onClick={() => commitEdit(session.id)}
                    className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 transition-colors flex-shrink-0"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                  </button>
                  <button
                    onClick={() => setEditingId(null)}
                    className="p-1.5 rounded-lg text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors flex-shrink-0"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ) : (
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 group">
                    <span className="font-semibold text-zinc-900 dark:text-zinc-100 text-sm leading-tight truncate">
                      {session.baseName || 'Baza pytań'}
                    </span>
                    <button
                      onClick={() => startEdit(session)}
                      className="opacity-0 group-hover:opacity-100 p-0.5 rounded text-zinc-400 hover:text-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/30 transition-all flex-shrink-0"
                      title="Zmień nazwę"
                    >
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                      </svg>
                    </button>
                  </div>
                  <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5">
                    {dateStr} o {timeStr}
                  </p>
                </div>
              )}

              {!isEditing && (
                <Badge variant={isCompleted ? 'success' : 'info'}>
                  {isCompleted ? '✓ Ukończony' : '⏳ W trakcie'}
                </Badge>
              )}
            </div>

            {/* Progress bar */}
            <div className="flex items-center gap-3 mb-3">
              <div className="flex-1 h-1.5 bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    isCompleted ? 'bg-emerald-500' : 'bg-primary-500'
                  }`}
                  style={{ width: `${progress}%` }}
                />
              </div>
              <span className={`text-xs font-bold tabular-nums flex-shrink-0 ${
                isCompleted ? 'text-emerald-600 dark:text-emerald-400' : 'text-zinc-500 dark:text-zinc-400'
              }`}>
                {progress}%
              </span>
              <span className="text-xs text-zinc-400 dark:text-zinc-500 flex-shrink-0">
                {session.completedQuestions}/{session.totalQuestions} pyt.
              </span>
            </div>

            {/* Action buttons */}
            <div className="flex gap-2">
              {isCompleted ? (
                <>
                  <Button
                    onClick={() => setRestartingId(session.id)}
                    size="sm"
                    variant="primary"
                    className="flex-1"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                    </svg>
                    Zacznij od nowa
                  </Button>
                  <button
                    onClick={() => {
                      if (window.confirm('Edycja w kreatorze nadpisze test nową wersją (obecny postęp zostanie zresetowany). Czy kontynuować?')) {
                        onEditInCreator(session.id);
                      }
                    }}
                    className="px-3 py-1.5 text-sm font-medium text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-colors border border-emerald-200 dark:border-emerald-900/40"
                    title="Edytuj pytania w Kreatorze"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" />
                    </svg>
                  </button>
                  <button
                    onClick={() => {
                      if (window.confirm('Czy na pewno chcesz usunąć ten test?')) {
                        onDelete(session.id);
                      }
                    }}
                    className="px-3 py-1.5 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors border border-red-200 dark:border-red-900/40"
                  >
                    Usuń
                  </button>
                </>
              ) : (
                <>
                  <Button
                    onClick={() => onResume(session.id)}
                    size="sm"
                    variant="primary"
                    className="flex-1"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 010 1.972l-11.54 6.347a1.125 1.125 0 01-1.667-.986V5.653z" />
                    </svg>
                    Wznów
                  </Button>
                  <button
                    onClick={() => setRestartingId(session.id)}
                    className="px-3 py-1.5 text-sm font-medium text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors border border-primary-200 dark:border-primary-900/40"
                    title="Zacznij od nowa"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                    </svg>
                  </button>
                  <button
                    onClick={() => {
                      if (window.confirm('Edycja w kreatorze nadpisze test nową wersją (obecny postęp zostanie zresetowany). Czy kontynuować?')) {
                        onEditInCreator(session.id);
                      }
                    }}
                    className="px-3 py-1.5 text-sm font-medium text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-colors border border-emerald-200 dark:border-emerald-900/40"
                    title="Edytuj pytania w Kreatorze"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" />
                    </svg>
                  </button>
                  <button
                    onClick={() => {
                      if (window.confirm('Czy na pewno chcesz usunąć ten test?')) {
                        onDelete(session.id);
                      }
                    }}
                    className="px-3 py-1.5 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors border border-red-200 dark:border-red-900/40"
                  >
                    Usuń
                  </button>
                </>
              )}
            </div>
          </div>
        );
      })}

      {/* Restart Configuration Modal */}
      {restartingId && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fadeIn"
          onClick={() => setRestartingId(null)}
        >
          <div 
            className="bg-white dark:bg-zinc-900 rounded-2xl shadow-xl w-full max-w-sm p-6 border border-zinc-200 dark:border-zinc-800 animate-slideDown"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-2">
              Zacznij od nowa
            </h3>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-6">
              Bieżący postęp w tym teście zostanie utracony. Wybierz wymaganą liczbę poprawnych odpowiedzi z rzędu do zaliczenia pytania:
            </p>
            
            <div className="flex gap-2 mb-6">
              {[1, 2, 3].map(num => (
                <button
                  key={num}
                  onClick={() => setRestartRepeatMode(num)}
                  className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-all border-2 ${
                    restartRepeatMode === num
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                      : 'border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:border-primary-300 dark:hover:border-primary-700'
                  }`}
                >
                  {num}x
                </button>
              ))}
            </div>

            <div className="flex gap-3">
              <Button
                variant="ghost"
                className="flex-1"
                onClick={() => setRestartingId(null)}
              >
                Anuluj
              </Button>
              <Button
                variant="primary"
                className="flex-1"
                onClick={() => {
                  onRestart(restartingId, restartRepeatMode);
                  setRestartingId(null);
                }}
              >
                Restartuj test
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
