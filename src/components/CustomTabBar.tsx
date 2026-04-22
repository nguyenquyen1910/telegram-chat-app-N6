import React, { useEffect } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Dimensions,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { usePathname } from 'expo-router';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const HORIZONTAL_MARGIN = 20;
const BAR_WIDTH = SCREEN_WIDTH - HORIZONTAL_MARGIN * 2;

const TIMING_CONFIG = {
  duration: 350,
  easing: Easing.bezier(0.4, 0.0, 0.2, 1),
};

type TabIconName = React.ComponentProps<typeof Ionicons>['name'];

const TAB_ICONS: Record<string, { focused: TabIconName; unfocused: TabIconName }> = {
  contacts: { focused: 'person', unfocused: 'person-outline' },
  calls: { focused: 'call', unfocused: 'call-outline' },
  chat: { focused: 'chatbubbles', unfocused: 'chatbubbles-outline' },
  settings: { focused: 'person-circle', unfocused: 'person-circle-outline' },
};

function TabItem({
  label,
  routeName,
  isFocused,
  onPress,
  onLongPress,
}: {
  label: string;
  routeName: string;
  isFocused: boolean;
  onPress: () => void;
  onLongPress: () => void;
}) {
  const translateY = useSharedValue(0);
  const scale = useSharedValue(1);

  useEffect(() => {
    if (isFocused) {
      // Bounce up then settle
      translateY.value = withSequence(
        withTiming(-6, { duration: 180, easing: Easing.out(Easing.cubic) }),
        withTiming(-2, { duration: 150, easing: Easing.inOut(Easing.cubic) }),
      );
      scale.value = withSequence(
        withTiming(1.15, { duration: 180, easing: Easing.out(Easing.cubic) }),
        withTiming(1.05, { duration: 150, easing: Easing.inOut(Easing.cubic) }),
      );
    } else {
      translateY.value = withTiming(0, { duration: 200 });
      scale.value = withTiming(1, { duration: 200 });
    }
  }, [isFocused]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  const icons = TAB_ICONS[routeName] || TAB_ICONS.contacts;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={isFocused ? { selected: true } : {}}
      onPress={onPress}
      onLongPress={onLongPress}
      style={styles.tabItem}
    >
      <Animated.View style={[styles.tabContent, animatedStyle]}>
        <Ionicons
          name={isFocused ? icons.focused : icons.unfocused}
          size={24}
          color={isFocused ? '#2196F3' : '#555555'}
        />
        <Text
          style={[
            styles.tabLabel,
            { color: isFocused ? '#2196F3' : '#555555' },
          ]}
        >
          {label}
        </Text>
      </Animated.View>
    </Pressable>
  );
}

export default function CustomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const pathname = usePathname();
  const totalTabs = state.routes.length;
  const tabWidth = BAR_WIDTH / totalTabs;
  const indicatorX = useSharedValue(state.index * tabWidth);
  const indicatorY = useSharedValue(-2);

  useEffect(() => {
    indicatorX.value = withTiming(state.index * tabWidth, TIMING_CONFIG);
    indicatorY.value = withSequence(
      withTiming(-6, { duration: 180, easing: Easing.out(Easing.cubic) }),
      withTiming(-2, { duration: 150, easing: Easing.inOut(Easing.cubic) }),
    );
  }, [state.index, tabWidth]);

  const indicatorStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: indicatorX.value },
      { translateY: indicatorY.value },
    ],
  }));

  // Hide tab bar on nested screens (chat detail, user profile, etc.)
  const isNestedScreen = pathname.includes('/chat/') && pathname !== '/chat' && pathname !== '/chat/';
  if (isNestedScreen) return null;

  return (
    <View style={[styles.wrapper, { bottom: Math.max(insets.bottom, 8) + 4 }]}>
      {/* Multi-layer soft shadow */}
      <View style={styles.shadowOuter} />
      <View style={styles.shadowMiddle} />
      <View style={styles.shadowInner} />
      {/* Main tab bar */}
      <View style={styles.container}>
        {/* Sliding indicator */}
        <Animated.View style={[styles.indicator, { width: tabWidth }, indicatorStyle]}>
          <View style={styles.indicatorInner} />
        </Animated.View>

        {/* Tabs */}
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const label =
            typeof options.tabBarLabel === 'string'
              ? options.tabBarLabel
              : options.title ?? route.name;
          const isFocused = state.index === index;

          return (
            <TabItem
              key={route.key}
              label={label as string}
              routeName={route.name}
              isFocused={isFocused}
              onPress={() => {
                const event = navigation.emit({
                  type: 'tabPress',
                  target: route.key,
                  canPreventDefault: true,
                });
                if (!isFocused && !event.defaultPrevented) {
                  navigation.navigate(route.name, route.params);
                }
              }}
              onLongPress={() => {
                navigation.emit({ type: 'tabLongPress', target: route.key });
              }}
            />
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: HORIZONTAL_MARGIN,
    right: HORIZONTAL_MARGIN,
  },
  shadowOuter: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.04)',
    borderRadius: 48,
    top: -6,
    bottom: -6,
    left: -6,
    right: -6,
  },
  shadowMiddle: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.06)',
    borderRadius: 44,
    top: -3,
    bottom: -3,
    left: -3,
    right: -3,
  },
  shadowInner: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: 41,
    top: -1,
    bottom: -1,
    left: -1,
    right: -1,
  },
  container: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 40,
    paddingVertical: 6,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.12,
        shadowRadius: 8,
      },
      android: {},
    }),
  },
  indicator: {
    position: 'absolute',
    top: 5,
    bottom: 5,
    left: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  indicatorInner: {
    width: '80%',
    height: '100%',
    backgroundColor: 'rgba(84, 165, 232, 0.1)',
    borderRadius: 30,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    zIndex: 1,
  },
  tabContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 3,
  },
});
