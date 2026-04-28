import {
  collection,
  doc,
  setDoc,
  updateDoc,
  onSnapshot,
  serverTimestamp,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  deleteDoc,
  addDoc,
  arrayUnion,
  arrayRemove,
  getDoc,
} from "firebase/firestore";
import { db } from "@/config/firebase";
import { CallMetadata, CallType } from "@/types/chat";
import { CALL_COLLECTION, CALL_HISTORY_COLLECTION } from "@/constants/calls";

class SignalingService {
  private currentCallId: string | null = null;
  private callUnsubscribers: (() => void)[] = [];
  private historyUnsubscribers: (() => void)[] = [];

  /**
   * Create a new call document in Firestore
   */
  async createCall(
    callerId: string,
    calleeId: string,
    callType: CallType,
  ): Promise<string> {
    const callId = `${callerId}_${calleeId}_${Date.now()}`;

    const callData: Partial<CallMetadata> = {
      id: callId,
      type: callType,
      callerId,
      calleeId,
      status: "ringing",
      direction: "outgoing",
      startedAt: serverTimestamp(),
      iceCandidates: [],
    };

    await setDoc(doc(db!, CALL_COLLECTION, callId), callData);
    this.currentCallId = callId;

    return callId;
  }

  /**
   * Update call with offer SDP
   */
  async setOffer(
    callId: string,
    offerSDP: string,
    iceCandidates: any[],
  ): Promise<void> {
    await updateDoc(doc(db!, CALL_COLLECTION, callId), {
      offerSDP,
      iceCandidates: arrayUnion(...iceCandidates),
    });
  }

  /**
   * Update call with answer SDP
   */
  async setAnswer(
    callId: string,
    answerSDP: string,
    iceCandidates: any[],
  ): Promise<void> {
    await updateDoc(doc(db!, CALL_COLLECTION, callId), {
      answerSDP,
      iceCandidates: arrayUnion(...iceCandidates),
    });
  }

  /**
   * Add ICE candidate to call document
   */
  async addIceCandidate(callId: string, candidate: any): Promise<void> {
    await updateDoc(doc(db!, CALL_COLLECTION, callId), {
      iceCandidates: arrayUnion(candidate),
    });
  }

  /**
   * Accept call (callee)
   */
  async acceptCall(callId: string): Promise<void> {
    await updateDoc(doc(db!, CALL_COLLECTION, callId), {
      status: "connected",
      answeredAt: serverTimestamp(),
    });
  }

  /**
   * End call
   */
  async endCall(callId: string, duration?: number): Promise<void> {
    const callRef = doc(db!, CALL_COLLECTION, callId);
    const updateData: any = {
      status: "ended",
      endedAt: serverTimestamp(),
    };
    if (duration) updateData.duration = duration;
    await updateDoc(callRef, updateData);
    await this.moveCallToHistory(callId);
  }

  /**
   * Reject call
   */
  async rejectCall(callId: string): Promise<void> {
    await updateDoc(doc(db!, CALL_COLLECTION, callId), {
      status: "rejected",
      endedAt: serverTimestamp(),
    });
    await this.moveCallToHistory(callId);
  }

  /**
   * Miss call (caller side when no answer)
   */
  async missCall(callId: string): Promise<void> {
    await updateDoc(doc(db!, CALL_COLLECTION, callId), {
      status: "missed",
      endedAt: serverTimestamp(),
    });
    await this.moveCallToHistory(callId);
  }

  /**
   * Move completed call to history
   */
  private async moveCallToHistory(callId: string): Promise<void> {
    try {
      const callDoc = await getDoc(doc(db!, CALL_COLLECTION, callId));
      if (callDoc.exists()) {
        const callData = callDoc.data();
        const callerId = callData.callerId;
        const calleeId = callData.calleeId;
        const historyData = { ...callData, storedAt: serverTimestamp() };
        await addDoc(
          collection(db!, CALL_HISTORY_COLLECTION, callerId, "calls"),
          historyData,
        );
        await addDoc(
          collection(db!, CALL_HISTORY_COLLECTION, calleeId, "calls"),
          historyData,
        );
        await deleteDoc(doc(db!, CALL_COLLECTION, callId));
      }
    } catch (error) {
      console.error("Error moving call to history:", error);
    }
  }

  /**
   * Subscribe to incoming calls for a user
   * Callback receives (call, event) where event is 'added' | 'modified' | 'removed'
   */
  subscribeToIncomingCalls(
    userId: string,
    callback: (call: CallMetadata, event: 'added' | 'modified' | 'removed') => void,
  ): () => void {
    const q = query(
      collection(db!, CALL_COLLECTION),
      where("calleeId", "==", userId),
      where("status", "==", "ringing"),
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === "added" || change.type === "modified") {
          callback({ id: change.doc.id, ...change.doc.data() } as CallMetadata, change.type as 'added' | 'modified');
        } else if (change.type === "removed") {
          // Pass the last known data for removed call
          callback({ id: change.doc.id, ...change.doc.data() } as CallMetadata, 'removed');
        }
      });
    });
    this.callUnsubscribers.push(unsubscribe);
    return unsubscribe;
  }

  /**
   * Subscribe to specific call updates
   */
  subscribeToCall(
    callId: string,
    callback: (call: CallMetadata) => void,
  ): () => void {
    const unsubscribe = onSnapshot(
      doc(db!, CALL_COLLECTION, callId),
      (docSnap) => {
        if (docSnap.exists()) {
          callback({ id: docSnap.id, ...docSnap.data() } as CallMetadata);
        }
      },
    );
    this.callUnsubscribers.push(unsubscribe);
    return unsubscribe;
  }

  /**
   * Get call history for user
   */
  async getCallHistory(
    userId: string,
    limitCount: number = 50,
  ): Promise<CallMetadata[]> {
    const q = query(
      collection(db!, CALL_HISTORY_COLLECTION, userId, "calls"),
      orderBy("startedAt", "desc"),
      limit(limitCount),
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(
      (doc) => ({ id: doc.id, ...doc.data() }) as CallMetadata,
    );
  }

  /**
   * Subscribe to call history updates
   */
  subscribeToCallHistory(
    userId: string,
    callback: (calls: CallMetadata[]) => void,
  ): () => void {
    const q = query(
      collection(db!, CALL_HISTORY_COLLECTION, userId, "calls"),
      orderBy("startedAt", "desc"),
      limit(100),
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const calls = snapshot.docs.map(
        (doc) => ({ id: doc.id, ...doc.data() }) as CallMetadata,
      );
      callback(calls);
    });
    this.historyUnsubscribers.push(unsubscribe);
    return unsubscribe;
  }

  /**
   * Get call by ID
   */
  async getCall(callId: string): Promise<CallMetadata | null> {
    const docRef = doc(db!, CALL_COLLECTION, callId);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) return null;
    return { id: docSnap.id, ...docSnap.data() } as CallMetadata;
  }

  /**
   * Delete specific call from history
   */
  async deleteCallFromHistory(userId: string, callId: string): Promise<void> {
    await deleteDoc(doc(db!, CALL_HISTORY_COLLECTION, userId, "calls", callId));
  }

  /**
   * Clear all call history for user
   */
  async clearCallHistory(userId: string): Promise<void> {
    const history = await this.getCallHistory(userId, 100);
    const batch = history.map((call) =>
      deleteDoc(doc(db!, CALL_HISTORY_COLLECTION, userId, "calls", call.id)),
    );
    await Promise.all(batch);
  }

  /**
   * Cleanup all subscriptions
   */
  cleanup(): void {
    this.callUnsubscribers.forEach((unsub) => unsub());
    this.callUnsubscribers = [];
    this.historyUnsubscribers.forEach((unsub) => unsub());
    this.historyUnsubscribers = [];
    this.currentCallId = null;
  }

  getCurrentCallId(): string | null {
    return this.currentCallId;
  }
}

export const signalingService = new SignalingService();
