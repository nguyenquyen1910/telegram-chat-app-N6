import React, { useState, useCallback, useRef } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  StatusBar,
  TouchableOpacity,
  RefreshControl,
  Animated,
  LayoutChangeEvent,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useCallHistory } from "@/hooks/useCallHistory";
import { CallRecordWithDirection } from "@/types/call";
import { TelegramColors } from "@/constants/colors";
import CallListItem from "./CallListItem";
import DeleteCallModal from "./DeleteCallModal";
import { useRouter } from "expo-router";

export default function CallsScreen() {
  const { calls, isLoading } = useCallHistory();
  const router = useRouter();

  const [isEditing, setIsEditing] = useState(false);
  const [filter, setFilter] = useState<"all" | "missed">("all");
  const [deleteTarget, setDeleteTarget] =
    useState<CallRecordWithDirection | null>(null);

  const slideAnim = useRef(new Animated.Value(0)).current;
  const [segmentWidth, setSegmentWidth] = useState(0);

  const switchFilter = useCallback(
    (next: "all" | "missed") => {
      setFilter(next);
      Animated.spring(slideAnim, {
        toValue: next === "all" ? 0 : segmentWidth,
        useNativeDriver: true,
        speed: 20,
        bounciness: 4,
      }).start();
    },
    [segmentWidth, slideAnim],
  );

  const handleSegmentLayout = useCallback((e: LayoutChangeEvent) => {
    const w = e.nativeEvent.layout.width;
    setSegmentWidth((w - 6) / 2);
  }, []);

  const filteredCalls = calls.filter((c) =>
    filter === "all" ? true : c.status === "missed",
  );

  const handleItemPress = useCallback((call: CallRecordWithDirection) => {
    console.log("[Calls] Call back to", call.otherUserId);
  }, []);

  const handleInfoPress = useCallback(
    (call: CallRecordWithDirection) => {
      router.push({
        pathname: "/(tabs)/chat/user-profile",
        params: {
          userId: call.otherUserId,
          callDate: call.createdAt?.toDate
            ? call.createdAt.toDate().toISOString()
            : String(call.createdAt),
          callType:
            call.direction === "outgoing"
              ? "Outgoing Call"
              : call.status === "missed"
                ? "Missed Call"
                : "Incoming Call",
        },
      });
    },
    [router],
  );

  const handleDeletePress = useCallback((call: CallRecordWithDirection) => {
    setDeleteTarget(call);
  }, []);

  const handleVoiceCall = useCallback((call: CallRecordWithDirection) => {
    console.log("[Calls] Voice call to", call.otherUserId);
  }, []);

  const handleVideoCall = useCallback((call: CallRecordWithDirection) => {
    console.log("[Calls] Video call to", call.otherUserId);
  }, []);

  const renderSeparator = () => (
    <View style={{ height: 0.5, backgroundColor: "#E5E5E5", marginLeft: 76 }} />
  );

  const renderHeader = () => (
    <View style={styles.listHeader}>
      <TouchableOpacity
        style={styles.newCallBtn}
        onPress={() => console.log("Start new call")}
      >
        <View style={styles.callIconWrap}>
          <Ionicons name="call-outline" size={22} color="#54A5E8" />
          <View style={styles.plusBadge}>
            <Ionicons name="add" size={11} color="#54A5E8" strokeWidth={3} />
          </View>
        </View>
        <Text style={styles.newCallText}>Cuộc gọi mới</Text>
      </TouchableOpacity>
      <Text style={styles.sectionTitle}>CUỘC GỌI GẦN ĐÂY</Text>
    </View>
  );

  return (
    <View style={styles.fullContainer}>
      <SafeAreaView style={styles.safeArea} edges={["top"]}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

        <View style={styles.header}>
          <TouchableOpacity
            style={styles.pillBtn}
            onPress={() => setIsEditing(!isEditing)}
          >
            <Text
              style={[styles.pillTextDone, isEditing && { fontWeight: "600" }]}
            >
              {isEditing ? "Xong" : "Sửa"}
            </Text>
          </TouchableOpacity>

          <View style={styles.segmentedControl} onLayout={handleSegmentLayout}>
            <Animated.View
              style={[
                styles.slidingPill,
                { transform: [{ translateX: slideAnim }] },
              ]}
            />
            <TouchableOpacity
              style={styles.segment}
              activeOpacity={0.8}
              onPress={() => switchFilter("all")}
            >
              <Text
                style={[
                  styles.segmentText,
                  filter === "all" && styles.segmentTextActive,
                ]}
              >
                Tất cả
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.segment}
              activeOpacity={0.8}
              onPress={() => switchFilter("missed")}
            >
              <Text
                style={[
                  styles.segmentText,
                  filter === "missed" && styles.segmentTextActive,
                ]}
              >
                Nhỡ
              </Text>
            </TouchableOpacity>
          </View>

          {isEditing ? (
            <TouchableOpacity
              style={styles.pillBtn}
              onPress={() => console.log("Delete all")}
            >
              <Text style={styles.pillText}>Xoá tất cả</Text>
            </TouchableOpacity>
          ) : (
            <View style={{ minWidth: 60 }} />
          )}
        </View>

        <FlatList
          data={filteredCalls}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <CallListItem
              call={item}
              isEditing={isEditing}
              onPress={handleItemPress}
              onInfoPress={handleInfoPress}
              onDeletePress={handleDeletePress}
            />
          )}
          ItemSeparatorComponent={renderSeparator}
          ListHeaderComponent={renderHeader}
          refreshControl={
            <RefreshControl
              refreshing={isLoading}
              colors={[TelegramColors.primary]}
            />
          }
          ListEmptyComponent={
            !isLoading ? (
              <View style={styles.emptyState}>
                <Ionicons name="call-outline" size={64} color="#CCCCCC" />
                <Text style={styles.emptyText}>Không có cuộc gọi gần đây</Text>
              </View>
            ) : null
          }
          style={styles.list}
        />
      </SafeAreaView>

      <DeleteCallModal
        visible={!!deleteTarget}
        contactName={deleteTarget?.otherUserName ?? ""}
        onDeleteForBoth={() => console.log("Delete for both", deleteTarget?.id)}
        onDeleteForMe={() => console.log("Delete for me", deleteTarget?.id)}
        onCancel={() => setDeleteTarget(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  fullContainer: { flex: 1, backgroundColor: "#FFFFFF" },
  safeArea: { flex: 1, backgroundColor: "#FFFFFF" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#FFFFFF",
    zIndex: 10,
  },
  pillBtn: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    minWidth: 60,
    alignItems: "center",
    justifyContent: "center",
  },
  pillText: { fontSize: 15, color: "#FF3B30", fontWeight: "500" },
  pillTextDone: { fontSize: 15, color: "#000000", fontWeight: "500" },
  segmentedControl: {
    flexDirection: "row",
    backgroundColor: "#F2F2F2",
    borderRadius: 20,
    padding: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  segment: {
    width: 80,
    paddingVertical: 6,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1,
  },
  slidingPill: {
    position: "absolute",
    top: 3,
    bottom: 3,
    left: 3,
    width: "50%",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 2,
  },
  segmentText: { fontSize: 14, color: "#000000", fontWeight: "500" },
  segmentTextActive: { fontWeight: "600", color: "#54A5E8" },
  listHeader: { backgroundColor: "#FFFFFF" },
  newCallBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  newCallText: { fontSize: 16, color: "#54A5E8", fontWeight: "400" },
  callIconWrap: {
    width: 26,
    height: 26,
    position: "relative",
  },
  plusBadge: {
    position: "absolute",
    top: 2,
    right: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    width: 13,
    height: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  sectionTitle: {
    fontSize: 13,
    color: "#8E8E93",
    fontWeight: "500",
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "#F7F7F7",
  },
  list: { flex: 1, backgroundColor: "#FFFFFF" },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },
  emptyText: { fontSize: 16, color: "#666666", marginTop: 12 },
});
