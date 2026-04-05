import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Rect } from 'react-native-svg';
import { router } from 'expo-router';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withDelay,
  withRepeat,
  withSequence,
  cancelAnimation,
  Easing,
} from 'react-native-reanimated';
import { Pressable } from 'react-native';
import { COLORS, FONTS, DEBUG_OUTLINES } from '@constants/theme';

export interface Habit {
  id: string;
  name: string;
  multiplier: number;
  streak: number;
  last7: boolean[];
}

interface Props {
  habit: Habit;
  index?: number; // for stagger
  isEditMode?: boolean;
  onDelete?: () => void;
}

const BAR_W = 12;
const BAR_GAP = 3;
const BAR_MAX_H = 24;
const SPARK_W = 7 * (BAR_W + BAR_GAP);

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function HabitCard({ habit, index = 0, isEditMode = false, onDelete }: Props) {
  const isPositive = habit.multiplier >= 1.0;
  const growthPct = ((habit.multiplier - 1) * 100);
  const growthLabel = `${isPositive ? '+' : ''}${growthPct.toFixed(0)}% growth`;

  // Scale on press
  const scale = useSharedValue(1);

  // Staggered enter: fade + slide up
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(12);

  // Wiggle in edit mode
  const rotation = useSharedValue(0);

  useEffect(() => {
    const delay = index * 60;
    opacity.value = withDelay(delay, withTiming(1, { duration: 260, easing: Easing.bezier(0.23, 1, 0.32, 1) }));
    translateY.value = withDelay(delay, withTiming(0, { duration: 260, easing: Easing.bezier(0.23, 1, 0.32, 1) }));
  }, []);

  useEffect(() => {
    if (isEditMode) {
      rotation.value = withDelay(
        index * 40,
        withRepeat(
          withSequence(
            withTiming(-1.8, { duration: 90 }),
            withTiming(1.8, { duration: 90 }),
          ),
          -1,
          true,
        ),
      );
    } else {
      cancelAnimation(rotation);
      rotation.value = withTiming(0, { duration: 150 });
    }
  }, [isEditMode]);

  const pressStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { translateY: translateY.value },
      { rotate: `${rotation.value}deg` },
    ],
    opacity: opacity.value,
  }));

  function onPressIn() {
    scale.value = withSpring(0.96, { mass: 0.3, damping: 15, stiffness: 300 });
  }
  function onPressOut() {
    scale.value = withSpring(1, { mass: 0.3, damping: 15, stiffness: 300 });
  }

  return (
    <View style={styles.wrapper}>
      <AnimatedPressable
        onPress={() => !isEditMode && router.push(`/habit/${habit.id}`)}
        onPressIn={() => !isEditMode && onPressIn()}
        onPressOut={() => !isEditMode && onPressOut()}
        style={[pressStyle]}
      >
        <View style={[styles.card, DEBUG_OUTLINES && styles.debug]}>
          <View style={styles.left}>
            <Text style={styles.name}>{habit.name}</Text>
            {habit.streak > 0 && (
              <Text style={styles.streak}>{habit.streak} day streak</Text>
            )}
          </View>
          <View style={styles.right}>
            <Svg width={SPARK_W} height={BAR_MAX_H + 4} style={styles.spark}>
              {habit.last7.map((done, i) => {
                const barH = done ? BAR_MAX_H : BAR_MAX_H * 0.3;
                return (
                  <Rect
                    key={i}
                    x={i * (BAR_W + BAR_GAP)}
                    y={BAR_MAX_H - barH + 2}
                    width={BAR_W}
                    height={barH}
                    rx={3}
                    fill={done ? '#D1FAE5' : '#FEE2E2'}
                  />
                );
              })}
            </Svg>
            <Text style={[styles.multiplier, { color: isPositive ? COLORS.win : COLORS.loss }]}>
              {growthLabel}
            </Text>
          </View>
        </View>
      </AnimatedPressable>

      {isEditMode && (
        <Pressable style={styles.deleteBtn} onPress={onDelete} hitSlop={6}>
          <View style={styles.deleteBtnCircle}>
            <Text style={styles.deleteBtnX}>✕</Text>
          </View>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'relative',
  },
  card: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    marginHorizontal: 16,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  debug: { borderWidth: 1, borderColor: '#f0f' },
  left: { flex: 1 },
  right: { alignItems: 'flex-end', gap: 6 },
  name: {
    color: COLORS.text,
    fontSize: 16,
    fontFamily: FONTS.body.medium,
    letterSpacing: -0.2,
  },
  streak: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontFamily: FONTS.body.regular,
    marginTop: 2,
  },
  spark: { marginBottom: 2 },
  deleteBtn: {
    position: 'absolute',
    top: -4,
    right: 8,
    zIndex: 10,
  },
  deleteBtnCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: COLORS.loss,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteBtnX: {
    color: '#fff',
    fontSize: 11,
    fontFamily: FONTS.body.bold,
    lineHeight: 14,
  },
  multiplier: {
    fontSize: 15,
    fontFamily: FONTS.heading.semiBold,
    letterSpacing: -0.3,
    fontVariant: ['tabular-nums'],
  },
});
