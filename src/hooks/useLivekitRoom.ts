import { useEffect, useState } from "react";
import {
  useRoomContext,
  useLocalParticipant,
  useParticipants,
} from "@livekit/react-native";
import { Track, Room } from "livekit-client";
import { getLivekitToken } from "@/services/livekitService";

export function useLivekitRoom(
  roomName: string | null,
  participantName: string,
  enabled: boolean,
) {
  const [token, setToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const room = useRoomContext();
  const { localParticipant } = useLocalParticipant();
  const participants = useParticipants();

  useEffect(() => {
    if (!enabled || !roomName) return;

    const fetchToken = async () => {
      try {
        const tkn = await getLivekitToken(roomName, participantName);
        setToken(tkn);
      } catch (err) {
        console.error("LiveKit token error:", err);
        setError(err instanceof Error ? err.message : "Token fetch failed");
      }
    };

    fetchToken();
  }, [enabled, roomName, participantName]);

  const toggleMute = async () => {
    if (!localParticipant) return;
    const publication = localParticipant.getTrackPublication(
      Track.Source.Microphone,
    );
    if (publication) {
      if (publication.isMuted) await publication.unmute();
      else await publication.mute();
    }
  };

  const toggleVideo = async () => {
    if (!localParticipant) return;
    const publication = localParticipant.getTrackPublication(
      Track.Source.Camera,
    );
    if (publication) {
      if (publication.isMuted) await publication.unmute();
      else await publication.mute();
    }
  };

  const disconnect = () => {
    room?.disconnect();
  };

  return {
    room,
    token,
    isConnected: room?.state === "connected",
    isMuted:
      localParticipant?.getTrackPublication(Track.Source.Microphone)?.isMuted ??
      false,
    isVideoEnabled: !(
      localParticipant?.getTrackPublication(Track.Source.Camera)?.isMuted ??
      true
    ),
    remoteParticipants: participants.filter(
      (p) => p.sid !== localParticipant?.sid,
    ),
    error,
    toggleMute,
    toggleVideo,
    disconnect,
  };
}
