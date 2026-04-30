import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  Modal,
  Pressable,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { CallRecordWithDirection } from "@/types/call";
import { formatCallTime, formatCallDuration } from "@/utils/callUtils";

interface Props {
  call: CallRecordWithDirection | null;
  visible: boolean;
  onClose: () => void;
  onVoiceCall: (call: CallRecordWithDirection) => void;
  onVideoCall: (call: CallRecordWithDirection) => void;
}

export default function CallDetailModal({
  call,
  visible,
  onClose,
  onVoiceCall,
  onVideoCall,
}: Props) {
  if (!call) return null;

  const isMissed = call.status === "missed" || call.status === "declined";

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View style={styles.sheet}>
        <View style={styles.handle} />

        <View style={styles.userSection}>
          {call.otherUserAvatar ? (
            <Image
              source={{ uri: call.otherUserAvatar }}
              style={styles.avatar}
            />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarInitial}>
                {call.otherUserName?.charAt(0)?.toUpperCase() ?? "?"}
              </Text>
            </View>
          )}
          <Text style={styles.userName}>{call.otherUserName}</Text>
        </View>

        <View style={styles.detailSection}>
          <DetailRow
            icon={call.type === "video" ? "videocam-outline" : "call-outline"}
            label={call.type === "video" ? "Cuộc gọi video" : "Cuộc gọi thoại"}
            value={
              call.direction === "outgoing"
                ? `Đi · ${formatCallTime(call.createdAt)}`
                : isMissed
                  ? `Nhỡ · ${formatCallTime(call.createdAt)}`
                  : `Đến · ${formatCallTime(call.createdAt)}`
            }
            valueColor={
              isMissed && call.direction === "incoming" ? "#FF3B30" : "#8E8E93"
            }
          />
          {call.status === "ended" && call.duration > 0 && (
            <DetailRow
              icon="time-outline"
              label="Thời lượng"
              value={formatCallDuration(call.duration)}
            />
          )}
        </View>

        <View style={styles.actions}>
          <ActionButton
            icon="call"
            label="Gọi thoại"
            color="#34C759"
            onPress={() => {
              onClose();
              onVoiceCall(call);
            }}
          />
          <ActionButton
            icon="videocam"
            label="Gọi video"
            color="#54A5E8"
            onPress={() => {
              onClose();
              onVideoCall(call);
            }}
          />
        </View>

        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <Text style={styles.closeText}>Đóng</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
}

function DetailRow({
  icon,
  label,
  value,
  valueColor = "#8E8E93",
}: {
  icon: any;
  label: string;
  value: string;
  valueColor?: string;
}) {
  return (
    <View style={styles.detailRow}>
      <Ionicons name={icon} size={20} color="#54A5E8" />
      <View style={{ marginLeft: 12 }}>
        <Text style={styles.detailLabel}>{label}</Text>
        <Text style={[styles.detailValue, { color: valueColor }]}>{value}</Text>
      </View>
    </View>
  );
}

function ActionButton({
  icon,
  label,
  color,
  onPress,
}: {
  icon: any;
  label: string;
  color: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity style={styles.actionButton} onPress={onPress}>
      <View style={[styles.actionIcon, { backgroundColor: color }]}>
        <Ionicons name={icon} size={26} color="#fff" />
      </View>
      <Text style={styles.actionLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)" },
  sheet: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingBottom: 40,
    paddingHorizontal: 20,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#E0E0E0",
    alignSelf: "center",
    marginTop: 10,
    marginBottom: 20,
  },
  userSection: { alignItems: "center", marginBottom: 24 },
  avatar: { width: 72, height: 72, borderRadius: 36, marginBottom: 12 },
  avatarPlaceholder: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#54A5E8",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  avatarInitial: { fontSize: 28, color: "#fff", fontWeight: "600" },
  userName: { fontSize: 20, fontWeight: "600", color: "#000" },
  detailSection: {
    borderTopWidth: 0.5,
    borderBottomWidth: 0.5,
    borderColor: "#E5E5E5",
    paddingVertical: 8,
    marginBottom: 24,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
  },
  detailLabel: { fontSize: 15, color: "#000", fontWeight: "500" },
  detailValue: { fontSize: 13, marginTop: 2 },
  actions: {
    flexDirection: "row",
    justifyContent: "space-evenly",
    marginBottom: 20,
  },
  actionButton: { alignItems: "center", gap: 8 },
  actionIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
  },
  actionLabel: { fontSize: 13, color: "#000" },
  closeButton: {
    alignItems: "center",
    paddingVertical: 14,
    borderTopWidth: 0.5,
    borderColor: "#E5E5E5",
  },
  closeText: { fontSize: 17, color: "#54A5E8", fontWeight: "500" },
});
