import { FC, useState, useEffect, useMemo, useRef } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import {
  Cards,
  PokerChip,
  Coins,
  Trophy,
  Clock,
  CheckCircle,
  XCircle,
  Sparkle,
  Flame,
  ArrowRight,
  ArrowsClockwise,
  SignOut,
  EyeSlash,
  Medal,
} from '@phosphor-icons/react';
import { SessionState, Question } from '../../models/types';
import { useMultiplayerContext } from '../../contexts/MultiplayerContext';
import { QuestionRenderer } from '../QuestionRenderer';
import { MarkdownRenderer } from '../MarkdownRenderer';
import { Button } from '../ui/Button';
import { playCorrectSound, playWrongSound } from '../../utils/sound';
import { cn } from '../../utils/cn';

interface PokerWagerViewProps {
  session: SessionState;
  onQuit: () => void;
}

const ANSWER_KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];

export const PokerWagerView: FC<PokerWagerViewProps> = ({ session, onQuit }) => {
  const { t } = useTranslation();
  const {
    pokerState,
    submitPokerWager,
    submitPokerAnswer,
    players,
    isHost,
    triggerRematch,
    profile,
  } = useMultiplayerContext();

  const myId = profile?.id;
  const myChips = myId ? (pokerState.chips[myId] ?? 1000) : 1000;
  const hasWagered = Boolean(myId && pokerState.wagers[myId] !== undefined);
  const myWager = (myId && pokerState.wagers[myId]) ?? 0;

  const [selectedWager, setSelectedWager] = useState<number>(() => Math.min(100, Math.max(10, myChips)));
  const [selectedAnswerIndices, setSelectedAnswerIndices] = useState<number[]>([]);
  const [hasSubmittedLocalAnswer, setHasSubmittedLocalAnswer] = useState(false);
  const soundPlayedRoundRef = useRef<number>(-1);

  // Current question based on synchronized questionIndex
  const currentQuestion: Question | undefined = useMemo(() => {
    if (!session.questions || session.questions.length === 0) return undefined;
    return session.questions[pokerState.questionIndex % session.questions.length];
  }, [session.questions, pokerState.questionIndex]);

  const isMultiAnswer = useMemo(() => {
    if (!currentQuestion) return false;
    return currentQuestion.correctAnswerIndices.length > 1;
  }, [currentQuestion]);

  // Reset local inputs upon entering a new round / wager phase
  useEffect(() => {
    if (pokerState.phase === 'wager') {
      setSelectedAnswerIndices([]);
      setHasSubmittedLocalAnswer(false);
      setSelectedWager(prev => Math.min(Math.max(10, prev), Math.max(10, myChips)));
    }
  }, [pokerState.currentRound, pokerState.phase, myChips]);

  // Audio feedback on showdown
  useEffect(() => {
    if (pokerState.phase === 'showdown' && soundPlayedRoundRef.current !== pokerState.currentRound) {
      soundPlayedRoundRef.current = pokerState.currentRound;
      const myResult = myId ? pokerState.roundResults?.[myId] : null;
      if (myResult) {
        if (myResult.isCorrect) {
          playCorrectSound();
        } else {
          playWrongSound();
        }
      }
    }
  }, [pokerState.phase, pokerState.currentRound, pokerState.roundResults, myId]);

  const handleToggleAnswer = (idx: number) => {
    if (hasSubmittedLocalAnswer || pokerState.phase !== 'answering') return;
    if (isMultiAnswer) {
      setSelectedAnswerIndices(prev =>
        prev.includes(idx) ? prev.filter(i => i !== idx) : [...prev, idx]
      );
    } else {
      setSelectedAnswerIndices([idx]);
    }
  };

  const handleConfirmWager = () => {
    if (hasWagered || pokerState.phase !== 'wager') return;
    const clamped = Math.max(10, Math.min(selectedWager, Math.max(10, myChips)));
    submitPokerWager(clamped);
  };

  const handleConfirmAnswer = () => {
    if (hasSubmittedLocalAnswer || pokerState.phase !== 'answering' || !currentQuestion) return;
    setHasSubmittedLocalAnswer(true);

    const isCorrect = currentQuestion.answers.every((ans, idx) =>
      ans.isCorrect === selectedAnswerIndices.includes(idx)
    );

    submitPokerAnswer(selectedAnswerIndices, isCorrect);
  };

  // Rank players by chip balance for Podium / Leaderboard
  const rankedPlayers = useMemo(() => {
    const list = [...players];
    list.sort((a, b) => {
      const chipsA = pokerState.chips[a.userId] ?? 1000;
      const chipsB = pokerState.chips[b.userId] ?? 1000;
      return chipsB - chipsA;
    });
    return list;
  }, [players, pokerState.chips]);

  const quickBets = [50, 100, 250, 500];

  return (
    <div className="flex-1 w-full max-w-5xl mx-auto px-4 py-4 sm:py-6 flex flex-col space-y-6">
      {/* Top Bar: Round info, Phase badge, Timer, Chips & Exit */}
      <header className="relative overflow-hidden flex flex-wrap items-center justify-between gap-4 p-4 sm:p-5 rounded-3xl bg-white/90 dark:bg-zinc-900/90 backdrop-blur-xl border border-black/[0.06] dark:border-white/[0.08] shadow-xs">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-400/25 to-transparent pointer-events-none" />
        
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold shadow-inner">
            <Cards className="w-6 h-6" weight="duotone" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-base sm:text-lg text-zinc-900 dark:text-zinc-50 tracking-tight">
                {t('multiplayer.poker.round', { current: pokerState.currentRound, total: pokerState.totalRounds })}
              </span>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/20">
                {pokerState.phase === 'wager' && t('multiplayer.poker.phaseWager')}
                {pokerState.phase === 'answering' && t('multiplayer.poker.phaseAnswering')}
                {pokerState.phase === 'showdown' && t('multiplayer.poker.phaseShowdown')}
                {pokerState.phase === 'ended' && t('multiplayer.poker.phaseEnded')}
              </span>
            </div>
            <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5 font-medium">
              {session.baseName}
            </p>
          </div>
        </div>

        {/* Center: Live Timer */}
        {pokerState.phase !== 'ended' && (
          <div className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-2xl border transition-colors shadow-inner",
            pokerState.timeLeftSeconds <= 3
              ? "bg-rose-500/10 border-rose-500/30 dark:bg-rose-950/25 dark:border-rose-800/40"
              : "bg-zinc-100/80 dark:bg-zinc-800/80 border-black/[0.06] dark:border-white/[0.08]"
          )}>
            <Clock
              className={cn(
                "w-5 h-5 transition-colors",
                pokerState.timeLeftSeconds <= 3 ? "text-rose-500 animate-pulse" : "text-amber-500"
              )}
              weight="duotone"
            />
            <span className={cn(
              "font-mono font-black text-xl tabular-nums",
              pokerState.timeLeftSeconds <= 3 ? "text-rose-600 dark:text-rose-400" : "text-zinc-800 dark:text-zinc-100"
            )}>
              {pokerState.timeLeftSeconds}s
            </span>
          </div>
        )}

        {/* Right: Chip balance & Quit */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 px-3.5 sm:px-4 py-2 rounded-2xl shadow-xs">
            <PokerChip className="w-5 h-5 text-amber-600 dark:text-amber-400" weight="fill" />
            <span className="font-mono font-bold text-amber-800 dark:text-amber-300 tabular-nums text-sm sm:text-base">
              {myChips.toLocaleString()} {t('multiplayer.poker.chips')}
            </span>
          </div>

          <button
            onClick={onQuit}
            className="p-2.5 rounded-2xl text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all active:scale-[0.92] cursor-pointer"
            title={t('common.exit', 'Wyjdź')}
          >
            <SignOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Opponents & Players Strip */}
      <section className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {rankedPlayers.map((player) => {
          const chips = pokerState.chips[player.userId] ?? 1000;
          const isMe = player.userId === myId;
          const hasPlayerWagered = pokerState.wagers[player.userId] !== undefined;
          const playerWagerVal = pokerState.wagers[player.userId] ?? 0;
          const hasPlayerAnswered = pokerState.answers[player.userId] !== undefined;
          const roundRes = pokerState.roundResults?.[player.userId];

          return (
            <div
              key={player.userId}
              className={cn(
                "p-3 rounded-2xl border transition-all flex flex-col justify-between relative overflow-hidden backdrop-blur-md",
                isMe
                  ? "border-amber-500/50 bg-amber-500/5 shadow-xs"
                  : "border-black/[0.06] dark:border-white/[0.08] bg-white/80 dark:bg-zinc-900/80"
              )}
            >
              <div className="flex items-center gap-2.5">
                {player.avatarUrl ? (
                  <img
                    src={player.avatarUrl}
                    alt={player.username}
                    className="w-9 h-9 rounded-full object-cover border border-black/[0.08] dark:border-white/[0.08]"
                  />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center font-bold text-sm text-zinc-600 dark:text-zinc-300">
                    {(player.username || 'G').charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1">
                    <span className="font-semibold text-xs sm:text-sm text-zinc-900 dark:text-zinc-100 truncate">
                      {player.username}
                    </span>
                    {isMe && (
                      <span className="text-[10px] text-amber-600 dark:text-amber-400 font-bold">({t('multiplayer.podium.youTag', 'Ty')})</span>
                    )}
                  </div>
                  <span className="font-mono text-xs text-amber-600 dark:text-amber-400 font-bold tabular-nums flex items-center gap-1">
                    <Coins className="w-3 h-3" weight="fill" />
                    {chips.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Status Indicator inside card */}
              <div className="mt-2.5 pt-2 border-t border-black/[0.04] dark:border-white/[0.06] text-[11px] font-medium">
                {pokerState.phase === 'wager' && (
                  hasPlayerWagered ? (
                    <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-semibold">
                      <CheckCircle className="w-3.5 h-3.5" weight="fill" />
                      {t('multiplayer.poker.opponentWagered')}
                    </span>
                  ) : (
                    <span className="text-zinc-400 dark:text-zinc-500 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 animate-spin" />
                      {t('multiplayer.poker.opponentWagering')}
                    </span>
                  )
                )}

                {pokerState.phase === 'answering' && (
                  hasPlayerAnswered ? (
                    <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-semibold">
                      <CheckCircle className="w-3.5 h-3.5" weight="fill" />
                      {t('multiplayer.poker.opponentAnswered')}
                    </span>
                  ) : (
                    <span className="text-zinc-400 dark:text-zinc-500 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 animate-spin" />
                      {t('multiplayer.poker.opponentAnswering')}
                    </span>
                  )
                )}

                {pokerState.phase === 'showdown' && roundRes && (
                  <span className={cn(
                    "font-bold font-mono tabular-nums flex items-center gap-1 text-xs",
                    roundRes.isCorrect ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
                  )}>
                    <Coins className="w-3 h-3" weight="fill" />
                    <span>{roundRes.isCorrect ? `+${playerWagerVal}` : `-${playerWagerVal}`}</span>
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </section>

      {/* Main Content Area */}
      {pokerState.phase === 'ended' ? (
        /* Final Podium Screen */
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', bounce: 0.12, duration: 0.45 }}
          className="relative overflow-hidden bg-white/90 dark:bg-zinc-900/90 backdrop-blur-xl border border-black/[0.06] dark:border-white/[0.08] rounded-3xl p-6 sm:p-10 text-center shadow-lg"
        >
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-400/30 to-transparent pointer-events-none" />
          
          <div className="w-20 h-20 rounded-3xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto mb-6 shadow-inner">
            <Trophy className="w-10 h-10" weight="duotone" />
          </div>

          <h2 className="text-2xl sm:text-4xl font-extrabold text-zinc-900 dark:text-white tracking-tight mb-2">
            {t('multiplayer.poker.podiumTitle')}
          </h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-md mx-auto mb-8">
            {t('multiplayer.poker.champion')}:{' '}
            <strong className="text-zinc-900 dark:text-zinc-100 font-bold">
              {rankedPlayers[0]?.username || 'Gracz'}
            </strong>
          </p>

          {/* Podium ranking cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl mx-auto mb-10">
            {rankedPlayers.slice(0, 3).map((player, idx) => {
              const chips = pokerState.chips[player.userId] ?? 1000;
              const isFirst = idx === 0;

              return (
                <div
                  key={player.userId}
                  className={cn(
                    "p-5 rounded-3xl border flex flex-col items-center text-center relative backdrop-blur-md transition-transform",
                    isFirst
                      ? "border-amber-400/60 bg-amber-500/10 dark:bg-amber-950/30 shadow-md sm:-translate-y-2 order-1 sm:order-2"
                      : idx === 1
                      ? "border-black/[0.08] dark:border-white/[0.08] bg-white/80 dark:bg-zinc-850/80 order-2 sm:order-1"
                      : "border-amber-700/20 bg-white/80 dark:bg-zinc-850/80 order-3 sm:order-3"
                  )}
                >
                  <div className={cn(
                    "absolute -top-3.5 px-3 py-0.5 rounded-full text-xs font-bold tracking-wide flex items-center gap-1 shadow-xs",
                    idx === 0
                      ? "bg-amber-500 text-white dark:bg-amber-400 dark:text-amber-950"
                      : "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900"
                  )}>
                    <Medal
                      className={cn(
                        "w-3.5 h-3.5",
                        idx === 0 ? "text-amber-100 dark:text-amber-950" : idx === 1 ? "text-zinc-300 dark:text-zinc-600" : "text-amber-600"
                      )}
                      weight="fill"
                    />
                    <span>{idx === 0 ? '1. Miejsce' : idx === 1 ? '2. Miejsce' : '3. Miejsce'}</span>
                  </div>

                  <div className="mt-2 mb-3">
                    {player.avatarUrl ? (
                      <img src={player.avatarUrl} alt={player.username} className="w-14 h-14 rounded-full object-cover border-2 border-amber-500/50 shadow-xs" />
                    ) : (
                      <div className="w-14 h-14 rounded-full bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center font-black text-lg text-zinc-700 dark:text-zinc-200">
                        {(player.username || 'G').charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>

                  <h3 className="font-bold text-base text-zinc-900 dark:text-zinc-50 truncate max-w-full">
                    {player.username}
                  </h3>
                  <p className="font-mono font-bold text-lg text-amber-700 dark:text-amber-400 mt-1 tabular-nums flex items-center gap-1">
                    <Coins className="w-4 h-4" weight="fill" />
                    <span>{chips.toLocaleString()}</span>
                  </p>
                </div>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4">
            {isHost && (
              <Button
                variant="primary"
                onClick={triggerRematch}
                className="px-6 py-3 rounded-2xl font-bold flex items-center gap-2 shadow-lg shadow-primary-600/20 active:scale-[0.97]"
              >
                <ArrowsClockwise className="w-5 h-5" />
                <span>{t('multiplayer.poker.rematchBtn')}</span>
              </Button>
            )}
            <Button
              variant="secondary"
              onClick={onQuit}
              className="px-6 py-3 rounded-2xl font-bold active:scale-[0.97]"
            >
              {t('multiplayer.poker.exitBtn')}
            </Button>
          </div>
        </motion.div>
      ) : (
        /* Active Round Card */
        <div className="relative overflow-hidden bg-white/90 dark:bg-zinc-900/90 backdrop-blur-xl border border-black/[0.06] dark:border-white/[0.08] rounded-3xl p-5 sm:p-8 shadow-xs flex flex-col space-y-6">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-400/20 to-transparent pointer-events-none" />

          {/* Question Text */}
          {currentQuestion && (
            <div className="border-b border-black/[0.04] dark:border-white/[0.06] pb-6">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 mb-2">
                <Sparkle className="w-4 h-4 text-amber-500" />
                <span>{isMultiAnswer ? t('test.multipleCorrect', 'Wiele poprawnych odpowiedzi') : t('test.singleCorrect', 'Jedna poprawna odpowiedź')}</span>
              </div>

              <div className="text-base sm:text-xl font-medium text-zinc-900 dark:text-zinc-100 leading-relaxed">
                <QuestionRenderer
                  text={currentQuestion.text}
                  sourceFile={currentQuestion.sourceFile}
                />
              </div>
            </div>
          )}

          {/* Phase 1: Blind Wager View */}
          {pokerState.phase === 'wager' && (
            <div className="space-y-6">
              {/* Refined Frosted Blind Mask Card */}
              <div className="relative overflow-hidden rounded-3xl border border-amber-500/25 bg-gradient-to-b from-amber-500/10 via-amber-500/5 to-transparent dark:from-amber-500/15 dark:via-amber-500/5 p-6 sm:p-8 text-center backdrop-blur-md shadow-xs">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto mb-3 shadow-inner">
                  <EyeSlash className="w-6 h-6" weight="duotone" />
                </div>
                <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
                  {t('multiplayer.poker.blindWagerTitle')}
                </h3>
                <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 max-w-md mx-auto mt-1.5 leading-relaxed">
                  {t('multiplayer.poker.blindWagerDesc')}
                </p>
              </div>

              {/* Wager Selection Controls */}
              {hasWagered ? (
                <div className="p-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-center space-y-2">
                  <CheckCircle className="w-8 h-8 text-emerald-500 mx-auto" weight="fill" />
                  <div className="font-extrabold text-lg text-emerald-800 dark:text-emerald-200">
                    {t('multiplayer.poker.yourWager', { amount: myWager })}
                  </div>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    {t('multiplayer.poker.wagerConfirmed')}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center justify-center gap-2.5">
                    {quickBets.map((amount) => {
                      const disabled = amount > myChips;
                      return (
                        <button
                          key={amount}
                          disabled={disabled}
                          onClick={() => setSelectedWager(amount)}
                          className={cn(
                            "px-4 py-2.5 rounded-2xl font-mono font-bold text-sm border transition-all cursor-pointer flex items-center gap-1.5 active:scale-[0.96]",
                            selectedWager === amount
                              ? "border-amber-500 bg-amber-500 text-white shadow-md shadow-amber-500/20"
                              : "border-black/[0.08] dark:border-white/[0.08] hover:border-amber-400 text-zinc-800 dark:text-zinc-200 bg-zinc-50 dark:bg-zinc-800/60",
                            disabled && "opacity-40 cursor-not-allowed active:scale-100"
                          )}
                        >
                          <Coins className="w-3.5 h-3.5 opacity-80" weight="fill" />
                          <span className="tabular-nums">+{amount}</span>
                        </button>
                      );
                    })}

                    <button
                      onClick={() => setSelectedWager(myChips)}
                      className={cn(
                        "px-4 py-2.5 rounded-2xl font-bold text-sm border transition-all cursor-pointer flex items-center gap-1.5 active:scale-[0.96]",
                        selectedWager === myChips
                          ? "border-rose-500 bg-rose-500 text-white shadow-md shadow-rose-500/20"
                          : "border-black/[0.08] dark:border-white/[0.08] hover:border-rose-400 text-zinc-800 dark:text-zinc-200 bg-zinc-50 dark:bg-zinc-800/60"
                      )}
                    >
                      <Flame className="w-4 h-4 text-rose-500 group-hover:text-white" weight="fill" />
                      <span>{t('multiplayer.poker.allIn')}</span>
                      <span className="font-mono tabular-nums opacity-90">({myChips})</span>
                    </button>
                  </div>

                  <div className="flex items-center justify-center gap-4 max-w-sm mx-auto pt-2">
                    <input
                      type="range"
                      min={10}
                      max={Math.max(10, myChips)}
                      step={10}
                      value={selectedWager}
                      onChange={(e) => setSelectedWager(Number(e.target.value))}
                      className="w-full accent-amber-500 cursor-pointer"
                    />
                    <span className="font-mono font-bold text-base text-zinc-900 dark:text-white tabular-nums w-16 text-right">
                      {selectedWager}
                    </span>
                  </div>

                  <div className="pt-2 flex justify-center">
                    <Button
                      variant="primary"
                      onClick={handleConfirmWager}
                      className="px-8 py-3.5 rounded-2xl font-bold text-base flex items-center gap-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 shadow-lg shadow-amber-500/25 border-none active:scale-[0.97]"
                    >
                      <PokerChip className="w-5 h-5" weight="fill" />
                      <span>{t('multiplayer.poker.placeWagerBtn', { amount: selectedWager })}</span>
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Phase 2: Answering Phase */}
          {pokerState.phase === 'answering' && currentQuestion && (
            <motion.div
              initial={{ filter: 'blur(8px)', opacity: 0 }}
              animate={{ filter: 'blur(0px)', opacity: 1 }}
              transition={{ duration: 0.3 }}
              className="space-y-4"
            >
              <div className="grid grid-cols-1 gap-3">
                {currentQuestion.answers.map((ans, idx) => {
                  const isSelected = selectedAnswerIndices.includes(idx);
                  return (
                    <button
                      key={ans.id || idx}
                      disabled={hasSubmittedLocalAnswer}
                      onClick={() => handleToggleAnswer(idx)}
                      className={cn(
                        "w-full p-4 rounded-2xl border text-left font-medium text-sm transition-all duration-150 flex items-center justify-between group active:scale-[0.985]",
                        isSelected
                          ? "border-amber-500 bg-amber-500/10 text-amber-950 dark:text-amber-100 shadow-xs ring-2 ring-amber-500/20"
                          : "border-black/[0.08] dark:border-white/[0.08] bg-zinc-50/50 dark:bg-zinc-850/50 hover:border-amber-400 text-zinc-800 dark:text-zinc-200 cursor-pointer",
                        hasSubmittedLocalAnswer && "cursor-default active:scale-100"
                      )}
                    >
                      <div className="flex items-center gap-3 flex-1">
                        <div className={cn(
                          "w-7 h-7 rounded-xl border flex items-center justify-center font-bold text-xs shrink-0 transition-colors",
                          isSelected
                            ? "border-amber-500 bg-amber-500 text-white"
                            : "border-black/[0.12] dark:border-white/[0.12] text-zinc-500 group-hover:border-amber-400"
                        )}>
                          {ANSWER_KEYS[idx] || (idx + 1)}
                        </div>
                        <div className="text-sm">
                          <MarkdownRenderer content={ans.text} />
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="pt-4 flex justify-center">
                {hasSubmittedLocalAnswer ? (
                  <div className="p-3.5 rounded-2xl bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 text-sm font-semibold flex items-center gap-2">
                    <Clock className="w-4 h-4 animate-spin text-amber-500" />
                    <span>{t('multiplayer.poker.answerSubmitted')}</span>
                  </div>
                ) : (
                  <Button
                    variant="primary"
                    disabled={selectedAnswerIndices.length === 0}
                    onClick={handleConfirmAnswer}
                    className="px-8 py-3.5 rounded-2xl font-bold text-base flex items-center gap-2 shadow-lg shadow-primary-600/20 active:scale-[0.97]"
                  >
                    <span>{t('multiplayer.poker.submitAnswer')}</span>
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </motion.div>
          )}

          {/* Phase 3: Showdown View */}
          {pokerState.phase === 'showdown' && currentQuestion && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: 'spring', bounce: 0.1, duration: 0.35 }}
              className="space-y-6"
            >
              {/* Showdown Result Banner */}
              {myId && pokerState.roundResults?.[myId] && (
                <div className={cn(
                  "p-4 sm:p-5 rounded-2xl border flex items-center gap-3 text-center sm:text-left shadow-xs backdrop-blur-md",
                  pokerState.roundResults[myId].isCorrect
                    ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-950 dark:text-emerald-100"
                    : "border-rose-500/40 bg-rose-500/10 text-rose-950 dark:text-rose-100"
                )}>
                  {pokerState.roundResults[myId].isCorrect ? (
                    <CheckCircle className="w-8 h-8 text-emerald-500 shrink-0" weight="fill" />
                  ) : (
                    <XCircle className="w-8 h-8 text-rose-500 shrink-0" weight="fill" />
                  )}
                  <div className="flex-1">
                    <h4 className="font-extrabold text-base sm:text-lg">
                      {pokerState.roundResults[myId].isCorrect
                        ? t('multiplayer.poker.showdownWon', { amount: myWager })
                        : t('multiplayer.poker.showdownLost', { amount: myWager })}
                    </h4>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 font-mono tabular-nums">
                      {t('multiplayer.poker.nextRoundCountdown', { seconds: pokerState.timeLeftSeconds })}
                    </p>
                  </div>
                </div>
              )}

              {/* Answer options with Player tags */}
              <div className="grid grid-cols-1 gap-3">
                {currentQuestion.answers.map((ans, idx) => {
                  const isCorrect = ans.isCorrect;
                  // Players who chose this answer
                  const playersChoseThis = players.filter(p =>
                    pokerState.answers[p.userId]?.includes(idx)
                  );

                  return (
                    <div
                      key={ans.id || idx}
                      className={cn(
                        "w-full p-4 rounded-2xl border text-left font-medium text-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 backdrop-blur-sm",
                        isCorrect
                          ? "border-emerald-500/60 bg-emerald-500/10 text-emerald-950 dark:text-emerald-100 shadow-xs"
                          : "border-black/[0.06] dark:border-white/[0.06] bg-zinc-50/40 dark:bg-zinc-900/40 text-zinc-500 dark:text-zinc-400 opacity-80"
                      )}
                    >
                      <div className="flex items-center gap-3 flex-1">
                        <div className={cn(
                          "w-7 h-7 rounded-xl border flex items-center justify-center font-bold text-xs shrink-0",
                          isCorrect
                            ? "border-emerald-500 bg-emerald-500 text-white"
                            : "border-black/[0.1] dark:border-white/[0.1] text-zinc-400"
                        )}>
                          {isCorrect ? <CheckCircle className="w-4 h-4" weight="bold" /> : ANSWER_KEYS[idx] || (idx + 1)}
                        </div>
                        <div className="text-sm">
                          <MarkdownRenderer content={ans.text} />
                        </div>
                      </div>

                      {/* Players badge pills for this answer */}
                      {playersChoseThis.length > 0 && (
                        <div className="flex flex-wrap items-center gap-1.5 self-end sm:self-center">
                          {playersChoseThis.map(p => (
                            <span
                              key={p.userId}
                              className={cn(
                                "text-[11px] font-bold px-2 py-0.5 rounded-full border shadow-2xs flex items-center gap-1",
                                isCorrect
                                  ? "bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-900/40 dark:text-emerald-200 dark:border-emerald-800"
                                  : "bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-900/40 dark:text-rose-200 dark:border-rose-800"
                              )}
                            >
                              <span>{p.username}</span>
                              {p.userId === myId && <span>({t('multiplayer.podium.youTag', 'Ty')})</span>}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </div>
      )}
    </div>
  );
};
