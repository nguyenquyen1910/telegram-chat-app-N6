import React, { useEffect, useState, useRef, useMemo } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  Vibration,
  StatusBar,
  Animated,
  Easing,
  Dimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/config/firebase";
import { updateCallStatus } from "@/services/callService";
import { CallRecord } from "@/types/call";
import { getRandomCallTheme } from "@/utils/callTheme";
import { useLivekitRoom } from "@/hooks/useLivekitRoom";
import { requestCallPermissions } from "@/utils/callPermissions";
import { LiveKitRoom } from "@livekit/react-native";

const { width: SCREEN_W } = Dimensions.get("window");
const AVATAR_SIZE = 130;
const VIBRATION_PATTERN = [0, 1000, 1000];

function PulseRing({ delay }: { delay: number }) {
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
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, []);

  const scale = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.65],
  });
  const opacity = anim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.45, 0.2, 0],
  });

  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: "absolute",
        width: AVATAR_SIZE,
        height: AVATAR_SIZE,
        borderRadius: AVATAR_SIZE / 2,
        backgroundColor: "rgba(160,140,230,0.5)",
        transform: [{ scale }],
        opacity,
      }}
    />
  );
}

function RequestingText() {
  const [dots, setDots] = useState("·");
  useEffect(() => {
    const id = setInterval(() => {
      setDots((d) => (d.length >= 3 ? "·" : d + "·"));
    }, 400);
    return () => clearInterval(id);
  }, []);

  return (
    <Text style={styles.statusText}>
      Requesting <Text style={{ letterSpacing: 3 }}>{dots}</Text>
    </Text>
  );
}

function ControlBtn({
  icon,
  label,
  red = false,
  disabled = false,
  onPress,
}: {
  icon: string;
  label: string;
  red?: boolean;
  disabled?: boolean;
  onPress: () => void;
}) {
  const bg = red ? "#FF3B30" : "rgba(255,255,255,0.18)";
  return (
    <TouchableOpacity
      style={styles.controlBtn}
      onPress={onPress}
      activeOpacity={0.7}
      disabled={disabled}
    >
      <View
        style={[
          styles.controlCircle,
          { backgroundColor: bg, opacity: disabled ? 0.5 : 1 },
        ]}
      >
        <Ionicons name={icon as any} size={26} color="#fff" />
      </View>
      <Text style={styles.controlLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

function IncomingCallContent({
  call,
  onDecline,
  onAccept,
  isAccepting,
  theme,
  isPreview,
  isVideo
}: {
  call: CallRecord,
  onDecline: () => void,
  onAccept: () => void,
  isAccepting: boolean,
  theme: any,
  isPreview: boolean,
  isVideo: boolean
}) {
  const {
    isMuted,
    isVideoEnabled,
    toggleMute,
    toggleVideo,
  } = useLivekitRoom(null, "", false);

  const [isSpeaker, setIsSpeaker] = useState(false);

  return (
    <LinearGradient colors={theme.colors} style={styles.container}>
      <StatusBar
        barStyle="light-content"
        translucent
        backgroundColor="transparent"
      />

      <View style={styles.topBar}>
        <TouchableOpacity onPress={onDecline} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={22} color="#fff" />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.avatarSection}>
        <View style={styles.rippleWrapper}>
          <PulseRing delay={0} />
          <PulseRing delay={600} />
          <PulseRing delay={1200} />
          {isPreview ? (
            <Image
              source={require("../../../assets/images/valverde.png")}
              style={styles.avatar}
            />
          ) : call.callerAvatar ? (
            <Image source={{ uri: call.callerAvatar }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarInitial}>
                {call.callerName?.charAt(0)?.toUpperCase()}
              </Text>
            </View>
          )}
        </View>

        <Text style={styles.callerName}>{call.callerName}</Text>
        <RequestingText />
      </View>

      <View style={styles.bottomArea}>
        <View style={styles.controlRow}>
          <ControlBtn
            icon={isSpeaker ? "volume-high" : "volume-medium"}
            label="speaker"
            onPress={() => setIsSpeaker(!isSpeaker)}
          />
          {isVideo && (
            <ControlBtn 
              icon={isVideoEnabled ? "videocam" : "videocam-off"} 
              label="video" 
              onPress={toggleVideo} 
            />
          )}
          <ControlBtn
            icon={isMuted ? "mic-off" : "mic"}
            label="mute"
            onPress={toggleMute}
          />
          <ControlBtn icon="close" label="end" red onPress={onDecline} />
        </View>

        <TouchableOpacity
          style={[styles.acceptBtn, isAccepting && { opacity: 0.6 }]}
          onPress={onAccept}
          disabled={isAccepting}
          activeOpacity={0.8}
        >
          <Ionicons
            name={call.type === "video" ? "videocam" : "call"}
            size={30}
            color="#fff"
          />
        </TouchableOpacity>
        <Text style={styles.acceptLabel}>
          {call.type === "video" ? "Video" : "Chấp nhận"}
        </Text>
      </View>
    </LinearGradient>
  );
}

export default function IncomingCallScreen() {
  const { callId } = useLocalSearchParams<{ callId: string }>();
  const router = useRouter();
  const [call, setCall] = useState<CallRecord | null>(null);
  const [isAccepting, setIsAccepting] = useState(false);
  const [permissionsGranted, setPermissionsGranted] = useState(false);

  const isPreview = callId === "PREVIEW";
  const isCallAccepted = call?.status === "accepted";
  const isVideo = call?.type === "video";

  const { token, disconnect } = useLivekitRoom(
    isCallAccepted && permissionsGranted ? call?.livekitRoomName || null : null,
    call?.calleeName || "Callee",
    isCallAccepted && permissionsGranted
  );

  const theme = useMemo(() => getRandomCallTheme(), []);

  useEffect(() => {
    if (isPreview) {
      Vibration.vibrate(VIBRATION_PATTERN, true);
      setCall({
        id: "preview",
        callerId: "uid_valverde_seed",
        calleeId: "me",
        callerName: "Federico Valverde",
        calleeName: "Me",
        callerAvatar: "@/assets/images/valverde.jpg",
        calleeAvatar: "",
        type: "voice",
        status: "ringing",
        startedAt: null,
        endedAt: null,
        duration: 0,
        livekitRoomName: "",
        createdAt: null as any,
      });
      return () => Vibration.cancel();
    }
    Vibration.vibrate(VIBRATION_PATTERN, true);
    return () => Vibration.cancel();
  }, [isPreview]);

  useEffect(() => {
    if (isPreview) return;
    if (!callId || !db) return;
    const unsub = onSnapshot(doc(db, "calls", callId), (snap) => {
      if (!snap.exists()) { router.back(); return; }
      const data = { id: snap.id, ...snap.data() } as CallRecord;
      setCall(data);
      if (data.status === "ended" || data.status === "declined") router.back();
    });
    return unsub;
  }, [callId]);

  const handleDecline = async () => {
    Vibration.cancel();
    disconnect();
    if (!isPreview && callId) await updateCallStatus(callId, "declined");
    router.back();
  };

  const handleAccept = async () => {
    if (isPreview) return;
    if (!callId || isAccepting) return;
    const hasPermissions = await requestCallPermissions(isVideo);
    if (!hasPermissions) return;

    setIsAccepting(true);
    setPermissionsGranted(true);
    Vibration.cancel();
    await updateCallStatus(callId, "accepted", { startedAt: true });
  };

  if (!call) return <LinearGradient colors={theme.colors} style={{ flex: 1 }} />;

  const url = process.env.EXPO_PUBLIC_LIVEKIT_URL!;

  return (
    <LiveKitRoom
      serverUrl={url}
      token={token || ""}
      connect={!!token && isCallAccepted && permissionsGranted}
      audio={true}
      video={isVideo}
    >
      <IncomingCallContent 
        call={call}
        onDecline={handleDecline}
        onAccept={handleAccept}
        isAccepting={isAccepting}
        theme={theme}
        isPreview={isPreview}
        isVideo={isVideo}
      />
    </LiveKitRoom>
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
  callerName: {
    fontSize: 28,
    fontWeight: "700",
    color: "#FFFFFF",
    letterSpacing: 0.3,
  },
  statusText: { fontSize: 16, color: "rgba(255,255,255,0.75)" },

  bottomArea: { paddingBottom: 52, alignItems: "center", gap: 20 },
  controlRow: {
    flexDirection: "row",
    justifyContent: "space-evenly",
    width: "100%",
    paddingHorizontal: 8,
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

  acceptBtn: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#34C759",
    alignItems: "center",
    justifyContent: "center",
  },
  acceptLabel: { fontSize: 14, color: "rgba(255,255,255,0.8)" },
});
