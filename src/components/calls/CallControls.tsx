import React from "react";
import { View, StyleSheet } from "react-native";
import { IconButton } from "./IconButton";
import { CallButton } from "./CallButton";
import { CALL_UI } from "@/constants/calls";

interface CallControlsProps {
  isMuted: boolean;
  isVideoOff: boolean;
  isSpeakerOn: boolean;
  isFrontCamera: boolean;
  onToggleMute: () => void;
  onToggleVideo: () => void;
  onToggleSpeaker: () => void;
  onSwitchCamera: () => void;
  onEndCall: () => void;
  showVideoControls?: boolean;
  connectionQuality?: "excellent" | "good" | "fair" | "poor";
}

export const CallControls: React.FC<CallControlsProps> = ({
  isMuted,
  isVideoOff,
  isSpeakerOn,
  isFrontCamera,
  onToggleMute,
  onToggleVideo,
  onToggleSpeaker,
  onSwitchCamera,
  onEndCall,
  showVideoControls = true,
  connectionQuality,
}) => {
  return (
    <View style={styles.container}>
      {/* Connection Quality Indicator */}
      {connectionQuality && (
        <View style={styles.connectionQuality}>
          {renderSignalBars(connectionQuality)}
        </View>
      )}

      {showVideoControls && (
        <>
          <View style={styles.row}>
            <IconButton
              icon={isVideoOff ? "videocam-off" : "videocam"}
              size={28}
              color={isVideoOff ? "#FF3B30" : "#FFFFFF"}
              onPress={onToggleVideo}
              style={[
                styles.iconButton,
                {
                  backgroundColor: isVideoOff
                    ? "#FF3B30"
                    : "rgba(255,255,255,0.2)",
                },
              ]}
              accessibilityLabel={isVideoOff ? "Bật camera" : "Tắt camera"}
            />
            <IconButton
              icon={isFrontCamera ? "camera-reverse" : "camera"}
              size={28}
              color="#FFFFFF"
              onPress={onSwitchCamera}
              style={[
                styles.iconButton,
                { backgroundColor: "rgba(255,255,255,0.2)" },
              ]}
              accessibilityLabel="Chuyển camera"
            />
          </View>
          <View style={styles.row}>
            <IconButton
              icon={isMuted ? "mic-off" : "mic"}
              size={28}
              color={isMuted ? "#FF3B30" : "#FFFFFF"}
              onPress={onToggleMute}
              style={[
                styles.iconButton,
                {
                  backgroundColor: isMuted
                    ? "#FF3B30"
                    : "rgba(255,255,255,0.2)",
                },
              ]}
              accessibilityLabel={isMuted ? "Bật microphone" : "Tắt microphone"}
            />
            <IconButton
              icon={isSpeakerOn ? "volume-high" : "volume-mute"}
              size={28}
              color={isSpeakerOn ? "#FFFFFF" : "#FF3B30"}
              onPress={onToggleSpeaker}
              style={[
                styles.iconButton,
                {
                  backgroundColor: isSpeakerOn
                    ? "rgba(255,255,255,0.2)"
                    : "#FF3B30",
                },
              ]}
              accessibilityLabel={isSpeakerOn ? "Tắt loa" : "Bật loa"}
            />
          </View>
        </>
      )}

      <CallButton
        icon="call" // Use 'call' icon - represents phone action
        size={36}
        backgroundColor={CALL_UI.DANGER_COLOR}
        onPress={onEndCall}
        accessibilityLabel="Kết thúc cuộc gọi"
      />
    </View>
  );
};

function renderSignalBars(quality: "excellent" | "good" | "fair" | "poor") {
  const colors: Record<string, string> = {
    excellent: "#21C004",
    good: "#54A5E8",
    fair: "#FF9500",
    poor: "#FF3B30",
  };

  const bars =
    quality === "excellent"
      ? 4
      : quality === "good"
        ? 3
        : quality === "fair"
          ? 2
          : 1;

  return (
    <View style={styles.signalContainer}>
      {[1, 2, 3, 4].map((bar) => (
        <View
          key={bar}
          style={[
            styles.signalBar,
            {
              backgroundColor:
                bar <= bars ? colors[quality] : "rgba(255,255,255,0.2)",
              height: 4 + bar * 3,
            },
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "flex-end",
    paddingBottom: 40,
    gap: 30,
  },
  row: {
    flexDirection: "row",
    gap: 30,
  },
  iconButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: "center",
    justifyContent: "center",
  },
  connectionQuality: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 3,
    marginBottom: 10,
  },
  signalContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "center",
    gap: 3,
    height: 20,
  },
  signalBar: {
    width: 4,
    borderRadius: 2,
  },
});
