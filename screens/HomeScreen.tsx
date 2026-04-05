import React, { useEffect, useState } from 'react';
import { ScrollView, View, Text, StyleSheet, SafeAreaView, Pressable, useWindowDimensions } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSpring,
  Easing,
} from 'react-native-reanimated';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
import CompoundingGraph from '@components/CompoundingGraph';
import DeleteHabitModal from '@components/DeleteHabitModal';
import HabitCard, { Habit } from '@components/HabitCard';
import { COLORS, FONTS, calcMultiplier } from '@constants/theme';
import { fetchHabits, fetchEntries, deleteHabit as deleteHabitApi } from '../api/habits';

function AddHabitButton() {
  const scale = useSharedValue(1);
  const pressStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  return (
    <AnimatedPressable
      style={[styles.addBtn, pressStyle]}
      onPress={() => router.push('/habit/add')}
      onPressIn={() => { scale.value = withSpring(0.97, { mass: 0.3, damping: 15, stiffness: 300 }); }}
      onPressOut={() => { scale.value = withSpring(1,    { mass: 0.3, damping: 15, stiffness: 300 }); }}
    >
      <View style={styles.addBtnPlus}><Text style={styles.addBtnPlusText}>+</Text></View>
      <Text style={styles.addBtnLabel}>Add habit</Text>
    </AnimatedPressable>
  );
}

function getCombinedGrowthPct(habits: Habit[]): number {
  const avg = habits.reduce((sum, h) => sum + h.multiplier, 0) / habits.length;
  return (avg - 1) * 100;
}

function buildAvgGraphData(habits: Habit[]): number[] {
  if (habits.length === 0) return [1.0];
  return habits.map(h => h.multiplier);
}

function computeHabitStats(logMap: Record<string, 'done' | 'missed'>): { multiplier: number; streak: number; last7: boolean[] } {
  const wins = Object.values(logMap).filter(s => s === 'done').length;
  const losses = Object.values(logMap).filter(s => s === 'missed').length;
  const multiplier = calcMultiplier(wins, losses);

  // streak: count consecutive 'done' days going backward from today
  let streak = 0;
  const today = new Date();
  for (let i = 0; ; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    if (logMap[key] === 'done') streak++;
    else break;
  }

  // last7: true = done for each of last 7 days (oldest first)
  const last7: boolean[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    last7.push(logMap[key] === 'done');
  }

  return { multiplier, streak, last7 };
}

function useFadeSlideIn(delayMs: number) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(10);
  useEffect(() => {
    opacity.value = withDelay(delayMs, withTiming(1, { duration: 320, easing: Easing.out(Easing.cubic) }));
    translateY.value = withDelay(delayMs, withTiming(0, { duration: 320, easing: Easing.out(Easing.cubic) }));
  }, []);
  return useAnimatedStyle(() => ({ opacity: opacity.value, transform: [{ translateY: translateY.value }] }));
}

export default function HomeScreen() {
  const { height: windowH } = useWindowDimensions();
  const [habits, setHabits] = useState<Habit[]>([]);
  const [isEditMode, setIsEditMode] = useState(false);
  const [habitToDelete, setHabitToDelete] = useState<Habit | null>(null);

  useEffect(() => {
    fetchHabits().then(async rows => {
      const loaded: Habit[] = await Promise.all(
        rows.map(async row => {
          const logMap = await fetchEntries(row.id);
          const { multiplier, streak, last7 } = computeHabitStats(logMap);
          return { id: row.id, name: row.name, multiplier, streak, last7 };
        })
      );
      setHabits(loaded);
    }).catch(() => {});
  }, []);

  const avgData = buildAvgGraphData(habits);
  const combinedPct = getCombinedGrowthPct(habits);
  const isPositive = combinedPct >= 0;
  const pctLabel = `${isPositive ? '+' : ''}${combinedPct.toFixed(0)}%`;

  const headerStyle = useFadeSlideIn(0);
  const graphStyle  = useFadeSlideIn(80);
  const listStyle   = useFadeSlideIn(160);

  function confirmDelete() {
    if (!habitToDelete) return;
    const id = habitToDelete.id;
    setHabits(prev => prev.filter(h => h.id !== id));
    setHabitToDelete(null);
    if (habits.length <= 1) setIsEditMode(false);
    deleteHabitApi(id).catch(() => {});
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <Animated.View style={[styles.header, headerStyle]}>
          <Text style={styles.title}>Compounding Habits</Text>
          <Text style={styles.intro}>
            <Text style={styles.introMuted}>I have been growing </Text>
            <Text style={[styles.introUnderline, { textDecorationColor: isPositive ? COLORS.win : COLORS.loss }]}>{pctLabel}</Text>
            <Text style={styles.introMuted}> of total </Text>
            <Text style={styles.introUnderline}>{habits.length} habits</Text>
            <Text style={styles.introMuted}>{'. The changes may be invisible at first, but I will see the compound effects and my transformation soon!'}</Text>
          </Text>
        </Animated.View>

        {/* Graph — full width, acts as divider */}
        <Animated.View style={graphStyle}>
          <CompoundingGraph data={avgData} height={Math.round(windowH * 0.24)} />
        </Animated.View>

        {/* Habits section */}
        <Animated.View style={listStyle}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Habits</Text>
            <View style={styles.sectionRight}>
              <Text style={styles.sectionCount}>{habits.length}</Text>
              <Pressable
                onPress={() => setIsEditMode(e => !e)}
                hitSlop={10}
                style={styles.editBtn}
              >
                {isEditMode
                  ? <Text style={styles.editDoneText}>Done</Text>
                  : <Feather name="edit-2" size={16} color={COLORS.textMuted} />
                }
              </Pressable>
            </View>
          </View>

          {habits.map((habit, i) => (
            <HabitCard
              key={habit.id}
              habit={habit}
              index={i}
              isEditMode={isEditMode}
              onDelete={() => setHabitToDelete(habit)}
            />
          ))}

          {/* Add habit */}
          {!isEditMode && <AddHabitButton />}
        </Animated.View>

        <View style={{ height: 48 }} />
      </ScrollView>

      <DeleteHabitModal
        habit={habitToDelete}
        onConfirm={confirmDelete}
        onCancel={() => setHabitToDelete(null)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: COLORS.bg },
  scroll: { flex: 1 },
  header: {
    paddingHorizontal: 20,
    paddingTop: 28,
    paddingBottom: 20,
  },
  title: {
    color: COLORS.text,
    fontSize: 40,
    fontFamily: FONTS.heading.bold,
    letterSpacing: -0.8,
    marginBottom: 12,
  },
  intro: {
    fontSize: 20,
    lineHeight: 30,
    letterSpacing: -0.3,
    marginBottom: 10,
  },
  introMuted: {
    color: COLORS.textMuted,
    fontFamily: FONTS.heading.regular,
    fontSize: 20,
  },
  introUnderline: {
    color: COLORS.text,
    fontFamily: FONTS.heading.regular,
    fontSize: 20,
    textDecorationLine: 'underline',
    textDecorationColor: COLORS.text,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 4,
  },
  sectionTitle: {
    color: COLORS.text,
    fontSize: 26,
    fontFamily: FONTS.heading.semiBold,
    letterSpacing: -0.3,
  },
  sectionRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  sectionCount: {
    color: COLORS.textMuted,
    fontSize: 14,
    fontFamily: FONTS.body.regular,
    fontVariant: ['tabular-nums'],
  },
  editBtn: {
    padding: 4,
  },
  editDoneText: {
    color: COLORS.win,
    fontSize: 14,
    fontFamily: FONTS.body.medium,
    letterSpacing: -0.1,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 4,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderStyle: 'dashed',
    gap: 12,
  },
  addBtnPlus: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: COLORS.bgCard,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBtnPlusText: {
    color: COLORS.textMuted,
    fontSize: 18,
    lineHeight: 22,
    fontFamily: FONTS.body.light,
  },
  addBtnLabel: {
    color: COLORS.textMuted,
    fontSize: 15,
    fontFamily: FONTS.body.medium,
    letterSpacing: -0.1,
  },
});
