import { useState, useRef, useCallback, useEffect } from 'react';
import { toast } from 'sonner';
import { supabase } from '../lib/supabase';
import { WebRTCManager } from '../utils/webrtc';
import { useProfile } from './useProfile';

export interface Player {
  userId: string;
  username: string;
  avatarUrl: string;
  isHost: boolean;
  status: 'joined' | 'downloading' | 'ready' | 'disconnected';
  progress: number;
  accuracy?: number;
  timeSeconds?: number;
  finishedAt?: number;
  isDNF?: boolean;
}

interface PresenceUser {
  userId: string;
  username: string;
  avatarUrl?: string;
  isHost?: boolean;
  status?: Player['status'];
  progress?: number;
}

interface SignalingPayload {
  target: string;
  sender: string;
  type: 'offer' | 'answer' | 'ice-candidate';
  offer?: RTCSessionDescriptionInit;
  answer?: RTCSessionDescriptionInit;
  candidate?: RTCIceCandidateInit;
}

interface ProgressUpdatePayload {
  userId: string;
  progress: number;
  status?: Player['status'];
}

interface TestProgressPayload {
  userId: string;
  progress: number;
  accuracy?: number;
  timeSeconds?: number;
  finishedAt?: number;
}

export type MultiplayerGameMode = 'race' | 'tug_of_war' | 'poker';

export interface TugPullPayload {
  userId: string;
  team: 'A' | 'B';
  delta: number;
  streak: number;
  isCorrect: boolean;
}

export interface TugSyncPayload {
  ropePosition: number; // -100 (Baza A) do +100 (Baza B)
  timeLeftSeconds: number;
  winner: 'A' | 'B' | 'tie' | null;
  winReason: 'knockout' | 'timeout' | null;
}

export interface PokerState {
  currentRound: number;
  totalRounds: number;
  phase: 'wager' | 'answering' | 'showdown' | 'ended';
  questionIndex: number;
  timeLeftSeconds: number;
  chips: Record<string, number>;
  wagers: Record<string, number>;
  answers: Record<string, number[]>;
  roundResults: Record<string, { isCorrect: boolean; chipDelta: number }> | null;
}

interface PackageTransferStartPayload {
  sender: string;
  target: string;
  totalChunks: number;
  totalSize: number;
}

interface PackageTransferChunkPayload {
  sender: string;
  target: string;
  chunkIndex: number;
  totalChunks: number;
  data: string;
}

const MULTIPLAYER_SESSION_KEY = 'testownik_multiplayer_session';

interface StoredMultiplayerSession {
  roomCode: string;
  isHost: boolean;
  raceStarted: boolean;
  gameMode?: MultiplayerGameMode;
}

function getStoredMultiplayerSession(): StoredMultiplayerSession | null {
  try {
    if (typeof sessionStorage === 'undefined') return null;
    const raw = sessionStorage.getItem(MULTIPLAYER_SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function setStoredMultiplayerSession(data: StoredMultiplayerSession): void {
  try {
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.setItem(MULTIPLAYER_SESSION_KEY, JSON.stringify(data));
    }
  } catch {}
}

function clearStoredMultiplayerSession(): void {
  try {
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.removeItem(MULTIPLAYER_SESSION_KEY);
    }
  } catch {}
}

export const useMultiplayer = () => {
  const { profile } = useProfile();
  const [roomCode, setRoomCode] = useState<string | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const playersRef = useRef<Player[]>([]);
  playersRef.current = players;
  const [isHost, setIsHost] = useState(false);
  const [isSendingPackage, setIsSendingPackage] = useState(false);
  const [rematchEventCount, setRematchEventCount] = useState(0);
  
  // Maps a userId to their WebRTCManager
  const peersRef = useRef<Map<string, WebRTCManager>>(new Map());
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const lastBroadcastTimeRef = useRef(0);
  const lastBroadcastPercentRef = useRef<number | null>(null);
  const hasReconnectedRef = useRef(false);

  // Buffer for Supabase Realtime package chunks
  const incomingSupabasePkgRef = useRef<{
    totalChunks: number;
    totalSize: number;
    chunks: Map<number, Uint8Array>;
  } | null>(null);

  // Zwraca plik pobrany przez gościa
  const [receivedFile, setReceivedFile] = useState<Blob | null>(null);
  const [raceStarted, setRaceStarted] = useState(false);
  const raceStartedRef = useRef(false);
  raceStartedRef.current = raceStarted;

  // Game mode & Tug of War state
  const [gameMode, setGameModeState] = useState<MultiplayerGameMode>('race');
  const gameModeRef = useRef<MultiplayerGameMode>('race');
  gameModeRef.current = gameMode;

  const [tugState, setTugState] = useState<TugSyncPayload>({
    ropePosition: 0,
    timeLeftSeconds: 90,
    winner: null,
    winReason: null,
  });
  const tugStateRef = useRef(tugState);
  tugStateRef.current = tugState;
  const tugTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Poker state
  const [pokerState, setPokerState] = useState<PokerState>({
    currentRound: 1,
    totalRounds: 5,
    phase: 'wager',
    questionIndex: 0,
    timeLeftSeconds: 10,
    chips: {},
    wagers: {},
    answers: {},
    roundResults: null,
  });
  const pokerStateRef = useRef(pokerState);
  pokerStateRef.current = pokerState;
  const pokerTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pokerAnswersCorrectRef = useRef<Record<string, boolean>>({});

  const [debugLogs, setDebugLogs] = useState<string[]>([]);
  const addLog = useCallback((msg: string) => setDebugLogs(p => [...p, msg].slice(-10)), []);

  const cleanup = useCallback(() => {
    clearStoredMultiplayerSession();
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }
    peersRef.current.forEach(pc => pc.close());
    peersRef.current.clear();
    setRoomCode(null);
    setPlayers([]);
    setReceivedFile(null);
    setRaceStarted(false);
    raceStartedRef.current = false;
    incomingSupabasePkgRef.current = null;
    if (tugTimerRef.current) {
      clearInterval(tugTimerRef.current);
      tugTimerRef.current = null;
    }
    setTugState({
      ropePosition: 0,
      timeLeftSeconds: 90,
      winner: null,
      winReason: null,
    });
    if (pokerTimerRef.current) {
      clearInterval(pokerTimerRef.current);
      pokerTimerRef.current = null;
    }
    pokerAnswersCorrectRef.current = {};
    setPokerState({
      currentRound: 1,
      totalRounds: 5,
      phase: 'wager',
      questionIndex: 0,
      timeLeftSeconds: 10,
      chips: {},
      wagers: {},
      answers: {},
      roundResults: null,
    });
    setGameModeState('race');
    gameModeRef.current = 'race';
  }, []);

  const initWebRTCForPeer = useCallback((peerId: string) => {
    if (peersRef.current.has(peerId)) return peersRef.current.get(peerId)!;

    const manager = new WebRTCManager({
      onIceCandidate: (candidate) => {
        channelRef.current?.send({
          type: 'broadcast',
          event: 'signaling',
          payload: { target: peerId, sender: profile?.id, type: 'ice-candidate', candidate }
        });
      },
      onConnectionStateChange: (state) => {
        addLog(`WebRTC [${peerId}]: ${state}`);
        if (state === 'failed' || state === 'disconnected' || state === 'closed') {
          peersRef.current.delete(peerId);
        }
      },
      onDataChannel: () => {
        addLog(`Data Channel Open [${peerId}]`);
      }
    });

    let lastSentWebRTCPercent = 0;
    manager.onProgress = (percent) => {
      setPlayers(prev => prev.map(p => p.userId === profile?.id ? { ...p, progress: percent, status: 'downloading' } : p));
      if (percent === 100 || percent - lastSentWebRTCPercent >= 10) {
        lastSentWebRTCPercent = percent;
        channelRef.current?.send({
          type: 'broadcast',
          event: 'progress_update',
          payload: { userId: profile?.id, progress: percent, status: 'downloading' }
        });
      }
    };

    manager.onFileReceived = (blob) => {
      // Set received file; status 'ready' is deferred until unzip/import finishes
      setReceivedFile(blob);
      setPlayers(prev => prev.map(p => p.userId === profile?.id ? { ...p, progress: 100, status: 'downloading' } : p));
    };

    peersRef.current.set(peerId, manager);
    return manager;
  }, [profile?.id, addLog]);

  const sendPackageViaSupabase = async (blob: Blob, targetUserId: string) => {
    if (!channelRef.current || !profile) return;
    const buffer = await blob.arrayBuffer();
    const uint8 = new Uint8Array(buffer);
    
    // 24KB binary -> ~32KB base64 per chunk (safely below 256KB Supabase message limit)
    const CHUNK_BINARY_SIZE = 24 * 1024;
    const totalChunks = Math.ceil(uint8.byteLength / CHUNK_BINARY_SIZE);
    
    await channelRef.current.send({
      type: 'broadcast',
      event: 'pkg_transfer_start',
      payload: {
        sender: profile.id,
        target: targetUserId,
        totalChunks,
        totalSize: uint8.byteLength,
      }
    });

    for (let i = 0; i < totalChunks; i++) {
      const start = i * CHUNK_BINARY_SIZE;
      const end = Math.min(start + CHUNK_BINARY_SIZE, uint8.byteLength);
      const slice = uint8.subarray(start, end);
      
      let binary = '';
      for (let j = 0; j < slice.length; j++) {
        binary += String.fromCharCode(slice[j]);
      }
      const base64Data = btoa(binary);

      await channelRef.current.send({
        type: 'broadcast',
        event: 'pkg_transfer_chunk',
        payload: {
          sender: profile.id,
          target: targetUserId,
          chunkIndex: i,
          totalChunks,
          data: base64Data,
        }
      });

      const percent = Math.min(99, Math.round(((i + 1) / totalChunks) * 100));
      setPlayers(prev => prev.map(p => p.userId === targetUserId ? { ...p, progress: percent, status: 'downloading' } : p));
      
      if (i % 2 === 0) {
        await new Promise(r => setTimeout(r, 15));
      }
    }
  };

  const markPlayerReady = useCallback(() => {
    if (!profile) return;
    setPlayers(prev => prev.map(p => p.userId === profile.id ? { ...p, progress: 100, status: 'ready' } : p));
    channelRef.current?.send({
      type: 'broadcast',
      event: 'progress_update',
      payload: { userId: profile.id, progress: 100, status: 'ready' }
    });
  }, [profile]);

  const joinRoom = useCallback(async (code: string, hostMode: boolean = false) => {
    cleanup();
    if (!profile) return;
    
    setIsHost(hostMode);
    setRoomCode(code);
    setStoredMultiplayerSession({ roomCode: code, isHost: hostMode, raceStarted: false });
    
    const channel = supabase.channel(`room:${code}`, {
      config: { presence: { key: profile.id }, broadcast: { ack: true } }
    });
    channelRef.current = channel;

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const activeIds = new Set<string>();
        const presentPlayers: Player[] = [];
        
        Object.keys(state).forEach(key => {
          const presences = (state[key] || []) as unknown as PresenceUser[];
          presences.forEach(p => {
            activeIds.add(p.userId);
            presentPlayers.push({
              userId: p.userId,
              username: p.username,
              avatarUrl: p.avatarUrl || '',
              isHost: Boolean(p.isHost),
              status: p.status || 'joined',
              progress: p.progress || 0
            });
          });
        });
        
        setPlayers(prev => {
          if (raceStartedRef.current) {
            const merged = presentPlayers.map(np => {
              const existing = prev.find(ep => ep.userId === np.userId);
              return existing
                ? { ...existing, ...np, isDNF: false, status: existing.status === 'disconnected' ? 'ready' : (np.status || existing.status) }
                : np;
            });
            prev.forEach(ep => {
              if (!activeIds.has(ep.userId)) {
                merged.push({ ...ep, status: 'disconnected', isDNF: true });
              }
            });
            return merged;
          }
          return presentPlayers;
        });

        if (hostMode) {
          presentPlayers.forEach(async (p) => {
            if (p.userId !== profile.id && !peersRef.current.has(p.userId)) {
              addLog(`Inicjalizacja WebRTC dla: ${p.userId}`);
              const manager = initWebRTCForPeer(p.userId);
              const offer = await manager.createOffer();
              channel.send({
                type: 'broadcast',
                event: 'signaling',
                payload: { target: p.userId, sender: profile.id, type: 'offer', offer }
              }).then(res => addLog(`Status oferty: ${res === 'ok' ? 'OK' : JSON.stringify(res)}`));
            }
          });
        }
      })
      .on('presence', { event: 'leave' }, ({ leftPresences }) => {
        const leftIds = new Set((leftPresences as unknown as PresenceUser[]).map(lp => lp.userId));
        leftIds.forEach(id => {
          const peer = peersRef.current.get(id);
          if (peer) {
            peer.close();
            peersRef.current.delete(id);
          }
        });
        setPlayers(prev => prev.map(p => {
          if (leftIds.has(p.userId)) {
            return {
              ...p,
              status: 'disconnected',
              isDNF: true,
            };
          }
          return p;
        }));
      })
      .on('broadcast', { event: 'request_offer' }, async ({ payload }: { payload: { sender: string } }) => {
        if (!hostMode || payload.sender === profile.id) return;
        addLog(`Otrzymano prośbę o ofertę od: ${payload.sender}`);
        const existing = peersRef.current.get(payload.sender);
        if (existing) {
          existing.close();
          peersRef.current.delete(payload.sender);
        }
        const manager = initWebRTCForPeer(payload.sender);
        const offer = await manager.createOffer();
        channel.send({
          type: 'broadcast',
          event: 'signaling',
          payload: { target: payload.sender, sender: profile.id, type: 'offer', offer }
        });
        // Prześlij nowemu graczowi aktualnie wybrany tryb gry
        channel.send({
          type: 'broadcast',
          event: 'change_game_mode',
          payload: { mode: gameModeRef.current }
        });
      })
      .on('broadcast', { event: 'signaling' }, async ({ payload }: { payload: SignalingPayload }) => {
        if (payload.target !== profile.id) return;
        addLog(`Sygnalizacja: ${payload.type} od ${payload.sender}`);
        const manager = initWebRTCForPeer(payload.sender);
        if (payload.type === 'offer' && payload.offer) {
          const answer = await manager.handleOffer(payload.offer);
          channel.send({
            type: 'broadcast',
            event: 'signaling',
            payload: { target: payload.sender, sender: profile.id, type: 'answer', answer }
          }).then(res => addLog(`Status odpowiedzi: ${res === 'ok' ? 'OK' : JSON.stringify(res)}`));
        } else if (payload.type === 'answer' && payload.answer) {
          await manager.handleAnswer(payload.answer);
        } else if (payload.type === 'ice-candidate' && payload.candidate) {
          await manager.handleIceCandidate(payload.candidate);
        }
      })
      .on('broadcast', { event: 'pkg_transfer_start' }, ({ payload }: { payload: PackageTransferStartPayload }) => {
        if (payload.target !== profile.id && payload.target !== 'all') return;
        addLog(`Pobieranie paczki przez relay (${Math.round(payload.totalSize / 1024)} KB)...`);
        incomingSupabasePkgRef.current = {
          totalChunks: payload.totalChunks,
          totalSize: payload.totalSize,
          chunks: new Map(),
        };
        setPlayers(prev => prev.map(p => p.userId === profile.id ? { ...p, progress: 0, status: 'downloading' } : p));
      })
      .on('broadcast', { event: 'pkg_transfer_chunk' }, ({ payload }: { payload: PackageTransferChunkPayload }) => {
        if (payload.target !== profile.id && payload.target !== 'all') return;
        const current = incomingSupabasePkgRef.current;
        if (!current) return;

        const binaryStr = atob(payload.data);
        const len = binaryStr.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
          bytes[i] = binaryStr.charCodeAt(i);
        }
        current.chunks.set(payload.chunkIndex, bytes);

        const percent = Math.min(100, Math.round((current.chunks.size / current.totalChunks) * 100));
        setPlayers(prev => prev.map(p => p.userId === profile.id ? { ...p, progress: percent, status: 'downloading' } : p));
        
        if (current.chunks.size === current.totalChunks || current.chunks.size % 5 === 0) {
          channelRef.current?.send({
            type: 'broadcast',
            event: 'progress_update',
            payload: { userId: profile.id, progress: percent, status: 'downloading' }
          });
        }

        if (current.chunks.size === current.totalChunks) {
          const completeArray = new Uint8Array(current.totalSize);
          let offset = 0;
          for (let i = 0; i < current.totalChunks; i++) {
            const chunkBytes = current.chunks.get(i);
            if (chunkBytes) {
              completeArray.set(chunkBytes, offset);
              offset += chunkBytes.byteLength;
            }
          }
          const blob = new Blob([completeArray]);
          incomingSupabasePkgRef.current = null;
          setReceivedFile(blob);
        }
      })
      .on('broadcast', { event: 'progress_update' }, ({ payload }: { payload: ProgressUpdatePayload }) => {
        setPlayers(prev => prev.map(p => 
          p.userId === payload.userId 
            ? { ...p, progress: payload.progress, status: payload.status || p.status } 
            : p
        ));
      })
      .on('broadcast', { event: 'change_game_mode' }, ({ payload }: { payload: { mode: MultiplayerGameMode } }) => {
        if (payload?.mode) {
          setGameModeState(payload.mode);
          gameModeRef.current = payload.mode;
        }
      })
      .on('broadcast', { event: 'tug_pull' }, ({ payload }: { payload: TugPullPayload }) => {
        if (hostMode) {
          const current = tugStateRef.current;
          if (current.winner) return;
          const newPos = Math.max(-100, Math.min(100, current.ropePosition + payload.delta));
          let winner: 'A' | 'B' | null = null;
          let winReason: 'knockout' | null = null;
          if (newPos <= -100) {
            winner = 'A';
            winReason = 'knockout';
          } else if (newPos >= 100) {
            winner = 'B';
            winReason = 'knockout';
          }
          const updated: TugSyncPayload = {
            ...current,
            ropePosition: newPos,
            winner,
            winReason,
          };
          setTugState(updated);
          channelRef.current?.send({
            type: 'broadcast',
            event: 'tug_sync',
            payload: updated,
          });
        }
      })
      .on('broadcast', { event: 'tug_sync' }, ({ payload }: { payload: TugSyncPayload }) => {
        setTugState(payload);
      })
      .on('broadcast', { event: 'poker_sync' }, ({ payload }: { payload: PokerState }) => {
        setPokerState(payload);
        pokerStateRef.current = payload;
      })
      .on('broadcast', { event: 'poker_wager' }, ({ payload }: { payload: { userId: string; amount: number } }) => {
        setPokerState(prev => {
          const updated = {
            ...prev,
            wagers: { ...prev.wagers, [payload.userId]: payload.amount }
          };
          pokerStateRef.current = updated;
          return updated;
        });
        if (hostMode) {
          const current = pokerStateRef.current;
          if (current.phase === 'wager') {
            const nextWagers = { ...current.wagers, [payload.userId]: payload.amount };
            const activeUserIds = playersRef.current.length > 0
              ? playersRef.current.map(p => p.userId)
              : (profile?.id ? [profile.id] : []);
            const allWagered = activeUserIds.length > 0 && activeUserIds.every(uid => nextWagers[uid] !== undefined);
            if (allWagered) {
              const nextState: PokerState = {
                ...current,
                phase: 'answering',
                timeLeftSeconds: 15,
                wagers: nextWagers,
              };
              setPokerState(nextState);
              pokerStateRef.current = nextState;
              channelRef.current?.send({
                type: 'broadcast',
                event: 'poker_sync',
                payload: nextState,
              });
            }
          }
        }
      })
      .on('broadcast', { event: 'poker_answer' }, ({ payload }: { payload: { userId: string; selectedIndices: number[]; isCorrect: boolean } }) => {
        setPokerState(prev => {
          const updated = {
            ...prev,
            answers: { ...prev.answers, [payload.userId]: payload.selectedIndices }
          };
          pokerStateRef.current = updated;
          return updated;
        });
        if (hostMode) {
          pokerAnswersCorrectRef.current[payload.userId] = payload.isCorrect;
          const current = pokerStateRef.current;
          if (current.phase === 'answering') {
            const nextAnswers = { ...current.answers, [payload.userId]: payload.selectedIndices };
            const activeUserIds = playersRef.current.length > 0
              ? playersRef.current.map(p => p.userId)
              : (profile?.id ? [profile.id] : []);
            const allAnswered = activeUserIds.length > 0 && activeUserIds.every(uid => nextAnswers[uid] !== undefined);
            if (allAnswered) {
              const roundResults: Record<string, { isCorrect: boolean; chipDelta: number }> = {};
              const newChips = { ...current.chips };
              activeUserIds.forEach(uid => {
                const wager = current.wagers[uid] || 50;
                const isCorrect = pokerAnswersCorrectRef.current[uid] ?? false;
                const chipDelta = isCorrect ? wager : -wager;
                const currentBal = newChips[uid] ?? 1000;
                const nextBal = Math.max(0, currentBal + chipDelta);
                newChips[uid] = nextBal === 0 ? 100 : nextBal;
                roundResults[uid] = { isCorrect, chipDelta };
              });
              const nextState: PokerState = {
                ...current,
                phase: 'showdown',
                timeLeftSeconds: 6,
                chips: newChips,
                answers: nextAnswers,
                roundResults,
              };
              setPokerState(nextState);
              pokerStateRef.current = nextState;
              channelRef.current?.send({
                type: 'broadcast',
                event: 'poker_sync',
                payload: nextState,
              });
            }
          }
        }
      })
      .on('broadcast', { event: 'start_race' }, () => {
        setRaceStarted(true);
        raceStartedRef.current = true;
        setStoredMultiplayerSession({ roomCode: code, isHost: hostMode, raceStarted: true, gameMode: gameModeRef.current });
      })
      .on('broadcast', { event: 'reset_race' }, () => {
        setRaceStarted(false);
        raceStartedRef.current = false;
        setStoredMultiplayerSession({ roomCode: code, isHost: hostMode, raceStarted: false, gameMode: gameModeRef.current });
        setReceivedFile(null);
        if (tugTimerRef.current) {
          clearInterval(tugTimerRef.current);
          tugTimerRef.current = null;
        }
        setTugState({
          ropePosition: 0,
          timeLeftSeconds: 90,
          winner: null,
          winReason: null,
        });
        if (pokerTimerRef.current) {
          clearInterval(pokerTimerRef.current);
          pokerTimerRef.current = null;
        }
        pokerAnswersCorrectRef.current = {};
        setPokerState({
          currentRound: 1,
          totalRounds: 5,
          phase: 'wager',
          questionIndex: 0,
          timeLeftSeconds: 10,
          chips: {},
          wagers: {},
          answers: {},
          roundResults: null,
        });
        setPlayers(prev => prev.map(p => ({
          ...p,
          progress: 0,
          status: 'ready',
          accuracy: undefined,
          timeSeconds: undefined,
          finishedAt: undefined,
          isDNF: false,
        })));
        setRematchEventCount(c => c + 1);
      })
      .on('broadcast', { event: 'test_progress' }, ({ payload }: { payload: TestProgressPayload }) => {
        setPlayers(prev => prev.map(p => 
          p.userId === payload.userId 
            ? { 
                ...p, 
                progress: payload.progress,
                accuracy: payload.accuracy !== undefined ? payload.accuracy : p.accuracy,
                timeSeconds: payload.timeSeconds !== undefined ? payload.timeSeconds : p.timeSeconds,
                finishedAt: payload.finishedAt !== undefined 
                  ? (p.finishedAt ? Math.min(p.finishedAt, payload.finishedAt) : payload.finishedAt)
                  : (payload.progress >= 100 && !p.finishedAt ? Date.now() : p.finishedAt),
              } 
            : p
        ));
      });

    await channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        await channel.track({
          userId: profile.id,
          username: profile.username,
          avatarUrl: profile.avatar_url,
          isHost: hostMode,
          status: 'joined',
          progress: 0
        });

        // Jeśli jestem gościem, poproś gospodarza o ofertę WebRTC
        if (!hostMode) {
          channel.send({
            type: 'broadcast',
            event: 'request_offer',
            payload: { sender: profile.id }
          });
        }
      }
    });
  }, [profile, cleanup, initWebRTCForPeer, addLog]);

  // Auto-reconnect to room after unexpected page refresh
  useEffect(() => {
    if (!profile || hasReconnectedRef.current || roomCode) return;

    const stored = getStoredMultiplayerSession();
    if (stored?.roomCode) {
      hasReconnectedRef.current = true;
      if (stored.gameMode) {
        setGameModeState(stored.gameMode);
        gameModeRef.current = stored.gameMode;
      }
      if (stored.raceStarted) {
        setRaceStarted(true);
        raceStartedRef.current = true;
      }
      joinRoom(stored.roomCode, stored.isHost);
    }
  }, [profile, roomCode, joinRoom]);

  // Prevent accidental page refresh / tab close during active room or race
  useEffect(() => {
    if (!roomCode) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
      return '';
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [roomCode]);

  // Teardown WebRTC peer connections and Supabase realtime channels on unmount
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  const setGameMode = useCallback((mode: MultiplayerGameMode) => {
    setGameModeState(mode);
    gameModeRef.current = mode;
    if (roomCode) {
      setStoredMultiplayerSession({ roomCode, isHost, raceStarted: raceStartedRef.current, gameMode: mode });
    }
    if (channelRef.current && isHost) {
      channelRef.current.send({
        type: 'broadcast',
        event: 'change_game_mode',
        payload: { mode }
      });
    }
  }, [isHost, roomCode]);

  const resetRace = useCallback(() => {
    if (tugTimerRef.current) {
      clearInterval(tugTimerRef.current);
      tugTimerRef.current = null;
    }
    const initialTug: TugSyncPayload = {
      ropePosition: 0,
      timeLeftSeconds: 90,
      winner: null,
      winReason: null,
    };
    setTugState(initialTug);
    if (pokerTimerRef.current) {
      clearInterval(pokerTimerRef.current);
      pokerTimerRef.current = null;
    }
    pokerAnswersCorrectRef.current = {};
    const initialPoker: PokerState = {
      currentRound: 1,
      totalRounds: 5,
      phase: 'wager',
      questionIndex: 0,
      timeLeftSeconds: 10,
      chips: {},
      wagers: {},
      answers: {},
      roundResults: null,
    };
    setPokerState(initialPoker);
    pokerStateRef.current = initialPoker;
    setRaceStarted(false);
    raceStartedRef.current = false;
    setReceivedFile(null);
    if (roomCode) {
      setStoredMultiplayerSession({ roomCode, isHost, raceStarted: false, gameMode: gameModeRef.current });
    }
    setPlayers(prev => prev.map(p => ({
      ...p,
      progress: 0,
      status: 'joined',
      accuracy: undefined,
      timeSeconds: undefined,
      finishedAt: undefined,
      isDNF: false,
    })));
  }, [roomCode, isHost]);

  const triggerRematch = useCallback(() => {
    if (tugTimerRef.current) {
      clearInterval(tugTimerRef.current);
      tugTimerRef.current = null;
    }
    const initialTug: TugSyncPayload = {
      ropePosition: 0,
      timeLeftSeconds: 90,
      winner: null,
      winReason: null,
    };
    setTugState(initialTug);
    if (pokerTimerRef.current) {
      clearInterval(pokerTimerRef.current);
      pokerTimerRef.current = null;
    }
    pokerAnswersCorrectRef.current = {};
    const initialPoker: PokerState = {
      currentRound: 1,
      totalRounds: 5,
      phase: 'wager',
      questionIndex: 0,
      timeLeftSeconds: 10,
      chips: {},
      wagers: {},
      answers: {},
      roundResults: null,
    };
    setPokerState(initialPoker);
    pokerStateRef.current = initialPoker;
    channelRef.current?.send({
      type: 'broadcast',
      event: 'reset_race',
    });
    setRaceStarted(false);
    raceStartedRef.current = false;
    if (roomCode) {
      setStoredMultiplayerSession({ roomCode, isHost, raceStarted: false, gameMode: gameModeRef.current });
    }
    setPlayers(prev => prev.map(p => ({
      ...p,
      progress: 0,
      status: 'ready',
      accuracy: undefined,
      timeSeconds: undefined,
      finishedAt: undefined,
      isDNF: false,
    })));
    setRematchEventCount(c => c + 1);
  }, [roomCode, isHost]);

  const startRace = useCallback((pokerRounds?: number) => {
    if (!isHost) return;
    if (gameModeRef.current === 'tug_of_war') {
      const initialTug: TugSyncPayload = {
        ropePosition: 0,
        timeLeftSeconds: 90,
        winner: null,
        winReason: null,
      };
      setTugState(initialTug);
      channelRef.current?.send({
        type: 'broadcast',
        event: 'tug_sync',
        payload: initialTug
      });
    } else if (gameModeRef.current === 'poker') {
      const initialChips: Record<string, number> = {};
      playersRef.current.forEach(p => {
        initialChips[p.userId] = 1000;
      });
      if (profile?.id && !initialChips[profile.id]) {
        initialChips[profile.id] = 1000;
      }
      const initialPoker: PokerState = {
        currentRound: 1,
        totalRounds: pokerRounds ?? 5,
        phase: 'wager',
        questionIndex: 0,
        timeLeftSeconds: 10,
        chips: initialChips,
        wagers: {},
        answers: {},
        roundResults: null,
      };
      setPokerState(initialPoker);
      pokerStateRef.current = initialPoker;
      pokerAnswersCorrectRef.current = {};
      channelRef.current?.send({
        type: 'broadcast',
        event: 'poker_sync',
        payload: initialPoker,
      });
    }
    channelRef.current?.send({
      type: 'broadcast',
      event: 'start_race'
    });
    setRaceStarted(true);
    raceStartedRef.current = true;
    if (roomCode) {
      setStoredMultiplayerSession({ roomCode, isHost: true, raceStarted: true, gameMode: gameModeRef.current });
    }
  }, [isHost, roomCode, profile]);

  // Host timer for Tug of War match
  useEffect(() => {
    if (!isHost || !raceStarted || gameMode !== 'tug_of_war') {
      if (tugTimerRef.current) {
        clearInterval(tugTimerRef.current);
        tugTimerRef.current = null;
      }
      return;
    }

    tugTimerRef.current = setInterval(() => {
      setTugState(prev => {
        if (prev.winner || prev.timeLeftSeconds <= 0) {
          if (tugTimerRef.current) {
            clearInterval(tugTimerRef.current);
            tugTimerRef.current = null;
          }
          return prev;
        }

        const newTime = prev.timeLeftSeconds - 1;
        let winner: 'A' | 'B' | 'tie' | null = prev.winner;
        let winReason: 'knockout' | 'timeout' | null = prev.winReason;

        if (newTime <= 0) {
          winReason = 'timeout';
          if (prev.ropePosition < 0) {
            winner = 'A';
          } else if (prev.ropePosition > 0) {
            winner = 'B';
          } else {
            winner = 'tie';
          }
        }

        const updated: TugSyncPayload = {
          ...prev,
          timeLeftSeconds: Math.max(0, newTime),
          winner,
          winReason,
        };

        channelRef.current?.send({
          type: 'broadcast',
          event: 'tug_sync',
          payload: updated,
        });

        return updated;
      });
    }, 1000);

    return () => {
      if (tugTimerRef.current) {
        clearInterval(tugTimerRef.current);
        tugTimerRef.current = null;
      }
    };
  }, [isHost, raceStarted, gameMode]);

  // Host timer for Poker match
  useEffect(() => {
    if (!isHost || !raceStarted || gameMode !== 'poker') {
      if (pokerTimerRef.current) {
        clearInterval(pokerTimerRef.current);
        pokerTimerRef.current = null;
      }
      return;
    }

    pokerTimerRef.current = setInterval(() => {
      setPokerState(prev => {
        if (prev.phase === 'ended') {
          if (pokerTimerRef.current) {
            clearInterval(pokerTimerRef.current);
            pokerTimerRef.current = null;
          }
          return prev;
        }

        const newTime = prev.timeLeftSeconds - 1;

        if (newTime > 0) {
          const updated: PokerState = { ...prev, timeLeftSeconds: newTime };
          pokerStateRef.current = updated;
          channelRef.current?.send({
            type: 'broadcast',
            event: 'poker_sync',
            payload: updated,
          });
          return updated;
        }

        // Time expired for current phase!
        let updated: PokerState;
        const activeUserIds = playersRef.current.length > 0
          ? playersRef.current.map(p => p.userId)
          : (profile?.id ? [profile.id] : []);

        if (prev.phase === 'wager') {
          const wagers = { ...prev.wagers };
          activeUserIds.forEach(uid => {
            if (wagers[uid] === undefined) {
              const bal = prev.chips[uid] ?? 1000;
              wagers[uid] = Math.min(50, Math.max(10, bal));
            }
          });
          updated = {
            ...prev,
            phase: 'answering',
            timeLeftSeconds: 15,
            wagers,
          };
        } else if (prev.phase === 'answering') {
          const roundResults: Record<string, { isCorrect: boolean; chipDelta: number }> = {};
          const newChips = { ...prev.chips };
          activeUserIds.forEach(uid => {
            const wager = prev.wagers[uid] || 50;
            const isCorrect = pokerAnswersCorrectRef.current[uid] ?? false;
            const chipDelta = isCorrect ? wager : -wager;
            const currentBal = newChips[uid] ?? 1000;
            const nextBal = Math.max(0, currentBal + chipDelta);
            newChips[uid] = nextBal === 0 ? 100 : nextBal;
            roundResults[uid] = { isCorrect, chipDelta };
          });
          updated = {
            ...prev,
            phase: 'showdown',
            timeLeftSeconds: 6,
            chips: newChips,
            roundResults,
          };
        } else if (prev.phase === 'showdown') {
          if (prev.currentRound >= prev.totalRounds) {
            updated = {
              ...prev,
              phase: 'ended',
              timeLeftSeconds: 0,
            };
          } else {
            pokerAnswersCorrectRef.current = {};
            updated = {
              ...prev,
              currentRound: prev.currentRound + 1,
              questionIndex: prev.questionIndex + 1,
              phase: 'wager',
              timeLeftSeconds: 10,
              wagers: {},
              answers: {},
              roundResults: null,
            };
          }
        } else {
          updated = prev;
        }

        pokerStateRef.current = updated;
        channelRef.current?.send({
          type: 'broadcast',
          event: 'poker_sync',
          payload: updated,
        });
        return updated;
      });
    }, 1000);

    return () => {
      if (pokerTimerRef.current) {
        clearInterval(pokerTimerRef.current);
        pokerTimerRef.current = null;
      }
    };
  }, [isHost, raceStarted, gameMode, profile]);

  const submitPokerWager = useCallback((amount: number) => {
    if (!profile || !channelRef.current || !raceStartedRef.current) return;
    channelRef.current.send({
      type: 'broadcast',
      event: 'poker_wager',
      payload: { userId: profile.id, amount }
    });
    setPokerState(prev => {
      const updated = {
        ...prev,
        wagers: { ...prev.wagers, [profile.id]: amount }
      };
      pokerStateRef.current = updated;
      return updated;
    });

    if (isHost) {
      const current = pokerStateRef.current;
      const nextWagers = { ...current.wagers, [profile.id]: amount };
      const activeUserIds = playersRef.current.length > 0
        ? playersRef.current.map(p => p.userId)
        : (profile?.id ? [profile.id] : []);
      const allWagered = activeUserIds.length > 0 && activeUserIds.every(uid => nextWagers[uid] !== undefined);
      if (allWagered && current.phase === 'wager') {
        const nextState: PokerState = {
          ...current,
          phase: 'answering',
          timeLeftSeconds: 15,
          wagers: nextWagers,
        };
        setPokerState(nextState);
        pokerStateRef.current = nextState;
        channelRef.current.send({
          type: 'broadcast',
          event: 'poker_sync',
          payload: nextState,
        });
      }
    }
  }, [profile, isHost]);

  const submitPokerAnswer = useCallback((selectedIndices: number[], isCorrect: boolean) => {
    if (!profile || !channelRef.current || !raceStartedRef.current) return;
    channelRef.current.send({
      type: 'broadcast',
      event: 'poker_answer',
      payload: { userId: profile.id, selectedIndices, isCorrect }
    });
    setPokerState(prev => {
      const updated = {
        ...prev,
        answers: { ...prev.answers, [profile.id]: selectedIndices }
      };
      pokerStateRef.current = updated;
      return updated;
    });

    if (isHost) {
      pokerAnswersCorrectRef.current[profile.id] = isCorrect;
      const current = pokerStateRef.current;
      const nextAnswers = { ...current.answers, [profile.id]: selectedIndices };
      const activeUserIds = playersRef.current.length > 0
        ? playersRef.current.map(p => p.userId)
        : (profile?.id ? [profile.id] : []);
      const allAnswered = activeUserIds.length > 0 && activeUserIds.every(uid => nextAnswers[uid] !== undefined);
      if (allAnswered && current.phase === 'answering') {
        const roundResults: Record<string, { isCorrect: boolean; chipDelta: number }> = {};
        const newChips = { ...current.chips };
        activeUserIds.forEach(uid => {
          const wager = current.wagers[uid] || 50;
          const correct = pokerAnswersCorrectRef.current[uid] ?? false;
          const chipDelta = correct ? wager : -wager;
          const currentBal = newChips[uid] ?? 1000;
          const nextBal = Math.max(0, currentBal + chipDelta);
          newChips[uid] = nextBal === 0 ? 100 : nextBal;
          roundResults[uid] = { isCorrect: correct, chipDelta };
        });
        const nextState: PokerState = {
          ...current,
          phase: 'showdown',
          timeLeftSeconds: 6,
          chips: newChips,
          answers: nextAnswers,
          roundResults,
        };
        setPokerState(nextState);
        pokerStateRef.current = nextState;
        channelRef.current.send({
          type: 'broadcast',
          event: 'poker_sync',
          payload: nextState,
        });
      }
    }
  }, [profile, isHost]);

  const pullRope = useCallback((isCorrect: boolean, streak: number) => {
    if (!profile || !channelRef.current || !raceStartedRef.current) return;
    if (tugStateRef.current.winner) return;

    const myIndex = players.findIndex(p => p.userId === profile.id);
    const team: 'A' | 'B' = (myIndex === -1 ? 0 : myIndex) % 2 === 0 ? 'A' : 'B';
    const baseDelta = isCorrect ? (streak >= 3 ? 15 : 10) : -12;
    // Team A: poprawna odpowiedź ciągnie ku -100
    // Team B: poprawna odpowiedź ciągnie ku +100
    const directionalDelta = team === 'A' ? -baseDelta : baseDelta;

    channelRef.current.send({
      type: 'broadcast',
      event: 'tug_pull',
      payload: {
        userId: profile.id,
        team,
        delta: directionalDelta,
        streak,
        isCorrect
      }
    });

    if (isHost) {
      const current = tugStateRef.current;
      const newPos = Math.max(-100, Math.min(100, current.ropePosition + directionalDelta));
      let winner: 'A' | 'B' | null = null;
      let winReason: 'knockout' | null = null;
      if (newPos <= -100) {
        winner = 'A';
        winReason = 'knockout';
      } else if (newPos >= 100) {
        winner = 'B';
        winReason = 'knockout';
      }
      const updated: TugSyncPayload = {
        ...current,
        ropePosition: newPos,
        winner,
        winReason,
      };
      setTugState(updated);
      channelRef.current.send({
        type: 'broadcast',
        event: 'tug_sync',
        payload: updated
      });
    }
  }, [profile, players, isHost]);

  const broadcastTestProgress = useCallback((
    percent: number,
    extra?: { accuracy?: number; timeSeconds?: number; finishedAt?: number }
  ) => {
    if (!roomCode || !profile) return;
    const now = Date.now();
    const isFinish = percent >= 100 || (extra && extra.finishedAt !== undefined);

    if (!isFinish) {
      if (lastBroadcastPercentRef.current === percent) return;
      if (
        now - lastBroadcastTimeRef.current < 200 &&
        Math.abs(percent - (lastBroadcastPercentRef.current ?? 0)) < 3
      ) {
        return;
      }
    }

    lastBroadcastTimeRef.current = now;
    lastBroadcastPercentRef.current = percent;

    const resolvedFinishedAt = extra?.finishedAt !== undefined
      ? extra.finishedAt
      : (percent >= 100 ? now : undefined);

    const fullExtra = {
      ...extra,
      ...(resolvedFinishedAt !== undefined ? { finishedAt: resolvedFinishedAt } : {}),
    };

    channelRef.current?.send({
      type: 'broadcast',
      event: 'test_progress',
      payload: { 
        userId: profile.id, 
        progress: percent,
        ...fullExtra,
      }
    });

    setPlayers(prev => prev.map(p => 
      p.userId === profile.id 
        ? { 
            ...p, 
            progress: percent, 
            ...fullExtra,
            finishedAt: fullExtra.finishedAt !== undefined
              ? (p.finishedAt ? Math.min(p.finishedAt, fullExtra.finishedAt) : fullExtra.finishedAt)
              : p.finishedAt,
          } 
        : p
    ));
  }, [roomCode, profile]);

  const sendFileToAll = useCallback(async (file: File | Blob) => {
    if (!isHost) return;
    const targetGuests = players.filter(p => !p.isHost && p.status !== 'disconnected');
    if (targetGuests.length === 0) {
      toast.error('Brak innych graczy w pokoju');
      return;
    }

    setIsSendingPackage(true);
    toast.info('Wysyłanie paczki z pytaniami...');

    try {
      for (const guest of targetGuests) {
        const peer = peersRef.current.get(guest.userId);
        let sentViaWebRTC = false;

        if (peer && peer.isConnected()) {
          try {
            addLog(`Wysyłanie WebRTC do: ${guest.username}`);
            setPlayers(prev => prev.map(p => p.userId === guest.userId ? { ...p, status: 'downloading', progress: 0 } : p));
            await peer.sendFile(file, {}, (percent) => {
              setPlayers(prev => prev.map(p => p.userId === guest.userId ? { ...p, progress: percent } : p));
            });
            sentViaWebRTC = true;
          } catch (err) {
            addLog(`Błąd WebRTC dla ${guest.username}, przełączanie na relay Supabase: ${(err as Error).message}`);
          }
        }

        if (!sentViaWebRTC) {
          addLog(`Wysyłanie przez relay do: ${guest.username}`);
          setPlayers(prev => prev.map(p => p.userId === guest.userId ? { ...p, status: 'downloading', progress: 0 } : p));
          await sendPackageViaSupabase(file, guest.userId);
        }
      }
      toast.success('Paczka została wysłana do wszystkich graczy!');
    } catch (globalErr) {
      toast.error('Błąd podczas wysyłania paczki: ' + ((globalErr as Error).message || globalErr));
    } finally {
      setIsSendingPackage(false);
    }
  }, [isHost, players, addLog]);

  return {
    roomCode,
    isHost,
    isSendingPackage,
    players,
    profile,
    currentUserId: profile?.id,
    joinRoom,
    cleanup,
    sendFileToAll,
    markPlayerReady,
    startRace,
    resetRace,
    triggerRematch,
    rematchEventCount,
    raceStarted,
    broadcastTestProgress,
    receivedFile,
    debugLogs,
    gameMode,
    setGameMode,
    tugState,
    pullRope,
    pokerState,
    submitPokerWager,
    submitPokerAnswer,
  };
};
