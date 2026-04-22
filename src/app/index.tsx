import { Redirect } from 'expo-router';

export default function Index() {
  // Redirect thẳng vào màn hình Chats khi mở app
  return <Redirect href="/(tabs)/chat" />;
}
