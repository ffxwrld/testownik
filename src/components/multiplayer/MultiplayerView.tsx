import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useMultiplayerContext } from '../../contexts/MultiplayerContext';
import { getAllSessionMetadata, loadSession, saveSession, buildInitialSession, deleteEphemeralSession } from '../../utils/session';
import { exportSessionToZip, importSessionFromZip } from '../../utils/parser';
import { SavedSessionMetadata } from '../../models/types';
import { Users, Play, Download, CheckCircle, Copy, CircleNotch, QrCode, FlagCheckered, Sword, Cards } from '@phosphor-icons/react';
import { toast } from 'sonner';
import { BackButton } from '../common/BackButton';
import { QRCodeModal } from './QRCodeModal';
import { cn } from '../../utils/cn';

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
    raceStarted,
    gameMode,
    setGameMode,
    returnToLobbyCount,
  } = useMultiplayerContext();

  const [view, setView] = useState<'menu' | 'join' | 'lobby'>(() => {
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
    if (view === 'lobby' && isHost) {
      getAllSessionMetadata().then(setSavedSessions);
    }
  }, [view, isHost]);

  useEffect(() => {
    if (receivedFile && !isHost) {
      toast.info(t('multiplayer.toasts.unpacking', 'Rozpakowywanie bazy pytań...'));
      
      // Cleanup previous ephemeral session if we're receiving a new one (e.g. host clicked "Wyślij ponownie")
      if (importedSessionId) {
        deleteEphemeralSession(importedSessionId);
      }

      importSessionFromZip(receivedFile, { ephemeral: true }).then(({ sessionId }) => {
        setImportedSessionId(sessionId);
        markPlayerReady();
        toast.success(t('multiplayer.toasts.readyForRace', 'Baza pytań gotowa do wyścigu!'));
      }).catch(err => {
        console.error('Błąd importu paczki:', err);
        toast.error(t('multiplayer.toasts.importError', 'Błąd importu bazy pytań: {{error}}', { error: (err as Error).message || err }));
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [receivedFile, isHost, markPlayerReady, t]);

  useEffect(() => {
    if (returnToLobbyCount > 0 && importedSessionId && !isHost) {
      // Cleanup ephemeral session on return to lobby so guest needs a new package
      deleteEphemeralSession(importedSessionId);
      setImportedSessionId(null);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [returnToLobbyCount, isHost]);

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
    if (importedSessionId && !isHost) {
      deleteEphemeralSession(importedSessionId);
      setImportedSessionId(null);
    }
    cleanup();
    setView('menu');
  };

  const handleHost = async () => {
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
        (typeof session.repeatMode === 'number' && session.repeatMode > 1) ? session.repeatMode : 1,
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
                <div className="p-8 cursor-pointer rounded-2xl bg-white dark:bg-zinc-900 border-2 shadow-sm border-transparent hover:border-primary-500 transition-colors group" onClick={handleHost}>
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

              {/* Host Session Picker */}
              {isHost && (
                <div className="bg-white/90 dark:bg-zinc-900/90 backdrop-blur-xl rounded-3xl border border-black/[0.06] dark:border-white/[0.08] p-6 shadow-xs mb-6 text-left">
                  <h3 className="font-bold text-lg text-zinc-900 dark:text-white tracking-tight mb-4">
                    {t('multiplayer.hostSelect.title', 'Wybierz paczkę dla pokoju')}
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    {savedSessions.map(s => (
                      <div 
                        key={s.id} 
                        className={`p-4 cursor-pointer rounded-2xl shadow-xs border-2 transition-all duration-200 ${selectedSessionId === s.id ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 ring-1 ring-primary-500/25' : 'border-black/[0.06] dark:border-white/[0.08] bg-zinc-100/70 dark:bg-zinc-800/50 hover:bg-zinc-100 dark:hover:bg-zinc-800/80 hover:border-zinc-300 dark:hover:border-zinc-600'}`}
                        onClick={() => setSelectedSessionId(s.id)}
                      >
                        <h3 className="font-bold text-sm mb-1 text-zinc-900 dark:text-white line-clamp-1">{s.baseName}</h3>
                        <p className="text-xs text-zinc-500">
                          {t('multiplayer.hostSelect.questionsCount', '{{count}} pytań', { count: s.totalQuestions })}
                        </p>
                      </div>
                    ))}
                  </div>
                  {savedSessions.length === 0 && (
                    <div className="text-center p-6 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-700">
                      <p className="text-sm text-zinc-500">Brak zapisanych testów. Wróć do menu głównego i zaimportuj bazę.</p>
                    </div>
                  )}
                </div>
              )}

              {/* Game Mode Selector */}
              <div className="bg-white/90 dark:bg-zinc-900/90 backdrop-blur-xl rounded-3xl border border-black/[0.06] dark:border-white/[0.08] p-6 shadow-xs mb-6 text-left">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-lg text-zinc-900 dark:text-white tracking-tight flex items-center gap-2">
                    <span>{t('multiplayer.mode.title', 'Tryb Gry')}</span>
                  </h3>
                  {!isHost && (
                    <span className="text-xs text-zinc-400 dark:text-zinc-500 font-medium">
                      {t('multiplayer.mode.hostSelected', 'Wybór gospodarza')}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                  {/* Mode 1: Classic Race */}
                  <div
                    onClick={() => isHost && setGameMode('race')}
                    className={cn(
                      "p-4 rounded-2xl border-2 transition-all duration-200 text-left relative overflow-hidden select-none",
                      isHost ? "cursor-pointer active:scale-[0.98]" : "cursor-default",
                      gameMode === 'race'
                        ? "border-emerald-500 bg-emerald-500/10 dark:bg-emerald-950/30 shadow-xs ring-1 ring-emerald-500/25"
                        : "border-black/[0.06] dark:border-white/[0.08] bg-zinc-100/70 dark:bg-zinc-800/50 hover:bg-zinc-100 dark:hover:bg-zinc-800/80 hover:border-zinc-300 dark:hover:border-zinc-600"
                    )}
                  >
                    {gameMode === 'race' && (
                      <span className="absolute top-3.5 right-3.5 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-4 ring-emerald-500/20 dark:ring-emerald-400/20 shadow-xs" />
                    )}
                    <div className="w-9 h-9 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-3 shadow-inner">
                      <FlagCheckered className="w-5 h-5" weight="duotone" />
                    </div>
                    <div className={cn(
                      "font-bold text-sm tracking-tight",
                      gameMode === 'race' ? "text-emerald-950 dark:text-emerald-50" : "text-zinc-900 dark:text-zinc-100"
                    )}>
                      {t('multiplayer.mode.raceTitle', 'Klasyczny Wyścig')}
                    </div>
                    <p className={cn(
                      "text-xs mt-1.5 leading-relaxed",
                      gameMode === 'race' ? "text-emerald-900/80 dark:text-emerald-200/90" : "text-zinc-600 dark:text-zinc-300"
                    )}>
                      {t('multiplayer.mode.raceDesc', 'Kto pierwszy ukończy 100% pytań z bazy.')}
                    </p>
                  </div>

                  {/* Mode 2: Tug of War */}
                  <div
                    onClick={() => isHost && setGameMode('tug_of_war')}
                    className={cn(
                      "p-4 rounded-2xl border-2 transition-all duration-200 text-left relative overflow-hidden select-none",
                      isHost ? "cursor-pointer active:scale-[0.98]" : "cursor-default",
                      gameMode === 'tug_of_war'
                        ? "border-blue-500 bg-blue-500/10 dark:bg-blue-950/30 shadow-xs ring-1 ring-blue-500/25"
                        : "border-black/[0.06] dark:border-white/[0.08] bg-zinc-100/70 dark:bg-zinc-800/50 hover:bg-zinc-100 dark:hover:bg-zinc-800/80 hover:border-zinc-300 dark:hover:border-zinc-600"
                    )}
                  >
                    {gameMode === 'tug_of_war' && (
                      <span className="absolute top-3.5 right-3.5 w-2.5 h-2.5 rounded-full bg-blue-500 ring-4 ring-blue-500/20 dark:ring-blue-400/20 shadow-xs" />
                    )}
                    <div className="w-9 h-9 rounded-xl bg-blue-500/15 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-3 shadow-inner">
                      <Sword className="w-5 h-5" weight="duotone" />
                    </div>
                    <div className={cn(
                      "font-bold text-sm tracking-tight",
                      gameMode === 'tug_of_war' ? "text-blue-950 dark:text-blue-50" : "text-zinc-900 dark:text-zinc-100"
                    )}>
                      {t('multiplayer.mode.tugTitle', 'Przeciąganie Liny')}
                    </div>
                    <p className={cn(
                      "text-xs mt-1.5 leading-relaxed",
                      gameMode === 'tug_of_war' ? "text-blue-900/80 dark:text-blue-200/90" : "text-zinc-600 dark:text-zinc-300"
                    )}>
                      {t('multiplayer.mode.tugDesc', 'Dobre odpowiedzi ciągną linę, błędy odpychają. K.O. lub limit czasu.')}
                    </p>
                  </div>

                  {/* Mode 3: Poker Wager */}
                  <div
                    onClick={() => isHost && setGameMode('poker')}
                    className={cn(
                      "p-4 rounded-2xl border-2 transition-all duration-200 text-left relative overflow-hidden select-none",
                      isHost ? "cursor-pointer active:scale-[0.98]" : "cursor-default",
                      gameMode === 'poker'
                        ? "border-amber-500 bg-amber-500/10 dark:bg-amber-950/30 shadow-xs ring-1 ring-amber-500/25"
                        : "border-black/[0.06] dark:border-white/[0.08] bg-zinc-100/70 dark:bg-zinc-800/50 hover:bg-zinc-100 dark:hover:bg-zinc-800/80 hover:border-zinc-300 dark:hover:border-zinc-600"
                    )}
                  >
                    {gameMode === 'poker' && (
                      <span className="absolute top-3.5 right-3.5 w-2.5 h-2.5 rounded-full bg-amber-500 ring-4 ring-amber-500/20 dark:ring-amber-400/20 shadow-xs" />
                    )}
                    <div className="w-9 h-9 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-3 shadow-inner">
                      <Cards className="w-5 h-5" weight="duotone" />
                    </div>
                    <div className={cn(
                      "font-bold text-sm tracking-tight",
                      gameMode === 'poker' ? "text-amber-950 dark:text-amber-50" : "text-zinc-900 dark:text-zinc-100"
                    )}>
                      {t('multiplayer.mode.pokerTitle', 'Poker Wiedzy')}
                    </div>
                    <p className={cn(
                      "text-xs mt-1.5 leading-relaxed",
                      gameMode === 'poker' ? "text-amber-900/80 dark:text-amber-200/90" : "text-zinc-600 dark:text-zinc-300"
                    )}>
                      {t('multiplayer.mode.pokerDesc', 'Licytacja żetonów w ciemno przed odkryciem odpowiedzi. Rundy i blef.')}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 p-6 shadow-sm mb-8">
                <h3 className="text-left font-bold text-lg mb-6 flex items-center justify-between text-zinc-900 dark:text-white">
                  <span>{t('multiplayer.lobby.playersCount', 'Gracze ({{count}})', { count: players.length })}</span>
                  <div className="flex items-center gap-2">
                    {isHost && players.length > 1 && players.every(p => p.status === 'ready' || p.isHost) && (
                      <button onClick={() => startRace()} className="text-sm bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 px-4 py-2 rounded-lg font-bold hover:bg-emerald-200 dark:hover:bg-emerald-900/50 transition cursor-pointer">
                        {gameMode === 'tug_of_war'
                          ? t('multiplayer.lobby.startTug', 'Rozpocznij Pojedynek!')
                          : gameMode === 'poker'
                          ? t('multiplayer.lobby.startPoker', 'Rozpocznij Pokera!')
                          : t('multiplayer.lobby.startRace', 'Rozpocznij Wyścig!')}
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
