import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Folder as FolderIcon, X } from '@phosphor-icons/react';
import { useFolders } from '../../hooks/useFolders';

interface FolderAssignModalProps {
  sessionId: string;
  onClose: () => void;
}

export const FolderAssignModal: React.FC<FolderAssignModalProps> = ({ sessionId, onClose }) => {
  const { folders, assignSessionToFolder } = useFolders();

  const handleAssign = async (folderId: string | null) => {
    await assignSessionToFolder(sessionId, folderId);
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 dark:bg-black/60 backdrop-blur-sm p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ type: 'spring', bounce: 0, duration: 0.3 }}
          className="relative w-full max-w-sm bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl p-6"
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 transition"
          >
            <X weight="bold" />
          </button>
          
          <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mb-4">
            Przypisz do folderu
          </h3>

          <div className="space-y-1.5 max-h-[300px] overflow-y-auto pr-2">
            <button
              onClick={() => handleAssign(null)}
              className="w-full text-left px-4 py-3 rounded-xl flex items-center gap-3 transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800/60 text-zinc-700 dark:text-zinc-300"
            >
              <FolderIcon weight="duotone" className="w-6 h-6 opacity-70" />
              <span className="font-medium">Brak folderu (Wszystkie testy)</span>
            </button>

            {folders.length === 0 && (
              <p className="text-sm text-zinc-500 text-center py-4">Nie masz jeszcze żadnych folderów. Dodaj je w pasku bocznym.</p>
            )}

            {folders.map(f => (
              <button
                key={f.id}
                onClick={() => handleAssign(f.id)}
                className="w-full text-left px-4 py-3 rounded-xl flex items-center gap-3 transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800/60 text-zinc-700 dark:text-zinc-300"
              >
                <FolderIcon weight="duotone" className="w-6 h-6" style={{ color: f.color }} />
                <span className="font-medium">{f.name}</span>
              </button>
            ))}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
