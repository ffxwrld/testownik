import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, DotsThree, Trash, PencilSimple } from '@phosphor-icons/react';
import { Folder } from '../../models/types';
import { useFolders } from '../../hooks/useFolders';

const FOLDER_COLORS = [
  { id: 'blue', value: '#0A84FF' },
  { id: 'purple', value: '#5E5CE6' },
  { id: 'pink', value: '#FF375F' },
  { id: 'red', value: '#FF453A' },
  { id: 'orange', value: '#FF9F0A' },
  { id: 'yellow', value: '#FFD60A' },
  { id: 'green', value: '#32D74B' },
  { id: 'mint', value: '#00C7BE' },
  { id: 'teal', value: '#30B0C7' },
  { id: 'indigo', value: '#5856D6' },
];

interface FolderPillsProps {
  selectedFolderId: string | null;
  onSelectFolder: (id: string | null) => void;
}

export const FolderPills: React.FC<FolderPillsProps> = ({ selectedFolderId, onSelectFolder }) => {
  const { folders, createFolder, updateFolder, deleteFolder } = useFolders();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  
  const [name, setName] = useState('');
  const [color, setColor] = useState(FOLDER_COLORS[0].value);
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);

  const handleCreate = async () => {
    if (!name.trim()) return;
    await createFolder(name.trim(), color);
    setIsCreating(false);
    setName('');
  };

  const handleUpdate = async (id: string) => {
    if (!name.trim()) return;
    await updateFolder(id, name.trim(), color);
    setEditingId(null);
  };

  const openEdit = (f: Folder) => {
    setEditingId(f.id);
    setName(f.name);
    setColor(f.color);
    setIsCreating(false);
    setMenuOpenId(null);
  };

  const openCreate = () => {
    setIsCreating(true);
    setEditingId(null);
    setName('');
    setColor(FOLDER_COLORS[Math.floor(Math.random() * FOLDER_COLORS.length)].value);
    setTimeout(() => {
      if (scrollRef.current) {
        scrollRef.current.scrollLeft = scrollRef.current.scrollWidth;
      }
    }, 50);
  };

  return (
    <div className="w-full flex flex-col gap-3">
      {/* Scrollable Pills Row */}
      <div 
        ref={scrollRef}
        className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide scroll-smooth"
        style={{ msOverflowStyle: 'none', scrollbarWidth: 'none' }}
      >
        <button
          onClick={() => onSelectFolder(null)}
          className={`shrink-0 px-4 py-2 rounded-full text-sm font-semibold transition-colors duration-200 ${
            selectedFolderId === null 
              ? 'bg-zinc-800 dark:bg-zinc-200 text-white dark:text-zinc-900 shadow-md' 
              : 'bg-white/50 dark:bg-zinc-900/50 hover:bg-zinc-200/50 dark:hover:bg-zinc-800/50 text-zinc-600 dark:text-zinc-400 border border-zinc-200/50 dark:border-zinc-800/50'
          }`}
        >
          Wszystkie
        </button>

        {folders.map(f => (
          <div key={f.id} className="relative shrink-0 group flex items-center">
            <button
              onClick={() => onSelectFolder(f.id)}
              className={`px-4 py-2 flex items-center gap-2 rounded-full text-sm font-semibold transition-all duration-200 ${
                selectedFolderId === f.id 
                  ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-md border border-zinc-200/50 dark:border-zinc-700' 
                  : 'bg-white/50 dark:bg-zinc-900/50 hover:bg-zinc-200/50 dark:hover:bg-zinc-800/50 text-zinc-600 dark:text-zinc-400 border border-zinc-200/50 dark:border-zinc-800/50'
              }`}
            >
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: f.color }} />
              {f.name}
            </button>
            <button
              onClick={() => setMenuOpenId(menuOpenId === f.id ? null : f.id)}
              className={`ml-1 p-1.5 rounded-full transition-opacity ${selectedFolderId === f.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} hover:bg-zinc-200/50 dark:hover:bg-zinc-800/50 text-zinc-400`}
            >
              <DotsThree weight="bold" />
            </button>

            <AnimatePresence>
              {menuOpenId === f.id && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setMenuOpenId(null)} />
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="absolute top-full left-4 mt-2 w-40 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-xl z-50 overflow-hidden"
                  >
                    <button
                      onClick={() => openEdit(f)}
                      className="w-full text-left px-3 py-2 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 flex items-center gap-2"
                    >
                      <PencilSimple /> Edytuj
                    </button>
                    <button
                      onClick={() => {
                        if (confirm('Na pewno usunąć?')) {
                          deleteFolder(f.id);
                          if (selectedFolderId === f.id) onSelectFolder(null);
                        }
                        setMenuOpenId(null);
                      }}
                      className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
                    >
                      <Trash /> Usuń
                    </button>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        ))}

        <button
          onClick={openCreate}
          className="shrink-0 w-9 h-9 flex items-center justify-center rounded-full bg-white/50 dark:bg-zinc-900/50 border border-dashed border-zinc-300 dark:border-zinc-700 text-zinc-500 hover:text-zinc-900 dark:hover:text-white hover:border-zinc-400 transition"
        >
          <Plus weight="bold" />
        </button>
      </div>

      {/* Inline Editor / Creator */}
      <AnimatePresence>
        {(isCreating || editingId) && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="p-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl flex flex-col sm:flex-row gap-4 items-start sm:items-center shadow-sm">
              <input
                autoFocus
                value={name}
                onChange={e => setName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && (isCreating ? handleCreate() : handleUpdate(editingId!))}
                placeholder={isCreating ? "Nazwa nowego folderu..." : "Zmień nazwę..."}
                className="flex-1 bg-zinc-100 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary-500"
              />
              <div className="flex items-center gap-1.5 shrink-0">
                {FOLDER_COLORS.map(c => (
                  <button
                    key={c.id}
                    onClick={() => setColor(c.value)}
                    className={`w-6 h-6 rounded-full transition-transform ${color === c.value ? 'scale-125 ring-2 ring-offset-2 ring-zinc-400 dark:ring-zinc-500 dark:ring-offset-zinc-900' : 'hover:scale-110'}`}
                    style={{ backgroundColor: c.value }}
                  />
                ))}
              </div>
              <div className="flex items-center gap-2 shrink-0 ml-auto sm:ml-0 w-full sm:w-auto">
                <button
                  onClick={() => {
                    setIsCreating(false);
                    setEditingId(null);
                  }}
                  className="flex-1 sm:flex-none px-4 py-2 rounded-xl text-sm font-semibold bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700"
                >
                  Anuluj
                </button>
                <button
                  onClick={() => isCreating ? handleCreate() : handleUpdate(editingId!)}
                  className="flex-1 sm:flex-none px-4 py-2 rounded-xl text-sm font-semibold bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-200"
                >
                  Zapisz
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
