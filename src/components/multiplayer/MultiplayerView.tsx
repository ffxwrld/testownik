import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useMultiplayerContext } from '../../contexts/MultiplayerContext';
import { getAllSessionMetadata, loadSession, saveSession, buildInitialSession } from '../../utils/session';
import { exportSessionToZip, importSessionFromZip } from '../../utils/parser';
import { SavedSessionMetadata } from '../../models/types';
import { Users, Play, Download, CheckCircle, Copy, CircleNotch, QrCode } from '@phosphor-icons/react';
import { toast } from 'sonner';
import { BackButton } from '../common/BackButton';
import { QRCodeModal } from './QRCodeModal';

interface MultiplayerViewProps {
  onStartSession: (sessionId: string) => void;
}

export const MultiplayerView: React.FC<MultiplayerViewProps> = ({ onStartSession }) => {
  const { t } = useTranslation();
  const { 
    roomCode, 
    isHost, 
    isSendingPackage,
    players, 
    profile,
    joinRoom, 
    cleanup, 
    sendFileToAll, 
    markPlayerReady,
    receivedFile, 
    startRace, 
    raceStarted 
  } = useMultiplayerContext();

  const [view, setView] = useState<'menu' | 'host_select' | 'join' | 'lobby'>(() => {
    return roomCode ? 'lobby' : 'menu';
  });
  const [savedSessions, setSavedSessions] = useState<SavedSessionMetadata[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [joinCode, setJoinCode] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        const params = new URLSearchParams(window.location.search);
        const code = params.get('room') || params.get('code');
        if (code) return code.trim().toUpperCase();
      } catch {
        // ignore
      }
    }
    if (typeof sessionStorage !== 'undefined') {
      const pending = sessionStorage.getItem('testownik_pending_room');
      if (pending) return pending.trim().toUpperCase();
    }
    return '';
  });
  const [importedSessionId, setImportedSessionId] = useState<string | null>(null);
  const [showQrModal, setShowQrModal] = useState(false);
  const autoJoinAttemptedRef = useRef(false);

  // Automatyczne dołączanie z linku (parametr ?room=XXXXXX lub ?code=XXXXXX)
  useEffect(() => {
    if (autoJoinAttemptedRef.current || roomCode || !profile) return;

    let targetCode: string | null = null;
    if (typeof window !== 'undefined') {
      try {
        const params = new URLSearchParams(window.location.search);
        targetCode = params.get('room') || params.get('code');
      } catch {
        // ignore
      }
    }
    if (!targetCode && typeof sessionStorage !== 'undefined') {
      targetCode = sessionStorage.getItem('testownik_pending_room');
    }

    if (targetCode) {
      const clean = targetCode.trim().toUpperCase();
      if (clean.length === 6) {
        autoJoinAttemptedRef.current = true;
        if (typeof sessionStorage !== 'undefined') {
          sessionStorage.removeItem('testownik_pending_room');
        }
        if (typeof window !== 'undefined' && window.location.search) {
          window.history.replaceState({}, document.title, window.location.pathname);
        }
        toast.info(`Dołączanie do pokoju ${clean}...`);
        joinRoom(clean, false)
          .then(() => {
            setView('lobby');
            toast.success(`Dołączono do pokoju ${clean}`);
          })
          .catch((err) => {
            console.error('Błąd auto-dołączania:', err);
            toast.error('Nie udało się dołączyć do pokoju z linku');
          });
      }
    }
  }, [roomCode, profile, joinRoom]);

  useEffect(() => {
    if (roomCode && view === 'menu') {
      setView('lobby');
    }
  }, [roomCode, view]);

  useEffect(() => {
    if (view === 'host_select') {
      getAllSessionMetadata().then(setSavedSessions);
    }
  }, [view]);

  useEffect(() => {
    if (receivedFile && !isHost) {
      toast.info(t('multiplayer.toasts.unpacking', 'Rozpakowywanie bazy pytań...'));
      importSessionFromZip(receivedFile).then(({ sessionId }) => {
        setImportedSessionId(sessionId);
        markPlayerReady();
        toast.success(t('multiplayer.toasts.readyForRace', 'Baza pytań gotowa do wyścigu!'));
      }).catch(err => {
        console.error('Błąd importu paczki:', err);
        toast.error(t('multiplayer.toasts.importError', 'Błąd importu bazy pytań: {{error}}', { error: (err as Error).message || err }));
      });
    }
  }, [receivedFile, isHost, markPlayerReady, t]);

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
    if (!selectedSessionId) {
      toast.error(t('multiplayer.toasts.selectSessionFirst', 'Wybierz najpierw bazę pytań dla pokoju'));
      return;
    }
    try {
      const session = await loadSession(selectedSessionId);
      if (!session) {
        toast.error(t('multiplayer.toasts.memoryLoadFailed', 'Nie udało się wczytać bazy pytań z pamięci'));
        return;
      }
      
      // Tworzymy w 100% świeżą sesję z nowo potasowaną kolejką i wyzerowanym postępem
      const cleanSession = buildInitialSession(
        session.questions,
        session.repeatMode > 1 ? session.repeatMode : 1,
        session.baseName
      );
      
      // Kluczowe: Zapisujemy zresetowaną sesję u gospodarza, aby host startował od zera, a nie w widoku podsumowania!
      await saveSession(cleanSession, selectedSessionId);
      
      // I tę samą wyzerowaną sesję pakujemy dla gości
      const blob = await exportSessionToZip(selectedSessionId, cleanSession);
      await sendFileToAll(blob);
    } catch (err) {
      console.error('Błąd eksportu bazy pytań:', err);
      toast.error(t('multiplayer.toasts.prepError', 'Błąd przygotowania bazy pytań: {{error}}', { error: (err as Error).message || err }));
    }
  };

  return (
    <div className="w-full space-y-6">
        <AnimatePresence mode="wait">
          {view === 'menu' && (
            <div key="menu">
              <div className="mb-8 mt-2">
                <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                  {t('multiplayer.menu.title', 'Graj ze znajomymi')}
                </h1>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="p-8 cursor-pointer rounded-2xl bg-white dark:bg-zinc-900 border-2 shadow-sm border-transparent hover:border-primary-500 transition-colors group" onClick={() => setView('host_select')}>
                  <div className="w-16 h-16 bg-primary-100 dark:bg-primary-900/30 rounded-2xl flex items-center justify-center text-primary-600 dark:text-primary-400 mb-6 group-hover:scale-110 transition-transform">
                    <Play className="w-8 h-8 ml-1" fill="currentColor" />
                  </div>
                  <h2 className="text-2xl font-bold mb-2 text-zinc-900 dark:text-white">
                    {t('multiplayer.menu.hostTitle', 'Stwórz Pokój')}
                  </h2>
                  <p className="text-zinc-500">
                    {t('multiplayer.menu.hostDesc', 'Wybierz paczkę ze swojego telefonu i udostępnij ją znajomym przez WebRTC. Bądź hostem wyścigu.')}
                  </p>
                </div>
                
                <div className="p-8 cursor-pointer rounded-2xl bg-white dark:bg-zinc-900 border-2 shadow-sm border-transparent hover:border-blue-500 transition-colors group" onClick={() => setView('join')}>
                  <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center text-blue-600 dark:text-blue-400 mb-6 group-hover:scale-110 transition-transform">
                    <Users className="w-8 h-8" />
                  </div>
                  <h2 className="text-2xl font-bold mb-2 text-zinc-900 dark:text-white">
                    {t('multiplayer.menu.joinTitle', 'Dołącz do znajomych')}
                  </h2>
                  <p className="text-zinc-500">
                    {t('multiplayer.menu.joinDesc', 'Wpisz 6-cyfrowy kod pokoju, aby pobrać paczkę P2P i rozpocząć rywalizację na żywo.')}
                  </p>
                </div>
              </div>
            </div>
          )}

          {view === 'host_select' && (
            <motion.div key="host_select" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <div className="flex items-center gap-4 mb-6">
                <BackButton onClick={() => setView('menu')} />
                <h2 className="text-xl font-bold text-zinc-900 dark:text-white">
                  {t('multiplayer.hostSelect.title', 'Wybierz paczkę dla pokoju')}
                </h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {savedSessions.map(s => (
                  <div 
                    key={s.id} 
                    className={`p-5 cursor-pointer rounded-2xl shadow-sm border-2 transition-colors duration-200 ${selectedSessionId === s.id ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/10' : 'border-transparent hover:border-zinc-300 dark:hover:border-zinc-700 bg-white dark:bg-zinc-900'}`}
                    onClick={() => setSelectedSessionId(s.id)}
                  >
                    <h3 className="font-bold text-lg mb-1 text-zinc-900 dark:text-white">{s.baseName}</h3>
                    <p className="text-sm text-zinc-500">
                      {t('multiplayer.hostSelect.questionsCount', '{{count}} pytań', { count: s.totalQuestions })}
                    </p>
                  </div>
                ))}
              </div>
              
              <div className="mt-8 flex justify-end">
                <button 
                  disabled={!selectedSessionId}
                  onClick={handleHost}
                  className="px-6 py-3 bg-primary-600 text-white rounded-xl font-bold disabled:opacity-50 hover:bg-primary-700 transition cursor-pointer"
                >
                  {t('multiplayer.hostSelect.generateCodeBtn', 'Generuj Kod Pokoju')}
                </button>
              </div>
            </motion.div>
          )}

          {view === 'join' && (
            <motion.div key="join" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="max-w-md mx-auto mt-6 text-center relative">
              <div className="text-left mb-6">
                <BackButton onClick={() => setView('menu')} />
              </div>
              <h2 className="text-2xl font-bold mb-6 text-zinc-900 dark:text-white">
                {t('multiplayer.join.title', 'Wpisz kod pokoju')}
              </h2>
              <input 
                type="text" 
                maxLength={6}
                value={joinCode}
                onChange={e => setJoinCode(e.target.value.toUpperCase())}
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="characters"
                spellCheck="false"
                className="w-full text-center text-2xl sm:text-4xl font-black tracking-[0.25em] sm:tracking-[0.5em] p-4 sm:p-6 rounded-2xl bg-zinc-100 dark:bg-zinc-800/50 border-2 border-zinc-200 dark:border-zinc-700 focus:border-primary-500 focus:outline-none transition mb-6 uppercase text-zinc-900 dark:text-white font-mono notranslate"
                translate="no"
                placeholder="------"
              />
              <button 
                disabled={joinCode.length !== 6}
                onClick={handleJoin}
                className="w-full py-4 bg-blue-600 text-white rounded-xl font-bold text-lg disabled:opacity-50 hover:bg-blue-700 transition shadow-lg shadow-blue-500/30 cursor-pointer"
              >
                {t('multiplayer.join.joinBtn', 'Dołącz')}
              </button>
            </motion.div>
          )}

          {view === 'lobby' && (
            <motion.div key="lobby" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="max-w-2xl mx-auto text-center mt-4 relative">
              <div className="flex items-center justify-between mb-6">
                <BackButton onClick={handleLeaveLobby} label={t('multiplayer.lobby.leaveRoom', 'Opuść pokój')} />
              </div>
              <div className="mb-12">
                <p className="text-sm font-bold text-zinc-500 uppercase tracking-widest mb-2">
                  {t('multiplayer.lobby.roomCode', 'Kod Pokoju')}
                </p>
                <div className="flex items-center justify-center gap-3">
                  <div 
                    className="inline-flex items-center gap-4 bg-zinc-100 dark:bg-zinc-800 px-7 sm:px-8 py-3.5 sm:py-4 rounded-3xl cursor-pointer hover:bg-zinc-200 dark:hover:bg-zinc-700 transition shadow-inner" 
                    onClick={() => {
                      if (roomCode) {
                        navigator.clipboard.writeText(roomCode);
                        toast.success(t('multiplayer.lobby.copyCodeSuccess', 'Skopiowano kod do schowka'));
                      }
                    }}
                    title={t('multiplayer.lobby.copyTooltip', 'Kliknij, aby skopiować kod')}
                  >
                    <span className="text-4xl sm:text-5xl font-black tracking-widest text-zinc-900 dark:text-zinc-50 font-mono notranslate" translate="no">{roomCode}</span>
                    <Copy className="w-5 h-5 sm:w-6 sm:h-6 text-zinc-400" />
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowQrModal(true)}
                    className="p-3.5 sm:p-4 rounded-3xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 transition shadow-inner flex items-center justify-center cursor-pointer group"
                    title={t('multiplayer.lobby.qrTooltip', 'Pokaż kod QR')}
                    aria-label={t('multiplayer.lobby.qrTooltip', 'Pokaż kod QR')}
                  >
                    <QrCode className="w-7 h-7 sm:w-8 sm:h-8 group-hover:scale-110 transition-transform text-primary-600 dark:text-primary-400" />
                  </button>
                </div>
              </div>

              <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 p-6 shadow-sm mb-8">
                <h3 className="text-left font-bold text-lg mb-6 flex items-center justify-between text-zinc-900 dark:text-white">
                  <span>{t('multiplayer.lobby.playersCount', 'Gracze ({{count}})', { count: players.length })}</span>
                  <div className="flex items-center gap-2">
                    {isHost && players.length > 1 && players.every(p => p.status === 'ready' || p.isHost) && (
                      <button onClick={startRace} className="text-sm bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 px-4 py-2 rounded-lg font-bold hover:bg-emerald-200 dark:hover:bg-emerald-900/50 transition cursor-pointer">
                        {t('multiplayer.lobby.startRace', 'Rozpocznij Wyścig!')}
                      </button>
                    )}
                    {isHost && players.length > 1 && (
                      <button 
                        disabled={isSendingPackage}
                        onClick={handleStartTransfer} 
                        className="text-sm bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400 px-4 py-2 rounded-lg font-bold hover:bg-primary-200 dark:hover:bg-primary-900/50 transition flex items-center gap-2 disabled:opacity-50 cursor-pointer"
                      >
                        {isSendingPackage && <CircleNotch className="w-4 h-4 animate-spin" />}
                        {isSendingPackage 
                          ? t('multiplayer.lobby.sendingPackage', 'Wysyłanie...') 
                          : players.some(p => !p.isHost && p.status === 'ready') 
                          ? t('multiplayer.lobby.resendPackage', 'Wyślij ponownie') 
                          : t('multiplayer.lobby.sendPackage', 'Wyślij paczkę')}
                      </button>
                    )}
                  </div>
                </h3>
                
                <div className="space-y-4">
                  {players.map(p => {
                    const defaultName = t('multiplayer.podium.player', 'Gracz');
                    const displayName = p.username || defaultName;
                    const safeProgress = Math.min(100, Math.max(0, Math.round(Number(p.progress) || 0)));

                    return (
                      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} key={p.userId} className="flex items-center justify-between p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800">
                        <div className="flex items-center gap-4">
                          {p.avatarUrl ? (
                              <img src={p.avatarUrl} alt={displayName} className="w-12 h-12 rounded-full border-2 border-zinc-200 dark:border-zinc-700 object-cover" />
                          ) : (
                              <div className="w-12 h-12 rounded-full bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center font-bold text-zinc-500">
                                  {displayName.charAt(0).toUpperCase()}
                              </div>
                          )}
                          <div className="text-left">
                            <p className="font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                              <span>{displayName}</span>
                              {p.isHost && <span className="text-[10px] bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 px-2 py-0.5 rounded-full uppercase tracking-wider">{t('multiplayer.lobby.hostBadge', 'Host')}</span>}
                            </p>
                            <div className="text-xs text-zinc-500 font-medium">
                              {p.status === 'joined' && <span key="status-joined">{t('multiplayer.lobby.statusInLobby', 'W poczekalni')}</span>}
                              {p.status === 'downloading' && <span key="status-downloading">{t('multiplayer.lobby.statusDownloading', 'Pobieranie paczki...')}</span>}
                              {p.status === 'ready' && <span key="status-ready">{t('multiplayer.lobby.statusReady', 'Gotowy')}</span>}
                            </div>
                          </div>
                        </div>
                        
                        <div className="w-32 flex flex-col items-end">
                          {p.status === 'downloading' && (
                            <div key="progress-wrap" className="w-full flex flex-col items-end">
                              <span className="text-xs font-bold text-primary-500 mb-1 tabular-nums">{safeProgress}%</span>
                              <div className="w-full h-2 bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden">
                                <motion.div 
                                  className="h-full bg-primary-500 rounded-full"
                                  initial={{ width: 0 }}
                                  animate={{ width: `${safeProgress}%` }}
                                />
                              </div>
                            </div>
                          )}
                          {p.status === 'ready' && (
                            <div key="ready-wrap">
                              <CheckCircle className="w-6 h-6 text-emerald-500" />
                            </div>
                          )}
                          {p.status === 'joined' && !p.isHost && (
                            <div key="joined-wrap">
                              <Download className="w-5 h-5 text-zinc-300 dark:text-zinc-700" />
                            </div>
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>

              <button 
                onClick={() => { cleanup(); setView('menu'); }}
                className="text-zinc-500 hover:text-zinc-900 dark:hover:text-white font-bold transition-colors cursor-pointer"
              >
                {t('multiplayer.lobby.leaveRoom', 'Opuść pokój')}
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showQrModal && roomCode && (
            <QRCodeModal roomCode={roomCode} onClose={() => setShowQrModal(false)} />
          )}
        </AnimatePresence>
      </div>
  );
};
