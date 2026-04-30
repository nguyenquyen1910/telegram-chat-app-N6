import { Timestamp } from "firebase/firestore";

export type CallType = "voice" | "video";
export type CallStatus =
  | "ringing"
  | "accepted"
  | "ended"
  | "missed"
  | "declined";

export interface CallRecord {
  id: string;
  callerId: string;
  calleeId: string;
  callerName: string;
  calleeName: string;
  callerAvatar: string;
  calleeAvatar: string;
  type: CallType;
  status: CallStatus;
  startedAt: Timestamp | null;
  endedAt: Timestamp | null;
  duration: number;
  livekitRoomName: string;
  createdAt: Timestamp;
}

export type CallDirection = "incoming" | "outgoing";

export interface CallRecordWithDirection extends CallRecord {
  direction: CallDirection;
  otherUserName: string;
  otherUserAvatar: string;
  otherUserId: string;
}
