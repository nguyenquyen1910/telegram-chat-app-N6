import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { Stack, useRouter } from "expo-router";
import React, { useEffect } from "react";
import { useColorScheme } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";

import { AnimatedSplashOverlay } from "@/components/animated-icon";
import { AuthProvider } from "@/context/AuthContext";
import { ChatListProvider } from "@/context/ChatListContext";
import {
  NotificationProvider,
  useNotificationListener,
} from "@/hooks/useNotificationListener";
import { useIncomingCall } from "@/hooks/useIncomingCall";

function NotificationSetup() {
  useNotificationListener();
  return null;
}

function IncomingCallDetector() {
  const { incomingCall } = useIncomingCall();
  const router = useRouter();

  useEffect(() => {
    if (incomingCall) {
      router.push({
        pathname: "/(call-screens)/incoming",
        params: { callId: incomingCall.id },
      });
    }
  }, [incomingCall?.id]);

  return null;
}

export default function RootLayout() {
  const colorScheme = useColorScheme();
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AuthProvider>
        <ChatListProvider>
          <NotificationProvider>
            <NotificationSetup />
            <IncomingCallDetector />
            <ThemeProvider
              value={colorScheme === "dark" ? DarkTheme : DefaultTheme}
            >
              <AnimatedSplashOverlay />
              <Stack screenOptions={{ headerShown: false }}>
                <Stack.Screen name="(auth)" options={{ headerShown: false }} />
                <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                <Stack.Screen
                  name="(call-screens)/incoming"
                  options={{ presentation: "fullScreenModal", animation: "fade", headerShown: false }}
                />
                <Stack.Screen
                  name="(call-screens)/outgoing"
                  options={{ presentation: "fullScreenModal", animation: "fade", headerShown: false }}
                />
                <Stack.Screen name="user-profile" options={{ headerShown: false, presentation: "card" }} />
                <Stack.Screen name="group-profile" options={{ headerShown: false, presentation: "card" }} />
              </Stack>
            </ThemeProvider>
          </NotificationProvider>
        </ChatListProvider>
      </AuthProvider>
    </GestureHandlerRootView>
  );
}
