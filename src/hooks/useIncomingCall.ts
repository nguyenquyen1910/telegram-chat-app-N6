import { db } from "@/config/firebase";
import { useAuth } from "@/context/AuthContext";
import { CallRecord } from "@/types/call";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { useEffect, useState } from "react";

export function useIncomingCall() {
  const { user } = useAuth();
  const [incomingCall, setIncomingCall] = useState<CallRecord | null>(null);

  useEffect(() => {
    if (!user?.uid || !db) return;

    const q = query(
      collection(db, "calls"),
      where("calleeId", "==", user.uid),
      where("status", "==", "ringing"),
    );

    const unsub = onSnapshot(q, (snap) => {
      if (snap.empty) {
        setIncomingCall(null);
        return;
      }

      const calls = snap.docs.map(
        (doc) =>
          ({
            id: doc.id,
            ...doc.data(),
          }) as CallRecord,
      );

      calls.sort(
        (a, b) =>
          (b.createdAt?.toMillis() ?? 0) - (a.createdAt?.toMillis() ?? 0),
      );
      setIncomingCall(calls[0]);
    });

    return unsub;
  }, [user?.uid]);
  return { incomingCall };
}
