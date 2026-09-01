import { useState, useRef, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { WebRTCManager } from '../utils/webrtc';
import { useProfile } from './useProfile';

export interface Player {
  userId: string;
  username: string;
  avatarUrl: string;
  isHost: boolean;
  status: 'joined' | 'downloading' | 'ready';
  progress: number;
}

export const useMultiplayer = () => {
  const { profile } = useProfile();
  const [roomCode, setRoomCode] = useState<string | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [isHost, setIsHost] = useState(false);
  
  // Maps a userId to their WebRTCManager
  const peersRef = useRef<Map<string, WebRTCManager>>(new Map());
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  // Zwraca plik pobrany przez gościa
  const [receivedFile, setReceivedFile] = useState<Blob | null>(null);
  const [raceStarted, setRaceStarted] = useState(false);

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
        console.log(`[WebRTC] Connection with ${peerId}: ${state}`);
      },
      onDataChannel: () => {
        console.log(`[WebRTC] Data channel established with ${peerId}`);
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
      config: { presence: { key: profile.id } }
    });
    channelRef.current = channel;

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const newPlayers: Player[] = [];
        
        Object.keys(state).forEach(key => {
          const presences = state[key] as any[];
          presences.forEach(p => {
            newPlayers.push({
              userId: p.userId,
              username: p.username,
              avatarUrl: p.avatarUrl,
              isHost: p.isHost,
              status: p.status || 'joined',
              progress: p.progress || 0
            });
          });
        });
        
        setPlayers(newPlayers);

        if (hostMode) {
          newPlayers.forEach(async (p) => {
            if (p.userId !== profile.id && !peersRef.current.has(p.userId)) {
              const manager = initWebRTCForPeer(p.userId);
              const offer = await manager.createOffer();
              channel.send({
                type: 'broadcast',
                event: 'signaling',
                payload: { target: p.userId, sender: profile.id, type: 'offer', offer }
              });
            }
          });
        }
      })
      .on('broadcast', { event: 'signaling' }, async ({ payload }: { payload: any }) => {
        if (payload.target !== profile.id) return;
        const manager = initWebRTCForPeer(payload.sender);
        if (payload.type === 'offer') {
          const answer = await manager.handleOffer(payload.offer);
          channel.send({
            type: 'broadcast',
            event: 'signaling',
            payload: { target: payload.sender, sender: profile.id, type: 'answer', answer }
          });
        } else if (payload.type === 'answer') {
          await manager.handleAnswer(payload.answer);
        } else if (payload.type === 'ice-candidate') {
          await manager.handleIceCandidate(payload.candidate);
        }
      })
      .on('broadcast', { event: 'progress_update' }, ({ payload }: { payload: any }) => {
        setPlayers(prev => prev.map(p => 
          p.userId === payload.userId 
            ? { ...p, progress: payload.progress, status: payload.status || p.status } 
            : p
        ));
      })
      .on('broadcast', { event: 'start_race' }, () => {
        setRaceStarted(true);
      })
      .on('broadcast', { event: 'test_progress' }, ({ payload }: { payload: any }) => {
        setPlayers(prev => prev.map(p => p.userId === payload.userId ? { ...p, progress: payload.progress } : p));
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

  
  const startRace = useCallback(() => {
    if (!isHost) return;
    channelRef.current?.send({
      type: 'broadcast',
      event: 'start_race'
    });
    setRaceStarted(true);
  }, [isHost]);

  
  const broadcastTestProgress = useCallback((percent: number) => {
    if (!roomCode) return;
    channelRef.current?.send({
      type: 'broadcast',
      event: 'test_progress',
      payload: { userId: profile?.id, progress: percent }
    });
  }, [roomCode, profile]);

  const sendFileToAll = useCallback((file: File | Blob) => {
    if (!isHost) return;
    peersRef.current.forEach(manager => {
      // Wyślij plik do każdego peera
      manager.sendFile(file).catch(err => console.error('P2P Send error', err));
    });
  }, [isHost]);

  return {
    roomCode,
    isHost,
    players,
    joinRoom,
    cleanup,
    sendFileToAll,
    startRace,
    raceStarted,
    broadcastTestProgress,
    receivedFile
  };
};
