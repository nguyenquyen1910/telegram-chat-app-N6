import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ImageBackground,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Avatar } from "@/components/calls/Avatar";
import { CallButton } from "@/components/calls/CallButton";
import { IconButton } from "@/components/calls/IconButton";
import { useCall } from "@/hooks/useCall";
import { useAuth } from "@/hooks/useAuth";
import { getUserById } from "@/services/userService";
import { User } from "@/types/chat";
import { CALL_UI } from "@/constants/calls";

export default function OutgoingCallScreen() {
  const router = useRouter();
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const { type = "voice" } = useLocalSearchParams<{
    type?: "voice" | "video";
  }>();
  const { user: currentUser } = useAuth();
  const { initiateCall, endCall, activeCall } = useCall(currentUser?.uid || "");
  const [calling, setCalling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [calleeProfile, setCalleeProfile] = useState<User | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);

  // Fetch callee profile
  useEffect(() => {
    const fetchProfile = async () => {
      if (userId) {
        const profile = await getUserById(userId);
        setCalleeProfile(profile);
      }
      setLoadingProfile(false);
    };
    fetchProfile();
  }, [userId]);

  // Initiate call once on mount
  useEffect(() => {
    const startCall = async () => {
      if (!userId) {
        setError("No user ID provided");
        return;
      }
      try {
        setCalling(true);
        await initiateCall(userId, type as "voice" | "video");
      } catch (err: any) {
        setError(err.message || "Failed to start call");
      }
    };
    startCall();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run once

  // Auto-navigate when call connects
  useEffect(() => {
    if (activeCall && activeCall.metaData.status === "connected") {
      router.replace({
        pathname: "/(tabs)/calls/active/[callId]",
        params: { callId: activeCall.callId },
      });
    }
  }, [activeCall, router]);

  // Navigate back when call ends (activeCall becomes null after calling started)
  useEffect(() => {
    if (!activeCall && calling && !error) {
      router.back();
    }
  }, [activeCall, calling, error, router]);

  const handleEndCall = useCallback(async () => {
    await endCall();
    router.back();
  }, [endCall, router]);

  const calleeName = calleeProfile?.displayName || userId || "Unknown";
  const calleeAvatar = calleeProfile?.avatarUrl || "";

  if (error) {
    return (
      <View style={[styles.container, styles.center]}>
        <Text style={styles.errorText}>{error}</Text>
        <CallButton
          icon="call"
          size={60}
          backgroundColor={CALL_UI.DANGER_COLOR}
          onPress={handleEndCall}
          accessibilityLabel="Kết thúc cuộc gọi"
        />
      </View>
    );
  }

  return (
    <ImageBackground
      source={{
        uri: "https://images.unsplash.com/photo-1557683316-973673baf926?w=1080",
      }}
      style={styles.background}
      blurRadius={80}
    >
      <SafeAreaView style={styles.container}>
        <StatusBar
          barStyle="light-content"
          backgroundColor={CALL_UI.OVERLAY_COLOR}
        />

        {/* Header */}
        <View style={styles.header}>
          <IconButton
            icon="arrow-back"
            size={28}
            color="#FFFFFF"
            onPress={handleEndCall}
            style={styles.headerButton}
            accessibilityLabel="Kết thúc và quay lại"
          />
          <Text style={styles.headerTitle}>Đang gọi...</Text>
          <View style={styles.headerSpacer} />
        </View>

        {/* Avatar */}
        <View style={styles.avatarContainer}>
          {loadingProfile ? (
            <ActivityIndicator size="large" color="#FFFFFF" />
          ) : (
            <Avatar
              uri={calleeAvatar}
              name={calleeName}
              size={120}
              showBorder={true}
              borderColor="rgba(255,255,255,0.4)"
            />
          )}
          <Text style={styles.calleeName}>{calleeName}</Text>
          <Text style={styles.statusText}>
            {calling && !activeCall ? "Đang kết nối..." : "Đang gọi"}
          </Text>
          {activeCall && (
            <Text style={styles.timer}>
              {formatDuration(activeCall.duration)}
            </Text>
          )}
        </View>

        {/* Loading Indicator */}
        {calling && !activeCall && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#FFFFFF" />
            <Text style={styles.loadingText}>Đang thiết lập kết nối...</Text>
          </View>
        )}

        {/* End Call Button */}
        <View style={styles.footer}>
          <CallButton
            icon="call"
            size={70}
            backgroundColor={CALL_UI.DANGER_COLOR}
            onPress={handleEndCall}
            accessibilityLabel="Kết thúc cuộc gọi"
          />
        </View>
      </SafeAreaView>
    </ImageBackground>
  );
}

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    width: "100%",
    height: "100%",
  },
  container: {
    flex: 1,
    backgroundColor: CALL_UI.OVERLAY_COLOR,
  },
  center: {
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerButton: {
    width: 40,
    height: 40,
  },
  headerTitle: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "600",
  },
  headerSpacer: {
    width: 40,
  },
  avatarContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  calleeName: {
    color: "#FFFFFF",
    fontSize: 28,
    fontWeight: "600",
    marginTop: 24,
    textAlign: "center",
  },
  statusText: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 18,
    marginTop: 8,
  },
  timer: {
    color: "#FFFFFF",
    fontSize: 24,
    fontWeight: "500",
    marginTop: 12,
  },
  loadingContainer: {
    alignItems: "center",
    marginTop: 20,
  },
  loadingText: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 16,
    marginTop: 12,
  },
  footer: {
    alignItems: "center",
    paddingBottom: 40,
  },
  errorText: {
    color: CALL_UI.DANGER_COLOR,
    fontSize: 18,
    marginBottom: 30,
    textAlign: "center",
  },
});
