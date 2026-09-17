import { useState, useRef, useCallback, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { WebRTCManager } from '../utils/webrtc';
import { exportSessionToZip, importSessionFromZip } from '../utils/parser';
import { loadSession } from '../utils/session';
import { SessionState, SavedSessionMetadata } from '../models/types';
import type { RealtimeChannel } from '@supabase/supabase-js';

export type P2PTransferStatus = 
  | 'idle' 
  | 'waiting_for_peer' 
  | 'connecting' 
  | 'transferring' 
  | 'completed' 
  | 'error';

export interface UseP2PTransferReturn {
  status: P2PTransferStatus;
  progress: number;
  errorMessage: string | null;
  roomCode: string | null;
  startSending: (sessionMeta: SavedSessionMetadata) => Promise<string>;
  startReceiving: (code: string) => Promise<SessionState | null>;
  cancel: () => void;
  receivedSession: SessionState | null;
}

export function useP2PTransfer(): UseP2PTransferReturn {
  const [status, setStatus] = useState<P2PTransferStatus>('idle');
  const [progress, setProgress] = useState<number>(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [roomCode, setRoomCode] = useState<string | null>(null);
  const [receivedSession, setReceivedSession] = useState<SessionState | null>(null);

  const channelRef = useRef<RealtimeChannel | null>(null);
  const webrtcRef = useRef<WebRTCManager | null>(null);
  const incomingChunksRef = useRef<{ totalChunks: number; received: Map<number, Uint8Array>; totalSize: number } | null>(null);
  const transferRoleRef = useRef<'sender' | 'receiver' | null>(null);

  const cleanup = useCallback(() => {
    if (webrtcRef.current) {
      try {
        webrtcRef.current.close();
      } catch (err) {
        console.warn('Error closing WebRTC connection:', err);
      }
      webrtcRef.current = null;
    }

    if (channelRef.current) {
      try {
        supabase.removeChannel(channelRef.current);
      } catch (err) {
        console.warn('Error removing Supabase channel:', err);
      }
      channelRef.current = null;
    }

    incomingChunksRef.current = null;
    transferRoleRef.current = null;
  }, []);

  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  const cancel = useCallback(() => {
    cleanup();
    setStatus('idle');
    setProgress(0);
    setErrorMessage(null);
    setRoomCode(null);
    setReceivedSession(null);
  }, [cleanup]);

  // Fallback sender through Supabase Realtime broadcast chunks
  const sendViaSupabaseChunks = useCallback(async (blob: Blob) => {
    if (!channelRef.current) return;
    try {
      const buffer = await blob.arrayBuffer();
      const uint8 = new Uint8Array(buffer);
      const CHUNK_SIZE = 24 * 1024; // 24KB binary -> ~32KB base64
      const totalChunks = Math.ceil(uint8.byteLength / CHUNK_SIZE);

      await channelRef.current.send({
        type: 'broadcast',
        event: 'pkg_transfer_start',
        payload: { totalChunks, totalSize: uint8.byteLength }
      });

      for (let i = 0; i < totalChunks; i++) {
        const start = i * CHUNK_SIZE;
        const end = Math.min(start + CHUNK_SIZE, uint8.byteLength);
        const slice = uint8.subarray(start, end);

        let binary = '';
        for (let j = 0; j < slice.length; j++) {
          binary += String.fromCharCode(slice[j]);
        }
        const base64Data = btoa(binary);

        await channelRef.current.send({
          type: 'broadcast',
          event: 'pkg_transfer_chunk',
          payload: { chunkIndex: i, data: base64Data }
        });

        const percent = Math.min(99, Math.round(((i + 1) / totalChunks) * 100));
        setProgress(percent);
        await new Promise(res => setTimeout(res, 25));
      }

      setProgress(100);
      setStatus('completed');
    } catch (err) {
      console.error('Supabase broadcast transfer failed:', err);
      setStatus('error');
      setErrorMessage((err as Error).message || 'Błąd przesyłania');
    }
  }, []);

  // SENDER
  const startSending = useCallback(async (sessionMeta: SavedSessionMetadata): Promise<string> => {
    cleanup();
    transferRoleRef.current = 'sender';
    setProgress(0);
    setErrorMessage(null);
    setReceivedSession(null);

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setRoomCode(code);
    setStatus('waiting_for_peer');

    const channel = supabase.channel(`p2p-share-${code}`, {
      config: { broadcast: { self: false } }
    });
    channelRef.current = channel;

    let transferStarted = false;

    const initiateTransfer = async () => {
      if (transferStarted) return;
      transferStarted = true;
      setStatus('connecting');

      try {
        const fullSession = await loadSession(sessionMeta.id);
        if (!fullSession) {
          throw new Error('Nie udało się załadować danych sesji.');
        }

        const zipBlob = await exportSessionToZip(sessionMeta.id, fullSession);

        const manager = new WebRTCManager({
          onIceCandidate: (candidate) => {
            channel.send({
              type: 'broadcast',
              event: 'signaling',
              payload: { type: 'ice-candidate', candidate }
            });
          },
          onConnectionStateChange: (state) => {
            if (state === 'connected') {
              setStatus('transferring');
            } else if (state === 'failed' || state === 'disconnected') {
              if (!manager.isConnected()) {
                console.warn('[P2P] WebRTC connection failed, switching to Supabase Realtime fallback');
                sendViaSupabaseChunks(zipBlob);
              }
            }
          },
          onDataChannel: () => {
            setStatus('transferring');
          }
        });

        webrtcRef.current = manager;

        const offer = await manager.createOffer();
        await channel.send({
          type: 'broadcast',
          event: 'signaling',
          payload: { type: 'offer', offer }
        });

        const fallbackTimer = setTimeout(() => {
          if (!manager.isConnected()) {
            console.log('[P2P] DataChannel open timeout. Falling back to Supabase broadcast chunks...');
            sendViaSupabaseChunks(zipBlob);
          }
        }, 6000);

        try {
          await manager.sendFile(zipBlob, { baseName: sessionMeta.baseName }, (p) => {
            clearTimeout(fallbackTimer);
            setStatus('transferring');
            setProgress(p);
          });
          clearTimeout(fallbackTimer);
          setProgress(100);
          setStatus('completed');
        } catch (sendErr) {
          console.warn('[P2P] sendFile on DataChannel failed, trying Supabase fallback:', sendErr);
          clearTimeout(fallbackTimer);
          await sendViaSupabaseChunks(zipBlob);
        }
      } catch (err) {
        console.error('Error starting transfer:', err);
        setStatus('error');
        setErrorMessage((err as Error).message || 'Wystąpił błąd podczas przygotowania paczki');
      }
    };

    channel
      .on('broadcast', { event: 'receiver_ready' }, () => {
        initiateTransfer();
      })
      .on('broadcast', { event: 'signaling' }, async ({ payload }) => {
        if (!webrtcRef.current) return;
        if (payload.type === 'answer' && payload.answer) {
          await webrtcRef.current.handleAnswer(payload.answer);
        } else if (payload.type === 'ice-candidate' && payload.candidate) {
          await webrtcRef.current.handleIceCandidate(payload.candidate);
        }
      });

    channel.subscribe((subStatus) => {
      if (subStatus === 'CHANNEL_ERROR' || subStatus === 'TIMED_OUT') {
        setStatus('error');
        setErrorMessage('Błąd kanału komunikacyjnego. Sprawdź połączenie z siecią.');
      }
    });

    return code;
  }, [cleanup, sendViaSupabaseChunks]);

  // RECEIVER
  const startReceiving = useCallback(async (rawCode: string): Promise<SessionState | null> => {
    cleanup();
    transferRoleRef.current = 'receiver';
    setProgress(0);
    setErrorMessage(null);
    setReceivedSession(null);

    const cleanCode = rawCode.replace(/\D/g, '');
    if (cleanCode.length !== 6) {
      setStatus('error');
      setErrorMessage('Nieprawidłowy kod pokoju. Wymagane jest 6 cyfr.');
      return null;
    }

    setRoomCode(cleanCode);
    setStatus('connecting');

    return new Promise((resolve) => {
      const channel = supabase.channel(`p2p-share-${cleanCode}`, {
        config: { broadcast: { self: false } }
      });
      channelRef.current = channel;

      const handleFinishedBlob = async (blob: Blob) => {
        try {
          setStatus('transferring');
          setProgress(100);
          const { session } = await importSessionFromZip(blob);
          setReceivedSession(session);
          setStatus('completed');
          resolve(session);
        } catch (err) {
          console.error('Błąd importu paczki:', err);
          setStatus('error');
          setErrorMessage('Nie udało się zaimportować odebranej paczki: ' + ((err as Error).message || 'Nieznany błąd'));
          resolve(null);
        }
      };

      const manager = new WebRTCManager({
        onIceCandidate: (candidate) => {
          channel.send({
            type: 'broadcast',
            event: 'signaling',
            payload: { type: 'ice-candidate', candidate }
          });
        },
        onConnectionStateChange: (state) => {
          if (state === 'connected') {
            setStatus('transferring');
          }
        },
        onDataChannel: () => {
          setStatus('transferring');
        }
      });

      manager.onProgress = (percent) => {
        setStatus('transferring');
        setProgress(percent);
      };

      manager.onFileReceived = (blob) => {
        handleFinishedBlob(blob);
      };

      webrtcRef.current = manager;

      channel
        .on('broadcast', { event: 'signaling' }, async ({ payload }) => {
          if (payload.type === 'offer' && payload.offer) {
            try {
              const answer = await manager.handleOffer(payload.offer);
              await channel.send({
                type: 'broadcast',
                event: 'signaling',
                payload: { type: 'answer', answer }
              });
            } catch (err) {
              console.error('Error handling offer:', err);
            }
          } else if (payload.type === 'ice-candidate' && payload.candidate) {
            await manager.handleIceCandidate(payload.candidate);
          }
        })
        .on('broadcast', { event: 'pkg_transfer_start' }, ({ payload }) => {
          incomingChunksRef.current = {
            totalChunks: payload.totalChunks,
            totalSize: payload.totalSize,
            received: new Map()
          };
          setStatus('transferring');
          setProgress(0);
        })
        .on('broadcast', { event: 'pkg_transfer_chunk' }, async ({ payload }) => {
          if (!incomingChunksRef.current) return;
          const { chunkIndex, data } = payload;
          const binary = atob(data);
          const bytes = new Uint8Array(binary.length);
          for (let i = 0; i < binary.length; i++) {
            bytes[i] = binary.charCodeAt(i);
          }
          incomingChunksRef.current.received.set(chunkIndex, bytes);

          const count = incomingChunksRef.current.received.size;
          const total = incomingChunksRef.current.totalChunks;
          setProgress(Math.min(99, Math.round((count / total) * 100)));

          if (count === total) {
            const fullArray = new Uint8Array(incomingChunksRef.current.totalSize);
            let offset = 0;
            for (let i = 0; i < total; i++) {
              const chunk = incomingChunksRef.current.received.get(i);
              if (chunk) {
                fullArray.set(chunk, offset);
                offset += chunk.byteLength;
              }
            }
            const blob = new Blob([fullArray]);
            await handleFinishedBlob(blob);
          }
        });

      channel.subscribe((subStatus) => {
        if (subStatus === 'SUBSCRIBED') {
          channel.send({
            type: 'broadcast',
            event: 'receiver_ready',
            payload: {}
          });
        } else if (subStatus === 'CHANNEL_ERROR' || subStatus === 'TIMED_OUT') {
          setStatus('error');
          setErrorMessage('Błąd kanału komunikacyjnego. Sprawdź poprawność kodu.');
          resolve(null);
        }
      });
    });
  }, [cleanup]);

  return {
    status,
    progress,
    errorMessage,
    roomCode,
    startSending,
    startReceiving,
    cancel,
    receivedSession
  };
}
