import React, { useEffect, useState, useRef, useMemo } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  StatusBar,
  Animated,
  Easing,
  Dimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/config/firebase";
import { updateCallStatus } from "@/services/callService";
import { CallRecord } from "@/types/call";
import { getRandomCallTheme } from "@/utils/callTheme";

const { width: SCREEN_W } = Dimensions.get("window");
const AVATAR_SIZE = 130;

function PulseRing({
  delay,
  color,
}: {
  delay: number;
  color: string;
}) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(anim, {
          toValue: 1,
          duration: 1800,
          useNativeDriver: true,
          easing: Easing.out(Easing.ease),
        }),
        Animated.timing(anim, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);

  const scale = anim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.65] });
  const opacity = anim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.5, 0.25, 0] });

  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: "absolute",
        width: AVATAR_SIZE,
        height: AVATAR_SIZE,
        borderRadius: AVATAR_SIZE / 2,
        backgroundColor: color,
        transform: [{ scale }],
        opacity,
      }}
    />
  );
}

function ControlBtn({
  icon,
  label,
  active = false,
  red = false,
  onPress,
  iconLib = "ionicons",
}: {
  icon: string;
  label: string;
  active?: boolean;
  red?: boolean;
  onPress: () => void;
  iconLib?: "ionicons" | "material";
}) {
  const bg = red ? "#FF3B30" : "rgba(255,255,255,0.18)";
  return (
    <TouchableOpacity style={styles.controlBtn} onPress={onPress} activeOpacity={0.7}>
      <View style={[styles.controlCircle, { backgroundColor: bg }]}>
        {iconLib === "material" ? (
          <MaterialIcons name={icon as any} size={26} color="#fff" />
        ) : (
          <Ionicons name={icon as any} size={26} color="#fff" />
        )}
      </View>
      <Text style={styles.controlLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

export default function OutgoingCallScreen() {
  const { callId } = useLocalSearchParams<{ callId: string }>();
  const router = useRouter();
  const isPreview = callId === 'PREVIEW';

  const MOCK_CALL: CallRecord = {
    id: 'preview',
    callerId: 'me',
    calleeId: 'uid_mbappe_seed',
    callerName: 'Me',
    calleeName: 'Kylian Mbappé',
    callerAvatar: '',
    calleeAvatar: 'https://res.cloudinary.com/dvfwvnq88/image/upload/v1777688800/geg3cpf35hzhzx32r6i2.png',
    type: 'voice',
    status: 'ringing',
    startedAt: null,
    endedAt: null,
    duration: 0,
    livekitRoomName: '',
    createdAt: null as any,
  };

  const [call, setCall] = useState<CallRecord | null>(isPreview ? MOCK_CALL : null);
  const [statusText, setStatusText] = useState("Requesting");
  const [elapsed, setElapsed] = useState<number | null>(null);
  const [isSpeaker, setIsSpeaker] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (isPreview) return; // Không fetch Firestore khi preview
    if (!callId || !db) return;
    const unsub = onSnapshot(doc(db, "calls", callId), (snap) => {
      if (!snap.exists()) { router.back(); return; }
      const data = { id: snap.id, ...snap.data() } as CallRecord;
      setCall(data);
      if (data.status === "accepted") {
        setStatusText("");
        if (!timerRef.current) {
          const start = Date.now();
          timerRef.current = setInterval(() => {
            setElapsed(Math.floor((Date.now() - start) / 1000));
          }, 1000);
        }
      } else if (data.status === "declined") {
        setStatusText("Đã từ chối");
        setTimeout(() => router.back(), 1500);
      } else if (data.status === "missed" || data.status === "ended") {
        router.back();
      }
    });
    return () => { unsub(); timerRef.current && clearInterval(timerRef.current); };
  }, [callId]);

  useEffect(() => {
    if (isPreview) return; // Không auto missed khi đang preview
    const t = setTimeout(async () => {
      if (callId) { await updateCallStatus(callId, "missed"); router.back(); }
    }, 30_000);
    return () => clearTimeout(t);
  }, [callId]);

  const handleCancel = async () => {
    if (!isPreview && callId) await updateCallStatus(callId, "ended");
    router.back();
  };

  const formatElapsed = (s: number) => {
    const m = Math.floor(s / 60).toString().padStart(2, "0");
    const sec = (s % 60).toString().padStart(2, "0");
    return `${m}:${sec}`;
  };

  const theme = useMemo(() => getRandomCallTheme(), []);

  const isActive = elapsed !== null;
  const gradColors = isActive ? ["#1E6B5B", "#2D8B6A", "#4BA882"] as [string,string,string] : theme.colors;
  const rippleColor = isActive ? "rgba(100,220,170,0.45)" : theme.ripple;

  if (!call) return <LinearGradient colors={gradColors} style={{ flex: 1 }} />;

  return (
    <LinearGradient colors={gradColors} style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      <View style={styles.topBar}>
        <TouchableOpacity onPress={handleCancel} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={22} color="#fff" />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.avatarSection}>
        <View style={styles.rippleWrapper}>
          <PulseRing delay={0}    color={rippleColor} />
          <PulseRing delay={600}  color={rippleColor} />
          <PulseRing delay={1200} color={rippleColor} />
          {call.calleeAvatar ? (
            <Image source={{ uri: call.calleeAvatar }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarInitial}>
                {call.calleeName?.charAt(0)?.toUpperCase()}
              </Text>
            </View>
          )}
        </View>

        <Text style={styles.calleeName}>{call.calleeName}</Text>

        <View style={styles.statusRow}>
          {isActive ? (
            <>
              <Ionicons name="cellular" size={14} color="rgba(255,255,255,0.8)" />
              <Text style={styles.statusText}> {formatElapsed(elapsed!)}</Text>
            </>
          ) : (
            <Text style={styles.statusText}>{statusText} ···</Text>
          )}
        </View>
      </View>

      <View style={styles.controlRow}>
        <ControlBtn
          icon={isSpeaker ? "volume-high" : "volume-medium"}
          label="speaker"
          onPress={() => setIsSpeaker(!isSpeaker)}
          active={isSpeaker}
        />
        <ControlBtn icon="videocam" label="video" onPress={() => {}} />
        <ControlBtn
          icon={isMuted ? "mic-off" : "mic-off"}
          label="mute"
          onPress={() => setIsMuted(!isMuted)}
          active={isMuted}
        />
        <ControlBtn icon="close" label="end" red onPress={handleCancel} />
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  topBar: {
    paddingTop: 60,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
  },
  backBtn: { flexDirection: "row", alignItems: "center", gap: 4 },
  backText: { color: "#fff", fontSize: 17 },

  avatarSection: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 14,
  },
  rippleWrapper: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    alignItems: "center",
    justifyContent: "center",
  },
  avatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    borderWidth: 3,
    borderColor: "rgba(255,255,255,0.35)",
  },
  avatarPlaceholder: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: "rgba(255,255,255,0.35)",
  },
  avatarInitial: { fontSize: 52, color: "#fff", fontWeight: "700" },
  calleeName: { fontSize: 28, fontWeight: "700", color: "#FFFFFF", letterSpacing: 0.3 },
  statusRow: { flexDirection: "row", alignItems: "center" },
  statusText: { fontSize: 16, color: "rgba(255,255,255,0.75)" },

  controlRow: {
    flexDirection: "row",
    justifyContent: "space-evenly",
    paddingHorizontal: 8,
    paddingBottom: 52,
    paddingTop: 24,
  },
  controlBtn: { alignItems: "center", gap: 8, width: SCREEN_W / 5 },
  controlCircle: {
    width: 62,
    height: 62,
    borderRadius: 31,
    alignItems: "center",
    justifyContent: "center",
  },
  controlLabel: { fontSize: 13, color: "rgba(255,255,255,0.75)" },
});
