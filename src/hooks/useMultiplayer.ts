import { useState, useRef, useCallback } from 'react';
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

export const useMultiplayer = () => {
  const { profile } = useProfile();
  const [roomCode, setRoomCode] = useState<string | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [isHost, setIsHost] = useState(false);
  const [rematchEventCount, setRematchEventCount] = useState(0);
  
  // Maps a userId to their WebRTCManager
  const peersRef = useRef<Map<string, WebRTCManager>>(new Map());
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const lastBroadcastTimeRef = useRef(0);
  const lastBroadcastPercentRef = useRef<number | null>(null);

  // Zwraca plik pobrany przez gościa
  const [receivedFile, setReceivedFile] = useState<Blob | null>(null);
  const [raceStarted, setRaceStarted] = useState(false);
  const raceStartedRef = useRef(false);
  raceStartedRef.current = raceStarted;

  const [debugLogs, setDebugLogs] = useState<string[]>([]);
  const addLog = useCallback((msg: string) => setDebugLogs(p => [...p, msg].slice(-10)), []);

  const cleanup = useCallback(() => {
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }
    peersRef.current.forEach(pc => pc.close());
    peersRef.current.clear();
    setRoomCode(null);
    setPlayers([]);
    setReceivedFile(null);
  }, []);

  const initWebRTCForPeer = (peerId: string) => {
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
        addLog(`WebRTC State [${peerId}]: ${state}`);
      },
      onDataChannel: () => {
        addLog(`Data Channel Open [${peerId}]`);
      }
    });

    manager.onProgress = (percent) => {
      // Jeśli jestem gościem, aktualizuję swój własny progress pobierania
      setPlayers(prev => prev.map(p => p.userId === profile?.id ? { ...p, progress: percent, status: 'downloading' } : p));
      
      // I powiadamiam hosta (oraz resztę)
      channelRef.current?.send({
        type: 'broadcast',
        event: 'progress_update',
        payload: { userId: profile?.id, progress: percent }
      });
    };

    manager.onFileReceived = (blob) => {
      setReceivedFile(blob);
      setPlayers(prev => prev.map(p => p.userId === profile?.id ? { ...p, progress: 100, status: 'ready' } : p));
      channelRef.current?.send({
        type: 'broadcast',
        event: 'progress_update',
        payload: { userId: profile?.id, progress: 100, status: 'ready' }
      });
    };

    peersRef.current.set(peerId, manager);
    return manager;
  };

  const joinRoom = useCallback(async (code: string, hostMode: boolean = false) => {
    cleanup();
    if (!profile) return;
    
    setIsHost(hostMode);
    setRoomCode(code);
    
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
          // If race has started or finished, preserve disconnected players as DNF so they remain visible on race track
          if (raceStartedRef.current) {
            const merged = presentPlayers.map(np => {
              const existing = prev.find(ep => ep.userId === np.userId);
              return existing ? { ...existing, ...np, status: existing.status === 'disconnected' ? 'ready' : (np.status || existing.status) } : np;
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
              addLog(`Init WebRTC for peer: ${p.userId}`);
              const manager = initWebRTCForPeer(p.userId);
              const offer = await manager.createOffer();
              channel.send({
                type: 'broadcast',
                event: 'signaling',
                payload: { target: p.userId, sender: profile.id, type: 'offer', offer }
              }).then(res => addLog(`Send Offer Status: ${res === 'ok' ? 'OK' : JSON.stringify(res)}`));
            }
          });
        }
      })
      .on('presence', { event: 'leave' }, ({ leftPresences }) => {
        const leftIds = new Set((leftPresences as unknown as PresenceUser[]).map(lp => lp.userId));
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
      .on('broadcast', { event: 'signaling' }, async ({ payload }: { payload: SignalingPayload }) => {
        if (payload.target !== profile.id) return;
        addLog(`Received Signaling: ${payload.type} from ${payload.sender}`);
        const manager = initWebRTCForPeer(payload.sender);
        if (payload.type === 'offer' && payload.offer) {
          const answer = await manager.handleOffer(payload.offer);
          channel.send({
            type: 'broadcast',
            event: 'signaling',
            payload: { target: payload.sender, sender: profile.id, type: 'answer', answer }
          }).then(res => addLog(`Send Answer Status: ${res === 'ok' ? 'OK' : JSON.stringify(res)}`));
        } else if (payload.type === 'answer' && payload.answer) {
          await manager.handleAnswer(payload.answer);
        } else if (payload.type === 'ice-candidate' && payload.candidate) {
          await manager.handleIceCandidate(payload.candidate);
        }
      })
      .on('broadcast', { event: 'progress_update' }, ({ payload }: { payload: ProgressUpdatePayload }) => {
        setPlayers(prev => prev.map(p => 
          p.userId === payload.userId 
            ? { ...p, progress: payload.progress, status: payload.status || p.status } 
            : p
        ));
      })
      .on('broadcast', { event: 'start_race' }, () => {
        setRaceStarted(true);
      })
      .on('broadcast', { event: 'reset_race' }, () => {
        setRaceStarted(false);
        setReceivedFile(null);
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
                finishedAt: payload.finishedAt !== undefined ? payload.finishedAt : p.finishedAt,
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
      }
    });
  }, [profile, cleanup]);

  
  const resetRace = useCallback(() => {
    setRaceStarted(false);
    setReceivedFile(null);
    setPlayers(prev => prev.map(p => ({
      ...p,
      progress: 0,
      status: 'joined',
      accuracy: undefined,
      timeSeconds: undefined,
      finishedAt: undefined,
      isDNF: false,
    })));
  }, []);

  const triggerRematch = useCallback(() => {
    channelRef.current?.send({
      type: 'broadcast',
      event: 'reset_race',
    });
    setRaceStarted(false);
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
  }, []);

  const startRace = useCallback(() => {
    if (!isHost) return;
    channelRef.current?.send({
      type: 'broadcast',
      event: 'start_race'
    });
    setRaceStarted(true);
  }, [isHost]);

  
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

    channelRef.current?.send({
      type: 'broadcast',
      event: 'test_progress',
      payload: { 
        userId: profile.id, 
        progress: percent,
        ...extra,
      }
    });

    setPlayers(prev => prev.map(p => 
      p.userId === profile.id 
        ? { ...p, progress: percent, ...extra } 
        : p
    ));
  }, [roomCode, profile]);

  const sendFileToAll = useCallback((file: File | Blob) => {
    if (!isHost) return;
    if (peersRef.current.size === 0) {
      toast.error('Brak aktywnych połączeń P2P z gośćmi');
      return;
    }
    
    peersRef.current.forEach((manager, peerId) => {
      setPlayers(prev => prev.map(p => p.userId === peerId ? { ...p, status: 'downloading', progress: 0 } : p));
      
      manager.sendFile(file, {}, (percent) => {
        setPlayers(prev => prev.map(p => p.userId === peerId ? { ...p, progress: percent, status: percent === 100 ? 'ready' : 'downloading' } : p));
      }).catch(err => {
        toast.error(`Błąd przesyłania bazy pytań: ${(err as Error).message || err}`);
        console.error('P2P Send error', err);
        setPlayers(prev => prev.map(p => p.userId === peerId ? { ...p, status: 'joined' } : p));
      });
    });
  }, [isHost]);

  return {
    roomCode,
    isHost,
    players,
    profile,
    currentUserId: profile?.id,
    joinRoom,
    cleanup,
    sendFileToAll,
    startRace,
    resetRace,
    triggerRematch,
    rematchEventCount,
    raceStarted,
    broadcastTestProgress,
    receivedFile,
    debugLogs
  };
};
