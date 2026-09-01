import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMultiplayerContext } from '../../contexts/MultiplayerContext';
import { getAllSessionMetadata, loadSession } from '../../utils/session';
import { exportSessionToZip, importSessionFromZip } from '../../utils/parser';
import { SavedSessionMetadata } from '../../models/types';
import { Users, Play, Download, CheckCircle2, Copy } from 'lucide-react';

interface MultiplayerViewProps {
  onStartSession: (sessionId: string) => void;
}

export const MultiplayerView: React.FC<MultiplayerViewProps> = ({ onStartSession }) => {
  const [view, setView] = useState<'menu' | 'host_select' | 'join' | 'lobby'>('menu');
  const [savedSessions, setSavedSessions] = useState<SavedSessionMetadata[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [joinCode, setJoinCode] = useState('');
  const [importedSessionId, setImportedSessionId] = useState<string | null>(null);
  
  const { roomCode, isHost, players, joinRoom, cleanup, sendFileToAll, receivedFile, startRace, raceStarted} = useMultiplayerContext();

  useEffect(() => {
    if (view === 'host_select') {
      getAllSessionMetadata().then(setSavedSessions);
    }
  }, [view]);

  
  useEffect(() => {
    if (receivedFile && !isHost) {
      console.log('Got file via P2P! Unzipping...');
      importSessionFromZip(receivedFile).then(({ sessionId }) => {
        // Zapiszmy otrzymany sessionId jako stan do odpalenia
        console.log('Unzipped to session', sessionId);
        setImportedSessionId(sessionId);
      }).catch(err => {
        console.error('Failed to import P2P session', err);
      });
    }
  }, [receivedFile, isHost]);


  
  useEffect(() => {
    if (raceStarted) {
      if (isHost && selectedSessionId) {
        onStartSession(selectedSessionId);
      } else if (!isHost && importedSessionId) {
        onStartSession(importedSessionId);
      }
    }
  }, [raceStarted, isHost, selectedSessionId, importedSessionId, onStartSession]);

  const handleLeaveLobby = () => {
    cleanup();
    setView('menu');
  };

  const handleHost = async () => {
    if (!selectedSessionId) return;
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    await joinRoom(code, true);
    setView('lobby');
  };

  const handleJoin = async () => {
    if (joinCode.length === 6) {
      await joinRoom(joinCode, false);
      setView('lobby');
    }
  };

  const handleStartTransfer = async () => {
    if (!selectedSessionId) return;
    const session = await loadSession(selectedSessionId);
    if (!session) return;
    
    // Zresetuj postęp paczki zanim wyślesz ją znajomym
    const cleanSession = {
      ...session,
      phase: 'test' as const,
      currentQuestionIndex: 0,
      done: [],
      doneStats: [],
      totalFirstAttempts: 0,
      totalFirstCorrect: 0,
      elapsedSeconds: 0,
      queue: session.questions.map(q => ({
        questionId: q.id,
        requiredCorrectStreak: session.repeatMode > 1 ? session.repeatMode : 1,
        consecutiveCorrect: 0,
        wrongCount: 0,
        firstAnswerWrong: false
      }))
    };
    
    const blob = await exportSessionToZip(selectedSessionId, cleanSession);
    sendFileToAll(blob);
  };

  return (
    <div className="flex-1 overflow-y-auto hide-scrollbar bg-transparent p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 mb-8 mt-2">
          Graj ze znajomymi
        </h1>

        <AnimatePresence mode="wait">
          {view === 'menu' && (
            <motion.div key="menu" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="p-8 cursor-pointer rounded-2xl bg-white dark:bg-zinc-900 border-2 shadow-sm border-transparent hover:border-primary-500 transition-colors group" onClick={() => setView('host_select')}>
                <div className="w-16 h-16 bg-primary-100 dark:bg-primary-900/30 rounded-2xl flex items-center justify-center text-primary-600 dark:text-primary-400 mb-6 group-hover:scale-110 transition-transform">
                  <Play className="w-8 h-8 ml-1" fill="currentColor" />
                </div>
                <h2 className="text-2xl font-bold mb-2 text-zinc-900 dark:text-white">Stwórz Pokój</h2>
                <p className="text-zinc-500">Wybierz paczkę ze swojego telefonu i udostępnij ją znajomym przez WebRTC. Bądź hostem wyścigu.</p>
              </div>
              
              <div className="p-8 cursor-pointer rounded-2xl bg-white dark:bg-zinc-900 border-2 shadow-sm border-transparent hover:border-blue-500 transition-colors group" onClick={() => setView('join')}>
                <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center text-blue-600 dark:text-blue-400 mb-6 group-hover:scale-110 transition-transform">
                  <Users className="w-8 h-8" />
                </div>
                <h2 className="text-2xl font-bold mb-2 text-zinc-900 dark:text-white">Dołącz do znajomych</h2>
                <p className="text-zinc-500">Wpisz 6-cyfrowy kod pokoju, aby pobrać paczkę P2P i rozpocząć rywalizację na żywo.</p>
              </div>
            </motion.div>
          )}

          {view === 'host_select' && (
            <motion.div key="host_select" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <div className="flex items-center gap-4 mb-6">
                <button onClick={() => setView('menu')} className="text-zinc-500 hover:text-zinc-900 dark:hover:text-white font-semibold text-sm">&larr; Wróć</button>
                <h2 className="text-xl font-bold text-zinc-900 dark:text-white">Wybierz paczkę dla pokoju</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {savedSessions.map(s => (
                  <div 
                    key={s.id} 
                    className={`p-5 cursor-pointer rounded-2xl shadow-sm border-2 transition-all ${selectedSessionId === s.id ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/10' : 'border-transparent hover:border-zinc-300 dark:hover:border-zinc-700 bg-white dark:bg-zinc-900'}`}
                    onClick={() => setSelectedSessionId(s.id)}
                  >
                    <h3 className="font-bold text-lg mb-1 text-zinc-900 dark:text-white">{s.baseName}</h3>
                    <p className="text-sm text-zinc-500">{s.totalQuestions} pytań</p>
                  </div>
                ))}
              </div>
              
              <div className="mt-8 flex justify-end">
                <button 
                  disabled={!selectedSessionId}
                  onClick={handleHost}
                  className="px-6 py-3 bg-primary-600 text-white rounded-xl font-bold disabled:opacity-50 hover:bg-primary-700 transition"
                >
                  Generuj Kod Pokoju
                </button>
              </div>
            </motion.div>
          )}

          {view === 'join' && (
            <motion.div key="join" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="max-w-md mx-auto mt-12 text-center relative">
              <div className="text-left mb-6">
                 <button onClick={() => setView('menu')} className="text-zinc-500 hover:text-zinc-900 dark:hover:text-white font-semibold text-sm">&larr; Wróć</button>
              </div>
              <h2 className="text-2xl font-bold mb-6 text-zinc-900 dark:text-white">Wpisz kod pokoju</h2>
              <input 
                type="text" 
                maxLength={6}
                value={joinCode}
                onChange={e => setJoinCode(e.target.value.toUpperCase())}
                className="w-full text-center text-4xl font-black tracking-[0.5em] p-6 rounded-2xl bg-zinc-100 dark:bg-zinc-800/50 border-2 border-zinc-200 dark:border-zinc-700 focus:border-primary-500 focus:outline-none transition mb-6 uppercase text-zinc-900 dark:text-white"
                placeholder="------"
              />
              <button 
                disabled={joinCode.length !== 6}
                onClick={handleJoin}
                className="w-full py-4 bg-blue-600 text-white rounded-xl font-bold text-lg disabled:opacity-50 hover:bg-blue-700 transition shadow-lg shadow-blue-500/30"
              >
                Dołącz
              </button>
            </motion.div>
          )}

          {view === 'lobby' && (
            <motion.div key="lobby" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="max-w-2xl mx-auto text-center mt-8 relative">
              <div className="absolute -top-12 left-0">
                 <button onClick={handleLeaveLobby} className="text-zinc-500 hover:text-red-500 font-semibold text-sm transition-colors flex items-center gap-1">
                    &larr; Opuść pokój
                 </button>
              </div>
              <div className="mb-12">
                <p className="text-sm font-bold text-zinc-500 uppercase tracking-widest mb-2">Kod Pokoju</p>
                <div className="inline-flex items-center gap-4 bg-zinc-100 dark:bg-zinc-800 px-8 py-4 rounded-3xl cursor-pointer hover:bg-zinc-200 dark:hover:bg-zinc-700 transition shadow-inner" onClick={() => navigator.clipboard.writeText(roomCode || '')}>
                  <span className="text-5xl font-black tracking-widest text-zinc-900 dark:text-zinc-50">{roomCode}</span>
                  <Copy className="w-6 h-6 text-zinc-400" />
                </div>
              </div>

              <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 p-6 shadow-sm mb-8">
                <h3 className="text-left font-bold text-lg mb-6 flex items-center justify-between text-zinc-900 dark:text-white">
                  <span>Gracze ({players.length})</span>
                  <div className="flex items-center gap-2">
                    {isHost && players.length > 1 && players.every(p => p.status === 'ready' || p.isHost) && (
                      <button onClick={startRace} className="text-sm bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 px-4 py-2 rounded-lg font-bold hover:bg-emerald-200 dark:hover:bg-emerald-900/50 transition">
                        Rozpocznij Wyścig!
                      </button>
                    )}
                    {isHost && players.length > 1 && (
                      <button onClick={handleStartTransfer} className="text-sm bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400 px-4 py-2 rounded-lg font-bold hover:bg-primary-200 dark:hover:bg-primary-900/50 transition">
                        Wyślij paczkę
                      </button>
                    )}
                  </div>
                </h3>
                
                <div className="space-y-4">
                  {players.map(p => (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} key={p.userId} className="flex items-center justify-between p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800">
                      <div className="flex items-center gap-4">
                        {p.avatarUrl ? (
                            <img src={p.avatarUrl} alt={p.username} className="w-12 h-12 rounded-full border-2 border-zinc-200 dark:border-zinc-700 object-cover" />
                        ) : (
                            <div className="w-12 h-12 rounded-full bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center font-bold text-zinc-500">
                                {p.username.charAt(0).toUpperCase()}
                            </div>
                        )}
                        <div className="text-left">
                          <p className="font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                            {p.username} {p.isHost && <span className="text-[10px] bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 px-2 py-0.5 rounded-full uppercase tracking-wider">Host</span>}
                          </p>
                          <p className="text-xs text-zinc-500 font-medium">
                            {p.status === 'joined' && 'W poczekalni'}
                            {p.status === 'downloading' && 'Pobieranie paczki...'}
                            {p.status === 'ready' && 'Gotowy'}
                          </p>
                        </div>
                      </div>
                      
                      <div className="w-32 flex flex-col items-end">
                        {p.status === 'downloading' && (
                          <>
                            <span className="text-xs font-bold text-primary-500 mb-1">{p.progress}%</span>
                            <div className="w-full h-2 bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden">
                              <motion.div 
                                className="h-full bg-primary-500 rounded-full"
                                initial={{ width: 0 }}
                                animate={{ width: `${p.progress}%` }}
                              />
                            </div>
                          </>
                        )}
                        {p.status === 'ready' && (
                          <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                        )}
                        {p.status === 'joined' && !p.isHost && (
                          <Download className="w-5 h-5 text-zinc-300 dark:text-zinc-700" />
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              <button 
                onClick={() => { cleanup(); setView('menu'); }}
                className="text-zinc-500 hover:text-zinc-900 dark:hover:text-white font-bold transition-colors"
              >
                Opuść pokój
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
