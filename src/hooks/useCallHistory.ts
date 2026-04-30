import { useAuth } from "@/context/AuthContext";
import { subscribeToCallHistory } from "@/services/callService";
import { CallRecord, CallRecordWithDirection } from "@/types/call";
import { useEffect, useState } from "react";

export function useCallHistory() {
  const { user } = useAuth();
  const [calls, setCalls] = useState<CallRecordWithDirection[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user?.uid) return;

    const unsub = subscribeToCallHistory(user.uid, (rawCalls: CallRecord[]) => {
      const enriched: CallRecordWithDirection[] = rawCalls.map((call) => {
        const isOutgoing = call.callerId === user.uid;
        return {
          ...call,
          direction: isOutgoing ? "outgoing" : "incoming",
          otherUserName: isOutgoing ? call.calleeName : call.callerName,
          otherUserAvatar: isOutgoing ? call.calleeAvatar : call.callerAvatar,
          otherUserId: isOutgoing ? call.calleeId : call.callerId,
        };
      });
      setCalls(enriched);
      setIsLoading(false);
    });
    return unsub;
  }, [user?.uid]);

  return { calls, isLoading };
}
