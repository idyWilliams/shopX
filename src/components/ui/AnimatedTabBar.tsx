import { View, TouchableOpacity, Platform } from 'react-native';
import Animated, { useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function AnimatedTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const bottomPadding = Math.max(insets.bottom, 6);

  return (
    <View
      className="absolute left-4 right-4 flex-row items-center justify-around rounded-full bg-zinc-900 border border-zinc-800"
      style={{
        height: 64,
        bottom: bottomPadding + 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.4,
        shadowRadius: 16,
        elevation: 12,
      }}
    >
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const label =
          options.tabBarLabel !== undefined
            ? options.tabBarLabel
            : options.title !== undefined
              ? options.title
              : route.name;

        const isFocused = state.index === index;

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });
          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        const onLongPress = () => {
          navigation.emit({
            type: 'tabLongPress',
            target: route.key,
          });
        };

        const animatedStyle = useAnimatedStyle(() => ({
          transform: [{ scale: withSpring(isFocused ? 1.1 : 1, { damping: 15, stiffness: 200 }) }],
        }));

        const textAnimatedStyle = useAnimatedStyle(() => ({
          color: isFocused ? '#0ea5e9' : '#71717a',
          transform: [{ scale: withSpring(isFocused ? 1 : 0.92, { damping: 15, stiffness: 200 }) }],
        }));

        return (
          <TouchableOpacity
            key={index}
            onPress={onPress}
            onLongPress={onLongPress}
            className="items-center justify-center flex-1 py-1"
            activeOpacity={0.7}
          >
            <Animated.View style={animatedStyle}>
              {options.tabBarIcon &&
                options.tabBarIcon({
                  focused: isFocused,
                  color: isFocused ? '#0ea5e9' : '#71717a',
                  size: 22,
                })}
            </Animated.View>
            <Animated.Text
              style={[
                { fontSize: 10, marginTop: 3, fontWeight: '600', letterSpacing: 0.2 },
                textAnimatedStyle,
              ]}
            >
              {label as string}
            </Animated.Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}
