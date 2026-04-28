import {
  RTCPeerConnection,
  RTCSessionDescription,
  MediaStream,
  mediaDevices,
  RTCIceCandidate,
  RTCView,
  MediaStreamTrack,
} from "react-native-webrtc";
import { CALL_CONFIG, CALL_ICE_SERVERS } from "@/constants/calls";

class WebRTCService {
  private peerConnection: RTCPeerConnection | null = null;
  private localStream: MediaStream | null = null;
  private remoteStream: MediaStream | null = null;
  private iceCandidates: RTCIceCandidate[] = [];

  onIceCandidate?: (candidate: RTCIceCandidate) => void;
  onRemoteStream?: (stream: MediaStream) => void;
  onConnectionStateChange?: (state: any) => void;

  async createPeerConnection(
    isVideoCall: boolean = true,
  ): Promise<RTCPeerConnection> {
    this.cleanup();
    const config = { iceServers: CALL_ICE_SERVERS };
    this.peerConnection = new RTCPeerConnection(config);
    this.setupListeners();
    const constraints = isVideoCall
      ? CALL_CONFIG.VIDEO_CONSTRAINTS
      : CALL_CONFIG.VOICE_CONSTRAINTS;
    this.localStream = await mediaDevices.getUserMedia(constraints);
    if (this.localStream) {
      this.localStream.getTracks().forEach((track: MediaStreamTrack) => {
        this.peerConnection?.addTrack(track, this.localStream!);
      });
    }
    return this.peerConnection;
  }

  private setupListeners(): void {
    if (!this.peerConnection) return;
    const pc = this.peerConnection as any;
    pc.onicecandidate = (event: any) => {
      if (event.candidate) {
        this.iceCandidates.push(event.candidate);
        this.onIceCandidate?.(event.candidate);
      }
    };
    pc.oniceconnectionstatechange = () => {
      this.onConnectionStateChange?.(this.peerConnection?.iceConnectionState);
    };
    // Use ontrack (onaddstream is deprecated)
    pc.ontrack = (event: any) => {
      if (event.streams && event.streams.length > 0) {
        this.remoteStream = event.streams[0];
        this.onRemoteStream?.(event.streams[0]);
      }
    };
  }

  async createOffer(): Promise<RTCSessionDescription> {
    if (!this.peerConnection)
      throw new Error("Peer connection not initialized");
    const offer = await this.peerConnection.createOffer({
      offerToReceiveAudio: true,
      offerToReceiveVideo: true,
    });
    if (!offer) throw new Error("Failed to create offer");
    await this.peerConnection.setLocalDescription(offer);
    return this.waitForIceGathering();
  }

  async createAnswer(): Promise<RTCSessionDescription> {
    if (!this.peerConnection)
      throw new Error("Peer connection not initialized");
    const answer = await this.peerConnection.createAnswer();
    if (!answer) throw new Error("Failed to create answer");
    await this.peerConnection.setLocalDescription(answer);
    return this.waitForIceGathering();
  }

  async setRemoteDescription(
    sdp: string,
    type: "offer" | "answer",
  ): Promise<void> {
    if (!this.peerConnection)
      throw new Error("Peer connection not initialized");
    const description = new RTCSessionDescription({ type, sdp });
    await this.peerConnection.setRemoteDescription(description);
  }

  async addIceCandidate(candidate: RTCIceCandidate): Promise<void> {
    if (!this.peerConnection) return;
    try {
      await this.peerConnection.addIceCandidate(candidate);
    } catch (error) {
      console.error("Error adding ICE candidate:", error);
    }
  }

  async addIceCandidates(candidates: RTCIceCandidate[]): Promise<void> {
    for (const candidate of candidates) {
      await this.addIceCandidate(candidate);
    }
  }

  async switchCamera(): Promise<void> {
    if (!this.localStream) return;
    const videoTracks = this.localStream.getVideoTracks();
    if (videoTracks.length > 0) {
      // @ts-ignore
      await videoTracks[0]._switchCamera();
    }
  }

  toggleAudio(enabled: boolean): void {
    if (!this.localStream) return;
    this.localStream.getAudioTracks().forEach((track) => {
      track.enabled = enabled;
    });
  }

  toggleVideo(enabled: boolean): void {
    if (!this.localStream) return;
    this.localStream.getVideoTracks().forEach((track) => {
      track.enabled = enabled;
    });
  }

  getLocalStream(): MediaStream | null {
    return this.localStream;
  }
  getRemoteStream(): MediaStream | null {
    return this.remoteStream;
  }
  getPeerConnection(): RTCPeerConnection | null {
    return this.peerConnection;
  }
  getIceCandidates(): RTCIceCandidate[] {
    return this.iceCandidates;
  }
  isConnected(): boolean {
    return (
      this.peerConnection?.iceConnectionState === "connected" ||
      this.peerConnection?.iceConnectionState === "completed"
    );
  }
  getConnectionState(): string {
    return this.peerConnection?.iceConnectionState || 'new';
  }

  private waitForIceGathering(): Promise<RTCSessionDescription> {
    return new Promise((resolve, reject) => {
      if (!this.peerConnection) {
        reject(new Error("No peer connection"));
        return;
      }
      const timeout = setTimeout(() => {
        resolve(this.peerConnection!.localDescription!);
      }, CALL_CONFIG.ICE_GATHERING_TIMEOUT);
      const checkState = () => {
        if (this.peerConnection?.iceGatheringState === "complete") {
          clearTimeout(timeout);
          resolve(this.peerConnection!.localDescription!);
        } else if (this.peerConnection?.iceGatheringState === "gathering") {
          setTimeout(checkState, 100);
        }
      };
      checkState();
    });
  }

  cleanup(): void {
    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => {
        track.stop();
        (track as any).dispose?.();
      });
      this.localStream = null;
    }
    if (this.peerConnection) {
      this.peerConnection.close();
      this.peerConnection = null;
    }
    this.remoteStream = null;
    this.iceCandidates = [];
  }
}

export const webrtcService = new WebRTCService();
export { RTCView };
export type { RTCIceCandidate, MediaStream };
