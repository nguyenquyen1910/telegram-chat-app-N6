import { db } from "@/config/firebase";
import { CallRecord, CallStatus, CallType } from "@/types/call";
import {
  addDoc,
  collection,
  doc,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";

function getDb() {
  if (!db) throw new Error("Firebase not initialized");
  return db;
}

export function subscribeToCallHistory(
  uid: string,
  callback: (calls: CallRecord[]) => void,
): () => void {
  const firestore = getDb();
  const callsRef = collection(firestore, "calls");

  const results: { asCallee: CallRecord[]; asCaller: CallRecord[] } = {
    asCallee: [],
    asCaller: [],
  };

  const merge = () => {
    const all = [...results.asCaller, ...results.asCallee];
    const map = new Map(all.map((c) => [c.id, c]));
    const sorted = Array.from(map.values()).sort((a, b) => {
      const ta = a.createdAt?.toMillis() ?? 0;
      const tb = b.createdAt?.toMillis() ?? 0;
      return tb - ta;
    });
    callback(sorted);
  };

  const q1 = query(
    callsRef,
    where("callerId", "==", uid),
    orderBy("createdAt", "desc"),
    limit(50),
  );

  const q2 = query(
    callsRef,
    where("calleeId", "==", uid),
    orderBy("createdAt", "desc"),
    limit(50),
  );

  const unsub1 = onSnapshot(q1, (snap) => {
    results.asCaller = snap.docs.map(
      (d) => ({ id: d.id, ...d.data() }) as CallRecord,
    );
    merge();
  });

  const unsub2 = onSnapshot(q2, (snap) => {
    results.asCallee = snap.docs.map(
      (d) => ({ id: d.id, ...d.data() }) as CallRecord,
    );
    merge();
  });

  return () => {
    unsub1();
    unsub2();
  };
}

export async function createCall(params: {
  callerId: string;
  calleeId: string;
  callerName: string;
  calleeName: string;
  callerAvatar: string;
  calleeAvatar: string;
  type: CallType;
}): Promise<string> {
  const firestore = getDb();
  const roomName = `call_${params.callerId}_${params.calleeId}_${Date.now()}`;

  const docRef = await addDoc(collection(firestore, "calls"), {
    ...params,
    status: "ringing" as CallStatus,
    startedAt: null,
    endedAt: null,
    duration: 0,
    livekitRoomName: roomName,
    createdAt: serverTimestamp(),
  });

  return docRef.id;
}

export async function updateCallStatus(
  callId: string,
  status: CallStatus,
  extras?: { startedAt?: boolean; endedAt?: boolean; duration?: number },
): Promise<void> {
  const firestore = getDb();
  const callRef = doc(firestore, "calls", callId);

  const updateData: Record<string, any> = { status };
  if (extras?.startedAt) updateData.startedAt = serverTimestamp();
  if (extras?.endedAt) updateData.endedAt = serverTimestamp();
  if (extras?.duration !== undefined) updateData.duration = extras.duration;

  await updateDoc(callRef, updateData);
}
