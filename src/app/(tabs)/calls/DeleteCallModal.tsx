import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Animated,
  Dimensions,
} from "react-native";

const SCREEN_HEIGHT = Dimensions.get("window").height;

interface Props {
  visible: boolean;
  contactName: string;
  onDeleteForBoth: () => void;
  onDeleteForMe: () => void;
  onCancel: () => void;
}

export default function DeleteCallModal({
  visible,
  contactName,
  onDeleteForBoth,
  onDeleteForMe,
  onCancel,
}: Props) {
  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const backdropAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          useNativeDriver: true,
          bounciness: 2,
          speed: 14,
        }),
        Animated.timing(backdropAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: SCREEN_HEIGHT,
          duration: 220,
          useNativeDriver: true,
        }),
        Animated.timing(backdropAnim, {
          toValue: 0,
          duration: 220,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, slideAnim, backdropAnim]);

  const handleAction = (fn: () => void) => {
    onCancel();
    setTimeout(fn, 250);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
    >
      <TouchableWithoutFeedback onPress={onCancel}>
        <Animated.View style={[styles.backdrop, { opacity: backdropAnim }]} />
      </TouchableWithoutFeedback>

      <Animated.View
        style={[
          styles.sheetWrapper,
          { transform: [{ translateY: slideAnim }] },
        ]}
      >
        <View style={styles.actionGroup}>
          <Text style={styles.title}>
            Bạn có muốn xoá thông tin cuộc gọi này không?
          </Text>

          <View style={styles.divider} />

          <TouchableOpacity
            style={styles.actionRow}
            activeOpacity={0.6}
            onPress={() => handleAction(onDeleteForBoth)}
          >
            <Text style={styles.actionTextDestructive}>
              Xoá đối với tôi và {contactName}
            </Text>
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity
            style={styles.actionRow}
            activeOpacity={0.6}
            onPress={() => handleAction(onDeleteForMe)}
          >
            <Text style={styles.actionTextDestructive}>Xoá đối với tôi</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.cancelGroup}
          activeOpacity={0.7}
          onPress={onCancel}
        >
          <Text style={styles.cancelText}>Huỷ</Text>
        </TouchableOpacity>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  sheetWrapper: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 8,
    paddingBottom: 32,
    gap: 8,
  },
  actionGroup: {
    backgroundColor: "#F2F2F7",
    borderRadius: 14,
    overflow: "hidden",
  },
  title: {
    textAlign: "center",
    fontSize: 13,
    color: "#8E8E93",
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
  },
  divider: {
    height: 0.5,
    backgroundColor: "#C4C4C6",
    marginLeft: 16,
  },
  actionRow: {
    paddingVertical: 18,
    alignItems: "center",
  },
  actionTextDestructive: {
    fontSize: 17,
    color: "#FF3B30",
  },
  cancelGroup: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    paddingVertical: 18,
    alignItems: "center",
  },
  cancelText: {
    fontSize: 17,
    color: "#007AFF",
    fontWeight: "600",
  },
});
