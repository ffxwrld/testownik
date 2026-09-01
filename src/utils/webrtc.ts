export const CHUNK_SIZE = 64 * 1024; // 64KB

export type PeerConnectionCallbacks = {
  onIceCandidate: (candidate: RTCIceCandidate) => void;
  onDataChannel: (channel: RTCDataChannel) => void;
  onConnectionStateChange: (state: RTCPeerConnectionState) => void;
};

export class WebRTCManager {
  private pc: RTCPeerConnection;
  private dataChannel: RTCDataChannel | null = null;
  private receiveBuffer: Uint8Array[] = [];
  private receivedBytes = 0;
  private expectedSize = 0;
  
  public onProgress?: (percent: number) => void;
  public onFileReceived?: (blob: Blob, metadata: any) => void;

  constructor(private callbacks: PeerConnectionCallbacks) {
    this.pc = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
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

  public async createOffer(): Promise<RTCSessionDescriptionInit> {
    this.dataChannel = this.pc.createDataChannel('testownik-file-transfer');
    this.setupDataChannel(this.dataChannel);
    const offer = await this.pc.createOffer();
    await this.pc.setLocalDescription(offer);
    return offer;
  }

  public async handleOffer(offer: RTCSessionDescriptionInit): Promise<RTCSessionDescriptionInit> {
    await this.pc.setRemoteDescription(offer);
    const answer = await this.pc.createAnswer();
    await this.pc.setLocalDescription(answer);
    return answer;
  }

  public async handleAnswer(answer: RTCSessionDescriptionInit) {
    await this.pc.setRemoteDescription(answer);
  }

  public async handleIceCandidate(candidate: RTCIceCandidateInit) {
    await this.pc.addIceCandidate(candidate);
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
          const percent = Math.round((this.receivedBytes / this.expectedSize) * 100);
          this.onProgress(percent);
        }

        if (this.receivedBytes === this.expectedSize) {
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

  public async sendFile(file: File | Blob, metadata: any = {}, onProgress?: (p: number) => void) {
    if (!this.dataChannel || this.dataChannel.readyState !== 'open') {
      throw new Error('Data channel is not open');
    }

    // Send metadata first
    this.dataChannel.send(JSON.stringify({ type: 'metadata', size: file.size, ...metadata }));

    const buffer = await file.arrayBuffer();
    let offset = 0;

    const sendChunk = () => {
      while (offset < buffer.byteLength) {
        if (this.dataChannel!.bufferedAmount > this.dataChannel!.bufferedAmountLowThreshold) {
          // Wait for buffer to drain
          this.dataChannel!.onbufferedamountlow = () => {
            this.dataChannel!.onbufferedamountlow = null;
            sendChunk();
          };
          return;
        }

        const chunk = buffer.slice(offset, offset + CHUNK_SIZE);
        this.dataChannel!.send(chunk);
        offset += chunk.byteLength;
        
        if (onProgress) {
          onProgress(Math.round((offset / buffer.byteLength) * 100));
        }
      }
    };

    if (this.dataChannel.bufferedAmountLowThreshold === 0) {
        this.dataChannel.bufferedAmountLowThreshold = 65536; // 64KB
    }
    
    sendChunk();
  }

  public close() {
    if (this.dataChannel) this.dataChannel.close();
    this.pc.close();
  }
}
