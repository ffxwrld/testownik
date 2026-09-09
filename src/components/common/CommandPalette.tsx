import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'wouter';
import { Search, Zap, BarChart3, Gamepad2, User, BookOpen, Command } from 'lucide-react';
import { useSpotlightSearch } from '../../hooks/useSpotlightSearch';
import { getAllSessionMetadata } from '../../utils/session';
import { SavedSessionMetadata } from '../../models/types';

export const CommandPalette: React.FC = () => {
  const { isOpen, close } = useSpotlightSearch();
  const [query, setQuery] = useState('');
  const [sessions, setSessions] = useState<SavedSessionMetadata[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [, setLocation] = useLocation();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      getAllSessionMetadata().then(setSessions);
      // Krótkie opóźnienie by uniknąć problemu z autofocusem podczas animacji
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  const navItems = [
    { id: 'nav-nauka', label: 'Nauka', icon: <Zap className="w-4 h-4" />, action: () => setLocation('/nauka'), shortcut: 'N' },
    { id: 'nav-stats', label: 'Statystyki', icon: <BarChart3 className="w-4 h-4" />, action: () => setLocation('/statystyki'), shortcut: 'S' },
    { id: 'nav-multi', label: 'Multiplayer', icon: <Gamepad2 className="w-4 h-4" />, action: () => setLocation('/multiplayer'), shortcut: 'M' },
    { id: 'nav-profile', label: 'Profil', icon: <User className="w-4 h-4" />, action: () => setLocation('/profil'), shortcut: 'P' },
  ];

  // Filtrowanie wyników
  const q = query.toLowerCase();
  
  const filteredNav = navItems.filter(item => 
    item.label.toLowerCase().includes(q) || 
    (q.length === 1 && item.shortcut.toLowerCase() === q)
  );
  
  const filteredSessions = sessions.filter(s => 
    s.baseName.toLowerCase().includes(q)
  );

  const allItems = [...filteredNav, ...filteredSessions];

  // Klawiatura globalna dla nawigacji, gdy palette NIE jest otwarta
  useEffect(() => {
    if (isOpen) return;
    
    const handleGlobalNav = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        (e.target as HTMLElement).isContentEditable
      ) return;
      
      const key = e.key.toLowerCase();
      const item = navItems.find(i => i.shortcut.toLowerCase() === key);
      if (item && !e.metaKey && !e.ctrlKey) {
        item.action();
      }
    };
    
    window.addEventListener('keydown', handleGlobalNav);
    return () => window.removeEventListener('keydown', handleGlobalNav);
  }, [isOpen, navItems]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => Math.min(prev + 1, allItems.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const item = allItems[selectedIndex];
      if (item) {
        if ('action' in item) {
          item.action();
        } else {
          // It's a session - let's go to learn view and maybe trigger some event to open it?
          // For now just go to learn
          setLocation('/nauka');
        }
        close();
      }
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-[100] bg-zinc-900/40 dark:bg-black/60 backdrop-blur-sm"
            onClick={close}
          />
          <div className="fixed inset-0 z-[101] flex items-start justify-center pt-[15vh] pointer-events-none px-4">
            <motion.div
              initial={{ scale: 0.96, opacity: 0, y: -10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.96, opacity: 0, y: -10 }}
              transition={{ type: "spring", bounce: 0, duration: 0.3 }}
              className="w-full max-w-2xl bg-white/90 dark:bg-zinc-900/90 backdrop-blur-xl shadow-2xl rounded-2xl overflow-hidden border border-zinc-200/50 dark:border-zinc-800/50 pointer-events-auto flex flex-col max-h-[60vh]"
            >
              <div className="flex items-center px-4 border-b border-zinc-200/50 dark:border-zinc-800/50">
                <Search className="w-5 h-5 text-zinc-400 shrink-0" />
                <input
                  ref={inputRef}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Szukaj paczek, przechodź do widoków... (lub wpisz ? dla skrótów)"
                  className="w-full bg-transparent border-none py-4 px-3 text-lg text-zinc-900 dark:text-zinc-50 placeholder:text-zinc-400 focus:outline-none focus:ring-0"
                />
                <div className="flex gap-1">
                  <kbd className="hidden sm:flex items-center justify-center h-6 px-2 text-[11px] font-medium text-zinc-500 bg-zinc-100 dark:bg-zinc-800 rounded-md border border-zinc-200 dark:border-zinc-700 font-sans shadow-sm">
                    ESC
                  </kbd>
                </div>
              </div>
              
              <div className="overflow-y-auto p-2">
                {query === '?' ? (
                  <div className="p-4 text-center text-zinc-500">
                    <Command className="w-12 h-12 mx-auto mb-3 opacity-20" />
                    <h3 className="font-bold text-zinc-900 dark:text-white mb-4">Skróty Klawiszowe</h3>
                    <div className="grid grid-cols-2 gap-4 text-sm text-left max-w-md mx-auto">
                      <div className="flex justify-between items-center"><span className="text-zinc-600 dark:text-zinc-400">Paleta poleceń</span><kbd className="px-2 py-1 bg-zinc-100 dark:bg-zinc-800 rounded-md border border-zinc-200 dark:border-zinc-700 shadow-sm font-sans text-xs">⌘ K</kbd></div>
                      <div className="flex justify-between items-center"><span className="text-zinc-600 dark:text-zinc-400">Nauka</span><kbd className="px-2 py-1 bg-zinc-100 dark:bg-zinc-800 rounded-md border border-zinc-200 dark:border-zinc-700 shadow-sm font-sans text-xs">N</kbd></div>
                      <div className="flex justify-between items-center"><span className="text-zinc-600 dark:text-zinc-400">Statystyki</span><kbd className="px-2 py-1 bg-zinc-100 dark:bg-zinc-800 rounded-md border border-zinc-200 dark:border-zinc-700 shadow-sm font-sans text-xs">S</kbd></div>
                      <div className="flex justify-between items-center"><span className="text-zinc-600 dark:text-zinc-400">Multiplayer</span><kbd className="px-2 py-1 bg-zinc-100 dark:bg-zinc-800 rounded-md border border-zinc-200 dark:border-zinc-700 shadow-sm font-sans text-xs">M</kbd></div>
                    </div>
                  </div>
                ) : (
                  <>
                    {filteredNav.length > 0 && (
                      <div className="mb-4">
                        <div className="px-3 py-1.5 text-xs font-semibold text-zinc-500 dark:text-zinc-400">Nawigacja</div>
                        {filteredNav.map((item, i) => (
                          <div
                            key={item.id}
                            onMouseEnter={() => setSelectedIndex(i)}
                            onClick={() => { item.action(); close(); }}
                            className={`flex items-center justify-between px-3 py-3 mx-1 rounded-xl cursor-default transition-colors ${
                              selectedIndex === i ? 'bg-primary-50 dark:bg-primary-500/10 text-primary-700 dark:text-primary-300' : 'text-zinc-700 dark:text-zinc-300'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              {item.icon}
                              <span className="font-medium">{item.label}</span>
                            </div>
                            <kbd className="hidden sm:flex items-center justify-center h-6 min-w-[24px] px-1 text-[11px] font-bold text-zinc-500 bg-white dark:bg-zinc-800 rounded-md border border-zinc-200 dark:border-zinc-700 font-sans shadow-sm">
                              {item.shortcut}
                            </kbd>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {filteredSessions.length > 0 && (
                      <div>
                        <div className="px-3 py-1.5 text-xs font-semibold text-zinc-500 dark:text-zinc-400">Bazy pytań</div>
                        {filteredSessions.map((session, i) => {
                          const actualIndex = i + filteredNav.length;
                          return (
                            <div
                              key={session.id}
                              onMouseEnter={() => setSelectedIndex(actualIndex)}
                              onClick={() => { setLocation('/nauka'); close(); }}
                              className={`flex items-center gap-3 px-3 py-3 mx-1 rounded-xl cursor-default transition-colors ${
                                selectedIndex === actualIndex ? 'bg-primary-50 dark:bg-primary-500/10 text-primary-700 dark:text-primary-300' : 'text-zinc-700 dark:text-zinc-300'
                              }`}
                            >
                              <BookOpen className="w-4 h-4 opacity-50" />
                              <span className="font-medium">{session.baseName}</span>
                              <span className="ml-auto text-xs opacity-50">{session.totalQuestions} pytań</span>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {allItems.length === 0 && (
                      <div className="p-8 text-center text-zinc-500 dark:text-zinc-400">
                        Brak wyników dla "{query}"
                      </div>
                    )}
                  </>
                )}
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};
