import React, { useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RotateCcw, ArrowLeft, Sparkles, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { Player } from '../../hooks/useMultiplayer';
import { formatTime } from '../../utils/session';
import { playGameOverSound } from '../../utils/sound';
import { Button } from '../ui/Button';
import { ProgressBar } from '../ui/ProgressBar';

interface MultiplayerPodiumProps {
  players: Player[];
  currentUserId?: string;
  isHost?: boolean;
  onRematch?: () => void;
  onBackToLobby: () => void;
  className?: string;
}

interface ConfettiParticle {
  x: number;
  y: number;
  w: number;
  h: number;
  vx: number;
  vy: number;
  rot: number;
  rotSpeed: number;
  color: string;
  alpha: number;
}

const CONFETTI_COLORS = [
  '#F59E0B', // Amber
  '#3B82F6', // Blue
  '#10B981', // Emerald
  '#EC4899', // Pink
  '#8B5CF6', // Purple
  '#06B6D4', // Cyan
  '#EAB308', // Yellow
];

export const MultiplayerPodium: React.FC<MultiplayerPodiumProps> = ({
  players,
  currentUserId,
  isHost = false,
  onRematch,
  onBackToLobby,
  className = '',
}) => {
  const { t } = useTranslation();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const announcedFinishedIdsRef = useRef<Set<string>>(new Set());

  // 1. Finished players sorted strictly by finish order:
  // - First: finished timestamp (who crossed the line first)
  // - Second: total elapsed time
  // - Third: accuracy
  const finishedPlayers = useMemo(() => {
    return players
      .filter((p) => p.progress >= 100 || p.finishedAt !== undefined)
      .sort((a, b) => {
        if (a.finishedAt && b.finishedAt && a.finishedAt !== b.finishedAt) {
          return a.finishedAt - b.finishedAt;
        }
        const aTime = a.timeSeconds ?? Infinity;
        const bTime = b.timeSeconds ?? Infinity;
        if (aTime !== bTime) {
          return aTime - bTime;
        }
        const aAcc = a.accuracy ?? 0;
        const bAcc = b.accuracy ?? 0;
        if (aAcc !== bAcc) {
          return bAcc - aAcc;
        }
        return 0;
      });
  }, [players]);

  // 2. Racing players: actively answering questions (progress < 100, not DNF)
  const racingPlayers = useMemo(() => {
    return players
      .filter((p) => p.progress < 100 && !p.finishedAt && !p.isDNF && p.status !== 'disconnected')
      .sort((a, b) => b.progress - a.progress);
  }, [players]);

  // 3. Disconnected / DNF players
  const dnfPlayers = useMemo(() => {
    return players.filter(
      (p) => (p.isDNF || p.status === 'disconnected') && p.progress < 100 && !p.finishedAt
    );
  }, [players]);

  const winner = finishedPlayers[0];
  const second = finishedPlayers[1];
  const third = finishedPlayers[2];
  const others = finishedPlayers.slice(3);

  const totalPlayersCount = players.length;
  const hasMultipleSlots = totalPlayersCount >= 2;
  const hasThreeSlots = totalPlayersCount >= 3;

  const myRank = finishedPlayers.findIndex((p) => p.userId === currentUserId) + 1;
  const isMeWinner = winner && winner.userId === currentUserId;

  // Play fanfare / finish audio
  useEffect(() => {
    playGameOverSound(Boolean(isMeWinner));
  }, [isMeWinner]);

  // Realtime notification when other players cross the finish line
  useEffect(() => {
    finishedPlayers.forEach((p) => {
      if (!announcedFinishedIdsRef.current.has(p.userId)) {
        announcedFinishedIdsRef.current.add(p.userId);
        if (p.userId !== currentUserId) {
          const rank = finishedPlayers.findIndex((fp) => fp.userId === p.userId) + 1;
          const defaultName = t('multiplayer.podium.player', 'Gracz');
          toast.info(t('multiplayer.podium.playerFinished', '🏁 {{username}} ukończył wyścig na {{rank}}. miejscu!', { username: p.username || defaultName, rank }));
        }
      }
    });
  }, [finishedPlayers, currentUserId, t]);

  // Canvas Confetti
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let width = (canvas.width = canvas.parentElement?.clientWidth || window.innerWidth);
    let height = (canvas.height = canvas.parentElement?.clientHeight || 450);

    const particles: ConfettiParticle[] = [];
    const count = 75;

    for (let i = 0; i < count; i++) {
      particles.push({
        x: width * 0.5 + (Math.random() - 0.5) * 160,
        y: height * 0.35 + (Math.random() - 0.5) * 60,
        w: 6 + Math.random() * 6,
        h: 4 + Math.random() * 5,
        vx: (Math.random() - 0.5) * 9,
        vy: -4 - Math.random() * 7,
        rot: Math.random() * 360,
        rotSpeed: (Math.random() - 0.5) * 12,
        color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
        alpha: 1,
      });
    }

    let startTime = Date.now();
    const duration = 3500;

    const render = () => {
      const elapsed = Date.now() - startTime;
      if (elapsed > duration) {
        ctx.clearRect(0, 0, width, height);
        return;
      }

      ctx.clearRect(0, 0, width, height);

      const fade = Math.max(0, 1 - (elapsed - 2000) / 1500);

      for (let p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.19; // gravity
        p.vx *= 0.985; // air drag
        p.rot += p.rotSpeed;

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rot * Math.PI) / 180);
        ctx.globalAlpha = p.alpha * fade;
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        ctx.restore();
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    const handleResize = () => {
      if (!canvas.parentElement) return;
      width = canvas.width = canvas.parentElement.clientWidth;
      height = canvas.height = canvas.parentElement.clientHeight;
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <div
      className={`relative w-full max-w-3xl mx-auto rounded-3xl p-6 sm:p-8 backdrop-blur-2xl bg-white/80 dark:bg-zinc-900/80 border border-zinc-200/80 dark:border-zinc-800/80 shadow-2xl overflow-hidden ${className}`}
    >
      {/* Confetti canvas overlay */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 pointer-events-none z-30 w-full h-full"
      />

      {/* Header */}
      <div className="relative z-10 text-center mb-8">
        <motion.div
          initial={{ scale: 0.8, opacity: 0, y: -10 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          transition={{ type: 'spring', damping: 20, stiffness: 300 }}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 text-xs font-semibold uppercase tracking-wider mb-3"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>{t('multiplayer.podium.finalBadge', 'Finał wyścigu wieloosobowego')}</span>
        </motion.div>
        <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50">
          {t('multiplayer.podium.title', 'Podium Wyścigu')}
        </h2>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
          {isMeWinner
            ? t('multiplayer.podium.winnerYou', '🏆 Gratulacje! Wygrałeś wyścig!')
            : myRank > 0
            ? t('multiplayer.podium.rankYou', 'Ukończyłeś rywalizację na {{rank}}. miejscu!', { rank: myRank })
            : t('multiplayer.podium.goodFight', 'Znakomita walka do samego końca!')}
        </p>
        {racingPlayers.length > 0 && (
          <p className="text-xs text-amber-600 dark:text-amber-400 font-medium mt-1 flex items-center justify-center gap-1.5">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
            </span>
            {t('multiplayer.podium.ongoingBattle', 'Trwa rywalizacja o kolejne miejsca na podium...')}
          </p>
        )}
      </div>

      {/* 3-Tier Dynamic Podium */}
      <div className="relative z-10 flex items-end justify-center gap-3 sm:gap-6 pt-12 pb-6 min-h-[300px]">
        {/* 2nd Place (Left) */}
        {hasMultipleSlots && (
          <div className="flex-1 max-w-[170px] flex flex-col items-center">
            <AnimatePresence mode="wait">
              {second ? (
                <motion.div
                  key={second.userId}
                  initial={{ opacity: 0, y: 40, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ type: 'spring', damping: 20, stiffness: 220 }}
                  className="relative mb-3 flex flex-col items-center text-center w-full"
                >
                  <div className="relative">
                    <img
                      src={second.avatarUrl}
                      alt={second.username}
                      className="w-14 h-14 sm:w-16 sm:h-16 rounded-full object-cover border-2 border-slate-300 dark:border-slate-500 shadow-lg ring-4 ring-slate-200/50 dark:ring-slate-700/50"
                    />
                    <span className="absolute -bottom-2 -right-1 text-xl drop-shadow">🥈</span>
                  </div>
                  <span className="mt-2 text-xs sm:text-sm font-bold text-zinc-800 dark:text-zinc-200 truncate max-w-[120px]">
                    {second.username}
                    {second.userId === currentUserId && ` ${t('multiplayer.podium.youTag', '(Ty)')}`}
                  </span>
                  <div className="flex items-center gap-1.5 text-[11px] text-zinc-500 dark:text-zinc-400 font-medium">
                    {second.accuracy !== undefined && <span>{second.accuracy}%</span>}
                    {second.timeSeconds !== undefined && (
                      <>
                        <span>•</span>
                        <span>{formatTime(second.timeSeconds)}</span>
                      </>
                    )}
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="waiting-second"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="relative mb-3 flex flex-col items-center text-center w-full"
                >
                  <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full border-2 border-dashed border-slate-300 dark:border-slate-700 bg-slate-100/50 dark:bg-slate-850/40 flex items-center justify-center text-slate-400 dark:text-slate-500 shadow-inner">
                    <Loader2 className="w-5 h-5 animate-spin" />
                  </div>
                  <span className="mt-2 text-xs sm:text-sm font-semibold text-zinc-400 dark:text-zinc-500">
                    {t('multiplayer.podium.waiting', 'Oczekiwanie...')}
                  </span>
                  <span className="text-[10px] text-zinc-400/80 dark:text-zinc-600 font-medium">
                    {t('multiplayer.podium.battleForSecond', 'Walka o 2. miejsce')}
                  </span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Pedestal */}
            <div
              className={`w-full h-32 sm:h-38 rounded-t-2xl bg-gradient-to-b from-slate-200/90 to-slate-100/40 dark:from-slate-800/80 dark:to-slate-900/40 border border-slate-300/80 dark:border-slate-700/80 border-b-0 flex flex-col items-center justify-start pt-3 shadow-md transition-opacity duration-300 ${
                second ? 'opacity-100' : 'opacity-60 border-dashed'
              }`}
            >
              <span className="text-3xl font-black text-slate-400 dark:text-slate-500">2</span>
              <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-500 dark:text-slate-400">
                {t('multiplayer.podium.secondPlace', '2. Miejsce')}
              </span>
            </div>
          </div>
        )}

        {/* 1st Place (Center, Tallest) */}
        {winner && (
          <motion.div
            initial={{ opacity: 0, y: 70 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', damping: 20, stiffness: 240, delay: 0.1 }}
            className="flex-1 max-w-[200px] flex flex-col items-center -mt-6"
          >
            {/* Crown & Avatar */}
            <div className="relative mb-3 flex flex-col items-center text-center">
              <motion.div
                animate={{ y: [0, -4, 0] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                className="text-3xl mb-1"
              >
                👑
              </motion.div>
              <div className="relative">
                <img
                  src={winner.avatarUrl}
                  alt={winner.username}
                  className="w-18 h-18 sm:w-20 sm:h-20 rounded-full object-cover border-4 border-amber-400 dark:border-amber-400 shadow-xl ring-4 ring-amber-300/40 dark:ring-amber-500/20"
                />
                <span className="absolute -bottom-2 -right-1 text-2xl drop-shadow">🥇</span>
              </div>
              <span className="mt-2 text-sm sm:text-base font-extrabold text-zinc-900 dark:text-zinc-50 truncate max-w-[150px]">
                {winner.username}
                {winner.userId === currentUserId && ` ${t('multiplayer.podium.youTag', '(Ty)')}`}
              </span>
              <div className="flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400 font-semibold">
                {winner.accuracy !== undefined && <span>{t('multiplayer.podium.accuracy', '{{val}}% celności', { val: winner.accuracy })}</span>}
                {winner.timeSeconds !== undefined && (
                  <>
                    <span>•</span>
                    <span className="font-mono">{formatTime(winner.timeSeconds)}</span>
                  </>
                )}
              </div>
            </div>

            {/* Pedestal */}
            <div className="w-full h-44 sm:h-52 rounded-t-2xl bg-gradient-to-b from-amber-400/25 via-amber-300/10 to-transparent dark:from-amber-500/20 dark:via-amber-500/5 dark:to-transparent border border-amber-400/80 dark:border-amber-500/60 border-b-0 flex flex-col items-center justify-start pt-4 shadow-xl relative overflow-hidden ring-1 ring-amber-400/20">
              <div className="absolute inset-0 bg-gradient-to-t from-amber-400/5 to-transparent pointer-events-none" />
              <span className="text-4xl sm:text-5xl font-black text-amber-500 dark:text-amber-400">1</span>
              <span className="text-[11px] uppercase tracking-widest font-extrabold text-amber-600 dark:text-amber-400">
                {t('multiplayer.podium.winner', 'Zwycięzca')}
              </span>
            </div>
          </motion.div>
        )}

        {/* 3rd Place (Right) */}
        {hasThreeSlots && (
          <div className="flex-1 max-w-[170px] flex flex-col items-center">
            <AnimatePresence mode="wait">
              {third ? (
                <motion.div
                  key={third.userId}
                  initial={{ opacity: 0, y: 40, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ type: 'spring', damping: 20, stiffness: 220 }}
                  className="relative mb-3 flex flex-col items-center text-center w-full"
                >
                  <div className="relative">
                    <img
                      src={third.avatarUrl}
                      alt={third.username}
                      className="w-14 h-14 sm:w-16 sm:h-16 rounded-full object-cover border-2 border-amber-700 dark:border-amber-600 shadow-lg ring-4 ring-amber-700/20 dark:ring-amber-700/30"
                    />
                    <span className="absolute -bottom-2 -right-1 text-xl drop-shadow">🥉</span>
                  </div>
                  <span className="mt-2 text-xs sm:text-sm font-bold text-zinc-800 dark:text-zinc-200 truncate max-w-[120px]">
                    {third.username}
                    {third.userId === currentUserId && ` ${t('multiplayer.podium.youTag', '(Ty)')}`}
                  </span>
                  <div className="flex items-center gap-1.5 text-[11px] text-zinc-500 dark:text-zinc-400 font-medium">
                    {third.accuracy !== undefined && <span>{third.accuracy}%</span>}
                    {third.timeSeconds !== undefined && (
                      <>
                        <span>•</span>
                        <span>{formatTime(third.timeSeconds)}</span>
                      </>
                    )}
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="waiting-third"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="relative mb-3 flex flex-col items-center text-center w-full"
                >
                  <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full border-2 border-dashed border-amber-700/40 dark:border-amber-700/50 bg-amber-950/10 flex items-center justify-center text-amber-700/50 dark:text-amber-600 shadow-inner">
                    <Loader2 className="w-5 h-5 animate-spin" />
                  </div>
                  <span className="mt-2 text-xs sm:text-sm font-semibold text-zinc-400 dark:text-zinc-500">
                    {t('multiplayer.podium.waiting', 'Oczekiwanie...')}
                  </span>
                  <span className="text-[10px] text-zinc-400/80 dark:text-zinc-600 font-medium">
                    {t('multiplayer.podium.battleForThird', 'Walka o 3. miejsce')}
                  </span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Pedestal */}
            <div
              className={`w-full h-24 sm:h-28 rounded-t-2xl bg-gradient-to-b from-amber-700/20 to-amber-800/5 dark:from-amber-700/25 dark:to-zinc-900/40 border border-amber-700/50 dark:border-amber-700/50 border-b-0 flex flex-col items-center justify-start pt-3 shadow-sm transition-opacity duration-300 ${
                third ? 'opacity-100' : 'opacity-60 border-dashed'
              }`}
            >
              <span className="text-3xl font-black text-amber-700 dark:text-amber-600">3</span>
              <span className="text-[10px] uppercase tracking-wider font-semibold text-amber-700 dark:text-amber-500">
                {t('multiplayer.podium.thirdPlace', '3. Miejsce')}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Live "W trakcie wyścigu" Section */}
      {racingPlayers.length > 0 && (
        <div className="relative z-10 mt-6 pt-4 border-t border-zinc-200/80 dark:border-zinc-800/80">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
              </span>
              {t('multiplayer.podium.inRaceTitle', 'W trakcie wyścigu ({{count}})', { count: racingPlayers.length })}
            </h3>
            <span className="text-[11px] text-zinc-400 dark:text-zinc-500 font-medium">
              {t('multiplayer.podium.liveProgress', 'Postęp na żywo')}
            </span>
          </div>

          <div className="space-y-2">
            <AnimatePresence>
              {racingPlayers.map((p) => {
                const isMe = p.userId === currentUserId;
                return (
                  <motion.div
                    key={p.userId}
                    layout
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="flex items-center justify-between px-4 py-2.5 rounded-xl border bg-zinc-50/70 dark:bg-zinc-800/40 border-zinc-200/60 dark:border-zinc-700/50"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <img
                        src={p.avatarUrl}
                        alt={p.username}
                        className="w-8 h-8 rounded-full border border-zinc-200 dark:border-zinc-700 object-cover"
                      />
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate flex items-center gap-1.5">
                          <span>{p.username}</span>
                          {isMe && <span className="text-xs text-primary-500 font-bold">{t('multiplayer.podium.youTag', '(Ty)')}</span>}
                        </div>
                        <div className="text-[11px] text-zinc-400">
                          {t('multiplayer.podium.onTrack', 'Na trasie wyścigu...')}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 w-40 sm:w-56">
                      <div className="flex-1">
                        <ProgressBar value={p.progress} color="blue" size="sm" />
                      </div>
                      <span className="font-mono text-xs font-bold text-zinc-700 dark:text-zinc-300 w-10 text-right tabular-nums">
                        {Math.round(p.progress)}%
                      </span>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* Everyone finished banner */}
      {racingPlayers.length === 0 && finishedPlayers.length > 1 && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative z-10 mt-6 py-2 px-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-xs font-semibold text-center flex items-center justify-center gap-2"
        >
          <span>🏁</span>
          <span>{t('multiplayer.podium.allFinished', 'Wszyscy uczestnicy ukończyli wyścig!')}</span>
        </motion.div>
      )}

      {/* Finished Other Players (4th and beyond) */}
      {others.length > 0 && (
        <div className="relative z-10 mt-6 pt-4 border-t border-zinc-200 dark:border-zinc-800">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 mb-3 text-center">
            {t('multiplayer.podium.othersTitle', 'Pozostali uczestnicy którzy ukończyli wyścig')}
          </h3>
          <div className="space-y-2">
            {others.map((p, idx) => {
              const rank = idx + 4;
              const isMe = p.userId === currentUserId;
              return (
                <div
                  key={p.userId}
                  className={`flex items-center justify-between px-4 py-2.5 rounded-xl border transition-colors ${
                    isMe
                      ? 'bg-primary-50/50 dark:bg-primary-950/20 border-primary-200 dark:border-primary-800/50'
                      : 'bg-zinc-50/60 dark:bg-zinc-800/40 border-zinc-200/60 dark:border-zinc-700/50'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="w-5 text-center text-xs font-bold text-zinc-400 font-mono">
                      #{rank}
                    </span>
                    <img
                      src={p.avatarUrl}
                      alt={p.username}
                      className="w-8 h-8 rounded-full border border-zinc-200 dark:border-zinc-700 object-cover"
                    />
                    <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate">
                      {p.username}
                      {isMe && ` ${t('multiplayer.podium.youTag', '(Ty)')}`}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-xs text-zinc-500 dark:text-zinc-400 flex-shrink-0">
                    {p.accuracy !== undefined && (
                      <span className="font-semibold text-zinc-700 dark:text-zinc-300">
                        {t('multiplayer.podium.accuracy', '{{val}}% celności', { val: p.accuracy })}
                      </span>
                    )}
                    {p.timeSeconds !== undefined && (
                      <span className="font-mono text-zinc-600 dark:text-zinc-400">
                        {formatTime(p.timeSeconds)}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Disconnected / DNF Players */}
      {dnfPlayers.length > 0 && (
        <div className="relative z-10 mt-4 pt-3 border-t border-zinc-200/60 dark:border-zinc-800/60">
          <h4 className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 mb-2 text-center">
            {t('multiplayer.podium.dnfTitle', 'Nie ukończyli (Rozłączeni / DNF)')}
          </h4>
          <div className="space-y-1.5 opacity-60">
            {dnfPlayers.map((p) => (
              <div
                key={p.userId}
                className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-zinc-100/50 dark:bg-zinc-800/30 text-xs text-zinc-500"
              >
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-red-500">DNF</span>
                  <span className="truncate">{p.username}</span>
                </div>
                <span>{Math.round(p.progress)}%</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action Controls */}
      <div className="relative z-10 flex flex-col sm:flex-row gap-3 mt-8 pt-4 border-t border-zinc-200/80 dark:border-zinc-800/80">
        {onRematch && (
          <Button
            variant="primary"
            size="lg"
            className="flex-1 py-3.5 rounded-xl shadow-lg shadow-primary-500/20 flex items-center justify-center gap-2"
            onClick={onRematch}
          >
            <RotateCcw className="w-4 h-4" />
            <span>{isHost ? t('multiplayer.podium.rematchHost', 'Rozpocznij rewanż') : t('multiplayer.podium.rematchGuest', 'Zagraj rewanż')}</span>
          </Button>
        )}
        <Button
          variant={onRematch ? 'secondary' : 'primary'}
          size="lg"
          className="flex-1 py-3.5 rounded-xl flex items-center justify-center gap-2"
          onClick={onBackToLobby}
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{t('multiplayer.podium.backToLobby', 'Wróć do lobby')}</span>
        </Button>
      </div>
    </div>
  );
};
