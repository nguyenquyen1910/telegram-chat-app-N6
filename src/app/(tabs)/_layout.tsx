import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Image, View, StyleSheet } from 'react-native';
import CustomTabBar from '../../components/CustomTabBar';
import { useChatList } from '@/hooks/useChatList';

export default function TabsLayout() {
  const userAvatar = null;
  const { totalUnreadCount } = useChatList();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#54A5E8',
        tabBarInactiveTintColor: '#8E8E93',
      }}
      tabBar={(props) => <CustomTabBar {...props} />}
    >
      <Tabs.Screen
        name="contacts"
        options={{
          title: 'Danh bạ',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={focused ? "person" : "person-outline"}
              size={size}
              color={color}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="calls"
        options={{
          title: 'Cuộc gọi',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={focused ? "call" : "call-outline"}
              size={size}
              color={color}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="chat"
        options={{
          title: 'Tin nhắn',
          tabBarBadge: totalUnreadCount > 0 ? totalUnreadCount : undefined,
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={focused ? "chatbubbles" : "chatbubbles-outline"}
              size={size}
              color={color}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="settings"
        options={{
          title: 'Cài đặt',
          tabBarIcon: ({ color, size, focused }) => (
            <View style={styles.avatarContainer}>
              {userAvatar ? (
                <View style={[styles.tabAvatar, focused && styles.avatarFocused]}>
                  <Image source={{ uri: userAvatar }} style={styles.tabAvatarImage} />
                </View>
              ) : (
                <Ionicons
                  name={focused ? "person-circle" : "person-circle-outline"}
                  size={size}
                  color={color}
                />
              )}
            </View>
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  avatarContainer: {
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabAvatarImage: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },
  avatarFocused: {
    borderWidth: 2,
    borderColor: '#54A5E8',
  },
});
