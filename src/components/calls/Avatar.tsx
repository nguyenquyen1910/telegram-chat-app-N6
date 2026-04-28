import React from "react";
import { View, Image, StyleSheet, Text } from "react-native";

interface AvatarProps {
  uri?: string;
  name: string;
  size?: number;
  showBorder?: boolean;
  borderColor?: string;
}

export const Avatar: React.FC<AvatarProps> = ({
  uri,
  name,
  size = 80,
  showBorder = true,
  borderColor = "rgba(255, 255, 255, 0.3)",
}) => {
  const initials = name.charAt(0).toUpperCase();

  return (
    <View
      style={[
        styles.container,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: showBorder ? 3 : 0,
          borderColor,
        },
      ]}
    >
      {uri ? (
        <Image
          source={{ uri }}
          style={[
            styles.image,
            { width: size, height: size, borderRadius: size / 2 },
          ]}
        />
      ) : (
        <View
          style={[
            styles.placeholder,
            { width: size, height: size, borderRadius: size / 2 },
          ]}
        >
          <Text style={[styles.initials, { fontSize: size * 0.4 }]}>
            {initials}
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    overflow: "hidden",
  },
  image: {
    resizeMode: "cover",
  },
  placeholder: {
    backgroundColor: "#54A5E8",
    alignItems: "center",
    justifyContent: "center",
  },
  initials: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
});
