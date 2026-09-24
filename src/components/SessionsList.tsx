import { FC, useState, ReactNode, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { SavedSessionMetadata } from '../models/types';
import { Button } from './ui/Button';
import { SessionCard } from './sessions/SessionCard';
import { TargetDateModal } from './sessions/TargetDateModal';
import { loadSession, saveSession } from '../utils/session';

interface SessionsListProps {
  mode?: 'test' | 'flashcards';
  sessions: SavedSessionMetadata[];
  onResume: (sessionId: string) => void;
  onDelete: (sessionId: string) => void;
  onRename: (sessionId: string, newName: string) => void | Promise<void>;
  onRestart: (sessionId: string, newRepeatMode?: number | 'spaced') => void;
  onEditInCreator: (sessionId: string) => void;
  onFlashcards: (sessionId: string) => void;
  onUpdateTargetDate?: (sessionId: string, newDate: string | undefined) => void | Promise<void>;
  onShareCode?: (session: SavedSessionMetadata) => void;
  onAssignFolder?: (session: SavedSessionMetadata) => void;
  prependItem?: ReactNode;
}

export const SessionsList: FC<SessionsListProps> = ({
  mode = 'test',
  sessions,
  onResume,
  onDelete,
  onRename,
  onRestart,
  onEditInCreator,
  onFlashcards,
  onUpdateTargetDate,
  onShareCode,
  onAssignFolder,
  prependItem,
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [restartingId, setRestartingId] = useState<string | null>(null);
  const [restartRepeatMode, setRestartRepeatMode] = useState<number | 'spaced'>(1);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const { t } = useTranslation();

  const startEdit = useCallback((session: SavedSessionMetadata) => {
    setEditingId(session.id);
    setEditValue(session.baseName || '');
  }, []);

  const [targetDateSession, setTargetDateSession] = useState<SavedSessionMetadata | null>(null);

  const commitEdit = useCallback((sessionId: string) => {
    if (editValue.trim()) {
      onRename(sessionId, editValue.trim());
    }
    setEditingId(null);
  }, [editValue, onRename]);

  const cancelEdit = useCallback(() => {
    setEditingId(null);
  }, []);

  const handleUpdateTargetDate = useCallback((session: SavedSessionMetadata) => {
    setTargetDateSession(session);
  }, []);

  const handleSaveTargetDate = useCallback(async (sessionId: string, newDate: string | undefined) => {
    if (onUpdateTargetDate) {
      await onUpdateTargetDate(sessionId, newDate);
    } else {
      try {
        const s = await loadSession(sessionId);
        if (s) {
          s.targetDate = newDate;
          await saveSession(s, sessionId);
          const match = sessions.find((item) => item.id === sessionId);
          if (match) {
            match.targetDate = newDate;
          }
        }
      } catch (e) {
        console.error('Failed to update session target date:', e);
      }
    }
  }, [onUpdateTargetDate, sessions]);

  const handleExportPdf = useCallback((session: SavedSessionMetadata) => {
    const exportType = window.confirm(t('sessionsList.printConfirm')) ? 'compendium' : 'study';
    import('../utils/pdfExport').then(({ exportSessionToPrint }) => {
      loadSession(session.id).then((fullSession) => {
        if (fullSession) {
          exportSessionToPrint(session.baseName, fullSession.questions, exportType);
        }
      });
    });
  }, [t]);

  const handleExportZip = useCallback(async (session: SavedSessionMetadata) => {
    try {
      const fullSession = await loadSession(session.id);
      if (!fullSession) {
        toast.error(t('sessionsList.zipExportError'));
        return;
      }
      const { exportSessionToZip, triggerBlobDownload } = await import('../utils/parser');
      const zipBlob = await exportSessionToZip(session.id, fullSession);
      const filename = `${session.baseName || 'paczka'}.zip`;
      triggerBlobDownload(zipBlob, filename);
      toast.success(t('sessionsList.zipExportSuccess'));
    } catch (err) {
      console.error('Błąd eksportu paczki ZIP:', err);
      toast.error(t('sessionsList.zipExportError'));
    }
  }, [t]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (openMenuId && !(e.target as Element).closest('.more-options-menu')) {
        setOpenMenuId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [openMenuId]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {prependItem}
      <AnimatePresence mode="popLayout" initial={false}>
        {sessions.map((session) => (
          <SessionCard
            key={session.id}
            session={session}
            mode={mode}
            isEditing={editingId === session.id}
            editValue={editingId === session.id ? editValue : ''}
            onStartEdit={() => startEdit(session)}
            onEditChange={setEditValue}
            onCommitEdit={() => commitEdit(session.id)}
            onCancelEdit={cancelEdit}
            onResume={() => onResume(session.id)}
            onFlashcards={() => onFlashcards(session.id)}
            onStartRestart={() => setRestartingId(session.id)}
            onEditInCreator={() => onEditInCreator(session.id)}
            onDelete={() => onDelete(session.id)}
            onUpdateTargetDate={() => handleUpdateTargetDate(session)}
            onExportPdf={() => handleExportPdf(session)}
            onExportZip={() => handleExportZip(session)}
            onShareCode={onShareCode ? () => onShareCode(session) : undefined}
            onAssignFolder={onAssignFolder ? () => onAssignFolder(session) : undefined}
            isMenuOpen={openMenuId === session.id}
            onToggleMenu={() => setOpenMenuId((prev) => (prev === session.id ? null : session.id))}
            onCloseMenu={() => setOpenMenuId(null)}
          />
        ))}
      </AnimatePresence>

      {restartingId &&
        createPortal(
          <AnimatePresence>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 md:bg-black/60 md:backdrop-blur-sm p-4"
              onClick={() => setRestartingId(null)}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                transition={{ type: 'spring', bounce: 0.2, duration: 0.4 }}
                role="dialog"
                aria-modal="true"
                aria-labelledby="restart-title"
                className="bg-white dark:bg-zinc-900 rounded-xl shadow-2xl border border-zinc-200 dark:border-zinc-800 w-full max-w-sm p-6"
                onClick={(e) => e.stopPropagation()}
              >
                <h3 id="restart-title" className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-2">
                  {t('sessionsList.restartModalTitle')}
                </h3>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-6">
                  {t('sessionsList.restartModalDesc')}
                </p>

                <div className="flex flex-col gap-2 mb-6">
                  <div className="flex gap-2">
                    {[1, 2, 3].map((num) => (
                      <button
                        key={num}
                        onClick={() => setRestartRepeatMode(num)}
                        className={`flex-1 py-2 rounded-xl text-sm font-semibold transition border-2 cursor-pointer ${
                          restartRepeatMode === num
                            ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                            : 'border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:border-primary-300 dark:hover:border-primary-700'
                        }`}
                      >
                        {num}x
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={() => setRestartRepeatMode('spaced')}
                    className={`w-full py-2.5 rounded-xl text-sm font-semibold transition border-2 flex items-center justify-center gap-2 cursor-pointer ${
                      restartRepeatMode === 'spaced'
                        ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300'
                        : 'border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:border-emerald-300 dark:hover:border-emerald-700'
                    }`}
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {t('sessionsList.spacedMode', 'Fiszki Spaced Repetition')}
                  </button>
                </div>

                <div className="flex gap-3">
                  <Button
                    variant="ghost"
                    className="flex-1 cursor-pointer"
                    onClick={() => setRestartingId(null)}
                    autoFocus
                  >
                    {t('sessionsList.cancel')}
                  </Button>
                  <Button
                    variant="primary"
                    className="flex-1 cursor-pointer"
                    onClick={() => {
                      onRestart(restartingId, restartRepeatMode);
                      setRestartingId(null);
                    }}
                  >
                    {t('sessionsList.restartBtn')}
                  </Button>
                </div>
              </motion.div>
            </motion.div>
          </AnimatePresence>,
          document.body
        )}

      <TargetDateModal
        session={targetDateSession}
        isOpen={Boolean(targetDateSession)}
        onClose={() => setTargetDateSession(null)}
        onSave={handleSaveTargetDate}
      />
    </div>
  );
};
