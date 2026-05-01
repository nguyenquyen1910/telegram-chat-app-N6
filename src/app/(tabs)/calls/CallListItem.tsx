import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  Animated,
  PanResponder,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { CallRecordWithDirection } from "@/types/call";
import { formatCallTime } from "@/utils/callUtils";

interface Props {
  call: CallRecordWithDirection;
  isEditing?: boolean;
  onPress: (call: CallRecordWithDirection) => void;
  onInfoPress: (call: CallRecordWithDirection) => void;
  onDeletePress?: (call: CallRecordWithDirection) => void;
}

export default function CallListItem({
  call,
  isEditing,
  onPress,
  onInfoPress,
  onDeletePress,
}: Props) {
  const [showDelete, setShowDelete] = useState(false);
  const slideAnim = useRef(new Animated.Value(0)).current;

  const isEditingRef = useRef(isEditing);
  const showDeleteRef = useRef(showDelete);
  const onDeletePressRef = useRef(onDeletePress);

  useEffect(() => { isEditingRef.current = isEditing; }, [isEditing]);
  useEffect(() => { showDeleteRef.current = showDelete; }, [showDelete]);
  useEffect(() => { onDeletePressRef.current = onDeletePress; }, [onDeletePress]);

  useEffect(() => {
    if (!isEditing) {
      setShowDelete(false);
    }
  }, [isEditing]);

  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: showDelete ? -80 : 0,
      useNativeDriver: true,
      bounciness: 2,
      speed: 14,
    }).start();
  }, [showDelete, slideAnim]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        return (
          !!isEditingRef.current &&
          Math.abs(gestureState.dx) > 10 &&
          Math.abs(gestureState.dy) < 10
        );
      },
      onPanResponderMove: (evt, gestureState) => {
        let newX = (showDeleteRef.current ? -80 : 0) + gestureState.dx;
        if (newX > 0) newX = 0;
        if (newX < -200) newX = -200;
        slideAnim.setValue(newX);
      },
      onPanResponderRelease: (evt, gestureState) => {
        if (gestureState.dx < -120) {
          onDeletePressRef.current?.(call);
          Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true }).start();
          setShowDelete(false);
          return;
        }

        const current = showDeleteRef.current;
        let nextShowDelete = current;
        if (gestureState.dx < -20) {
          nextShowDelete = true;
        } else if (gestureState.dx > 20) {
          nextShowDelete = false;
        }

        if (nextShowDelete !== current) {
          setShowDelete(nextShowDelete);
        } else {
          Animated.spring(slideAnim, {
            toValue: current ? -80 : 0,
            useNativeDriver: true,
            bounciness: 2,
            speed: 14,
          }).start();
        }
      },
    }),
  ).current;

  const isMissed = call.status === "missed" || call.status === "declined";
  const nameColor = isMissed ? "#FF3B30" : "#000000";

  const directionIcon =
    call.direction === "outgoing" ? "arrow-up-outline" : "arrow-down-outline";
  const directionColor = isMissed ? "#FF3B30" : "#8E8E93";

  const lowerName = call.otherUserName?.toLowerCase() || "";
  let avatarSource: any = null;

  if (lowerName.includes("mbapp")) {
    avatarSource = require("../../../../assets/images/mbappe.png");
  } else if (lowerName.includes("valverde")) {
    avatarSource = require("../../../../assets/images/valverde.png");
  } else if (lowerName.includes("bellingham")) {
    avatarSource = require("../../../../assets/images/bellingham.png");
  } else if (lowerName.includes("kroo") || lowerName.includes("kros")) {
    avatarSource = require("../../../../assets/images/kross.png");
  } else if (call.otherUserAvatar) {
    avatarSource = { uri: call.otherUserAvatar };
  }

  let subtitle = "Cuộc gọi đến";
  if (call.direction === "outgoing") subtitle = "Cuộc gọi đi";
  else if (isMissed) subtitle = "Cuộc gọi nhỡ";

  return (
    <View style={styles.container}>
      {isEditing && (
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => onDeletePress?.(call)}
        >
          <Text style={styles.actionText}>Delete</Text>
        </TouchableOpacity>
      )}

      <Animated.View
        style={[
          styles.innerContainer,
          { transform: [{ translateX: slideAnim }] },
        ]}
        {...panResponder.panHandlers}
      >
        {isEditing && (
          <TouchableOpacity
            style={styles.deleteBtn}
            onPress={() => setShowDelete(!showDelete)}
          >
            <Animated.View
              style={{
                transform: [{ rotate: showDelete ? "-90deg" : "0deg" }],
              }}
            >
              <Ionicons name="remove-circle" size={24} color="#FF3B30" />
            </Animated.View>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={styles.contentArea}
          onPress={() => onPress(call)}
          activeOpacity={0.6}
        >
          <View style={styles.directionWrap}>
            <Ionicons name={directionIcon} size={14} color={directionColor} />
          </View>

          {avatarSource ? (
            <Image source={avatarSource} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarInitial}>
                {call.otherUserName?.charAt(0)?.toUpperCase() ?? "?"}
              </Text>
            </View>
          )}

          <View style={styles.info}>
            <Text style={[styles.name, { color: nameColor }]} numberOfLines={1}>
              {call.otherUserName}
            </Text>
            <Text style={styles.subText}>{subtitle}</Text>
          </View>
        </TouchableOpacity>

        <View style={styles.right}>
          <Text style={styles.time}>{formatCallTime(call.createdAt)}</Text>
          <TouchableOpacity
            style={styles.infoButton}
            onPress={() => onInfoPress(call)}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Ionicons
              name="information-circle-outline"
              size={24}
              color="#54A5E8"
            />
          </TouchableOpacity>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#FFFFFF",
    overflow: "hidden",
  },
  innerContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "#FFFFFF",
  },
  actionButton: {
    position: "absolute",
    right: 0,
    top: 0,
    bottom: 0,
    width: 80,
    backgroundColor: "#FF3B30",
    justifyContent: "center",
    alignItems: "center",
  },
  actionText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "500",
  },
  deleteBtn: {
    marginRight: 12,
  },
  contentArea: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  directionWrap: {
    width: 18,
    alignItems: "flex-start",
    justifyContent: "center",
    marginRight: 4,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: 12,
  },
  avatarPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#54A5E8",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  avatarInitial: { fontSize: 20, color: "#fff", fontWeight: "600" },
  info: {
    flex: 1,
    justifyContent: "center",
  },
  name: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 2,
  },
  subText: {
    fontSize: 14,
    color: "#8E8E93",
  },
  right: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  time: {
    fontSize: 14,
    color: "#8E8E93",
  },
  infoButton: {
    padding: 2,
  },
});
