import { Stack } from "expo-router";

export default function CallsLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen
        name="incoming"
        options={{ presentation: "fullScreenModal", animation: "fade" }}
      />
      <Stack.Screen
        name="outgoing"
        options={{ presentation: "fullScreenModal", animation: "fade" }}
      />
    </Stack>
  );
}
