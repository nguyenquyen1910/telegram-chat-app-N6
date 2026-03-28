import { Stack } from 'expo-router';

export default function ChatLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{ title: 'Chats', headerShown: true }}
      />
      <Stack.Screen
        name="[chatId]"
        options={{ title: 'Chat', headerShown: true }}
      />
    </Stack>
  );
}
