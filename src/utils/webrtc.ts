export const CHUNK_SIZE = 16 * 1024; // 16KB for maximum cross-browser RTCDataChannel reliability

export type PeerConnectionCallbacks = {
  onIceCandidate: (candidate: RTCIceCandidate) => void;
  onDataChannel: (channel: RTCDataChannel) => void;
  onConnectionStateChange: (state: RTCPeerConnectionState) => void;
};

const TURN_URL = import.meta.env.VITE_TURN_URL || 'openrelay.metered.ca';
const TURN_USER = import.meta.env.VITE_TURN_USERNAME || 'openrelayproject';
const TURN_CRED = import.meta.env.VITE_TURN_CREDENTIAL || 'openrelayproject';

if (import.meta.env.PROD && !import.meta.env.VITE_TURN_URL) {
  console.warn(
    '[WebRTC] Running in production without dedicated VITE_TURN_URL. Public OpenRelay fallback may be subject to rate-limiting.'
  );
}

const ICE_GATHERING_TIMEOUT_MS = 1000;

export class WebRTCManager {
  private pc: RTCPeerConnection;
  private iceCandidateQueue: RTCIceCandidateInit[] = [];
  private dataChannel: RTCDataChannel | null = null;
  private receiveBuffer: Uint8Array[] = [];
  private receivedBytes = 0;
  private expectedSize = 0;
  
  public onProgress?: (percent: number) => void;
  public onFileReceived?: (blob: Blob, metadata: Record<string, unknown>) => void;

  constructor(private callbacks: PeerConnectionCallbacks) {
    this.pc = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:global.stun.twilio.com:3478' },
        { urls: `turn:${TURN_URL}:80`, username: TURN_USER, credential: TURN_CRED },
        { urls: `turn:${TURN_URL}:443`, username: TURN_USER, credential: TURN_CRED },
        { urls: `turn:${TURN_URL}:443?transport=tcp`, username: TURN_USER, credential: TURN_CRED }
      ]
    });

    this.pc.onicecandidate = (event) => {
      if (event.candidate) {
        this.callbacks.onIceCandidate(event.candidate);
      }
    };

    this.pc.onconnectionstatechange = () => {
      this.callbacks.onConnectionStateChange(this.pc.connectionState);
    };

    this.pc.ondatachannel = (event) => {
      this.setupDataChannel(event.channel);
      this.callbacks.onDataChannel(event.channel);
    };
  }

  public isConnected(): boolean {
    return this.dataChannel !== null && this.dataChannel.readyState === 'open';
  }

  public getConnectionState(): RTCPeerConnectionState {
    return this.pc.connectionState;
  }

  public async createOffer(): Promise<RTCSessionDescriptionInit> {
    this.dataChannel = this.pc.createDataChannel('testownik-file-transfer');
    this.setupDataChannel(this.dataChannel);
    const offer = await this.pc.createOffer();
    await this.pc.setLocalDescription(offer);
    
    // Zbieramy kandydatów ICE przez maksymalnie 4 sekundy, żeby wbudować ich w Offer (omijamy rate-limity Supabase)
    await new Promise<void>((resolve) => {
      if (this.pc.iceGatheringState === 'complete') {
        resolve();
      } else {
        const timeout = setTimeout(resolve, ICE_GATHERING_TIMEOUT_MS);
        this.pc.onicegatheringstatechange = () => {
          if (this.pc.iceGatheringState === 'complete') {
            clearTimeout(timeout);
            resolve();
          }
        };
      }
    });

    return this.pc.localDescription!;
  }

  private async processIceQueue() {
    for (const candidate of this.iceCandidateQueue) {
      try {
        await this.pc.addIceCandidate(candidate);
      } catch (e) {
        console.error('Failed to add queued ICE candidate', e);
      }
    }
    this.iceCandidateQueue = [];
  }

  public async handleOffer(offer: RTCSessionDescriptionInit): Promise<RTCSessionDescriptionInit> {
    await this.pc.setRemoteDescription(offer);
    const answer = await this.pc.createAnswer();
    await this.pc.setLocalDescription(answer);
    
    // Zbieramy kandydatów ICE przez maksymalnie 4 sekundy, żeby wbudować ich w Answer
    await new Promise<void>((resolve) => {
      if (this.pc.iceGatheringState === 'complete') {
        resolve();
      } else {
        const timeout = setTimeout(resolve, ICE_GATHERING_TIMEOUT_MS);
        this.pc.onicegatheringstatechange = () => {
          if (this.pc.iceGatheringState === 'complete') {
            clearTimeout(timeout);
            resolve();
          }
        };
      }
    });

    await this.processIceQueue();
    return this.pc.localDescription!;
  }

  public async handleAnswer(answer: RTCSessionDescriptionInit) {
    await this.pc.setRemoteDescription(answer);
    await this.processIceQueue();
  }

  public async handleIceCandidate(candidate: RTCIceCandidateInit) {
    if (this.pc.remoteDescription && this.pc.remoteDescription.type) {
      try {
        await this.pc.addIceCandidate(candidate);
      } catch (e) {
        console.error('Failed to add ICE candidate', e);
      }
    } else {
      this.iceCandidateQueue.push(candidate);
    }
  }

  private setupDataChannel(channel: RTCDataChannel) {
    this.dataChannel = channel;
    this.dataChannel.binaryType = 'arraybuffer';

    this.dataChannel.onmessage = (event) => {
      if (typeof event.data === 'string') {
        const msg = JSON.parse(event.data);
        if (msg.type === 'metadata') {
          if (msg.size > 100 * 1024 * 1024) throw new Error("File too large (max 100MB)");
          this.expectedSize = msg.size;
          this.receiveBuffer = [];
          this.receivedBytes = 0;
          if (this.onProgress) this.onProgress(0);
        }
      } else if (event.data instanceof ArrayBuffer) {
        if (this.receivedBytes + event.data.byteLength > 100 * 1024 * 1024) {
          throw new Error("Maximum receive buffer size exceeded");
        }
        this.receiveBuffer.push(new Uint8Array(event.data));
        this.receivedBytes += event.data.byteLength;
        
        if (this.expectedSize > 0 && this.onProgress) {
          const percent = Math.min(100, Math.round((this.receivedBytes / this.expectedSize) * 100));
          this.onProgress(percent);
        }

        if (this.expectedSize > 0 && this.receivedBytes >= this.expectedSize) {
          const blob = new Blob(this.receiveBuffer as unknown as BlobPart[]);
          if (this.onFileReceived) {
            this.onFileReceived(blob, {});
          }
          this.receiveBuffer = [];
          this.expectedSize = 0;
          this.receivedBytes = 0;
        }
      }
    };
  }

  public async sendFile(file: File | Blob, metadata: Record<string, unknown> = {}, onProgress?: (p: number) => void): Promise<void> {
    if (!this.dataChannel) {
      throw new Error('Data channel is not created');
    }

    if (this.dataChannel.readyState !== 'open') {
      console.log('Waiting for data channel to open...');
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error('Data channel timeout (5s)')), 5000);
        
        const prevOnOpen = this.dataChannel!.onopen;
        this.dataChannel!.onopen = (e) => {
          clearTimeout(timeout);
          if (prevOnOpen) prevOnOpen.call(this.dataChannel!, e);
          resolve();
        };
        
        const prevOnError = this.dataChannel!.onerror;
        this.dataChannel!.onerror = (e) => {
          clearTimeout(timeout);
          if (prevOnError) prevOnError.call(this.dataChannel!, e);
          reject(new Error('Data channel error'));
        };
      });
    }

    // Send metadata first
    this.dataChannel.send(JSON.stringify({ type: 'metadata', size: file.size, ...metadata }));

    const buffer = await file.arrayBuffer();
    let offset = 0;

    if (this.dataChannel.bufferedAmountLowThreshold === 0) {
      this.dataChannel.bufferedAmountLowThreshold = 32768; // 32KB
    }

    await new Promise<void>((resolve, reject) => {
      const sendChunk = () => {
        try {
          while (offset < buffer.byteLength) {
            if (this.dataChannel!.bufferedAmount > (this.dataChannel!.bufferedAmountLowThreshold || 32768)) {
              let drained = false;
              const resume = () => {
                if (drained) return;
                drained = true;
                this.dataChannel!.onbufferedamountlow = null;
                sendChunk();
              };
              this.dataChannel!.onbufferedamountlow = resume;
              setTimeout(resume, 100); // Safety fallback so buffer drain never deadlocks
              return;
            }

            const chunk = buffer.slice(offset, offset + CHUNK_SIZE);
            this.dataChannel!.send(chunk);
            offset += chunk.byteLength;
            
            if (onProgress) {
              onProgress(Math.min(99, Math.round((offset / buffer.byteLength) * 100)));
            }
          }
          if (onProgress) onProgress(100);
          resolve();
        } catch (err) {
          reject(err);
        }
      };

      sendChunk();
    });
  }

  public close() {
    if (this.dataChannel) {
      try { this.dataChannel.close(); } catch { /* ignore */ }
    }
    try { this.pc.close(); } catch { /* ignore */ }
  }
}
