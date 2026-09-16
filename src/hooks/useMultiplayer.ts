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

export const useMultiplayer = () => {
  const { profile } = useProfile();
  const [roomCode, setRoomCode] = useState<string | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [isHost, setIsHost] = useState(false);
  const [isSendingPackage, setIsSendingPackage] = useState(false);
  const [rematchEventCount, setRematchEventCount] = useState(0);
  
  // Maps a userId to their WebRTCManager
  const peersRef = useRef<Map<string, WebRTCManager>>(new Map());
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const lastBroadcastTimeRef = useRef(0);
  const lastBroadcastPercentRef = useRef<number | null>(null);

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
    incomingSupabasePkgRef.current = null;
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

    manager.onProgress = (percent) => {
      setPlayers(prev => prev.map(p => p.userId === profile?.id ? { ...p, progress: percent, status: 'downloading' } : p));
      channelRef.current?.send({
        type: 'broadcast',
        event: 'progress_update',
        payload: { userId: profile?.id, progress: percent, status: 'downloading' }
      });
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
        
        channelRef.current?.send({
          type: 'broadcast',
          event: 'progress_update',
          payload: { userId: profile.id, progress: percent, status: 'downloading' }
        });

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
    debugLogs
  };
};
