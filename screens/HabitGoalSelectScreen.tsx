import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, Pressable } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
} from 'react-native-reanimated';
import { useLocalSearchParams, router } from 'expo-router';
import { COLORS, FONTS } from '@constants/theme';
import { generateHabitGoalOptions } from '../api/generateHabitGoal';
import { createHabit } from '../api/habits';

function FadeIn({ delay = 0, children }: { delay?: number; children: React.ReactNode }) {
  const opacity = useSharedValue(0);
  const ty = useSharedValue(10);
  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: ty.value }],
  }));
  useEffect(() => {
    opacity.value = withDelay(delay, withTiming(1, { duration: 350 }));
    ty.value = withDelay(delay, withTiming(0, { duration: 350 }));
  }, []);
  return <Animated.View style={style}>{children}</Animated.View>;
}

function IntroOption({ sentence, habitName }: { sentence: string; habitName: string }) {
  const [actionPart, identityPart] = sentence.split(' every day to ');
  const action = actionPart?.replace(/^i will /i, '').trim() ?? sentence;
  const identity = identityPart?.trim();

  return (
    <Text style={styles.intro}>
      <Text style={styles.introMuted}>{'I will '}</Text>
      <Text style={styles.introUnderline}>{identity ? action : habitName.toLowerCase()}</Text>
      <Text style={styles.introMuted}>{' every day to '}</Text>
      <Text style={styles.introUnderline}>{identity ?? sentence}</Text>
    </Text>
  );
}

function OptionCard({
  sentence,
  habitName,
  onPress,
  variant,
  extra,
}: {
  sentence: string;
  habitName: string;
  onPress: () => void;
  variant?: 'original';
  extra?: React.ReactNode;
}) {
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => { scale.value = withTiming(0.96, { duration: 100 }); }}
      onPressOut={() => { scale.value = withTiming(1, { duration: 150 }); }}
    >
      <Animated.View style={[styles.card, variant === 'original' && styles.cardOriginal, animStyle]}>
        {extra}
        <IntroOption sentence={sentence} habitName={habitName} />
      </Animated.View>
    </Pressable>
  );
}

export default function HabitGoalSelectScreen() {
  const { name, why, options: optionsParam } = useLocalSearchParams<{ name: string; why: string; options: string }>();
  const [aiOptions, setAiOptions] = useState<string[]>(JSON.parse(optionsParam ?? '[]'));
  const [regenerating, setRegenerating] = useState(false);

  const regenScale = useSharedValue(1);
  const regenStyle = useAnimatedStyle(() => ({ transform: [{ scale: regenScale.value }] }));

  async function handleSelect(aiGoal: string) {
    const habit = await createHabit(name, why, aiGoal);
    router.push({ pathname: '/habit/[id]', params: { id: habit.id, name, why, aiGoal } });
  }

  async function handleRegenerate() {
    if (regenerating) return;
    setRegenerating(true);
    const options = await generateHabitGoalOptions(name, why);
    setAiOptions(options);
    setRegenerating(false);
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <FadeIn delay={0}>
          <Text style={styles.title}>Choose your statement</Text>
          <Text style={styles.subtitle}>Pick the one that feels most true and empowering.</Text>
        </FadeIn>

        {aiOptions.map((option, i) => (
          <FadeIn key={i} delay={80 + i * 80}>
            <OptionCard sentence={option} habitName={name} onPress={() => handleSelect(option)} />
          </FadeIn>
        ))}

        <FadeIn delay={80 + aiOptions.length * 80}>
          <OptionCard
            sentence={why}
            habitName={name}
            variant="original"
            onPress={() => handleSelect(`I will ${name} every day to ${why}`)}
            extra={<Text style={styles.originalLabel}>Your original words</Text>}
          />
        </FadeIn>

        <FadeIn delay={80 + (aiOptions.length + 1) * 80}>
          <View style={styles.actions}>
            <Pressable style={styles.backBtn} onPress={() => router.back()}>
              <Text style={styles.backBtnText}>←</Text>
            </Pressable>
            <Animated.View style={[styles.regenWrapper, regenStyle]}>
              <Pressable
                style={[styles.regenBtn, regenerating && styles.regenBtnDisabled]}
                onPress={handleRegenerate}
                onPressIn={() => { if (!regenerating) regenScale.value = withTiming(0.96, { duration: 100 }); }}
                onPressOut={() => { regenScale.value = withTiming(1, { duration: 150 }); }}
                disabled={regenerating}
              >
                <Text style={styles.regenBtnText}>{regenerating ? 'Regenerating…' : 'Regenerate'}</Text>
              </Pressable>
            </Animated.View>
          </View>
        </FadeIn>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  container: { paddingHorizontal: 20, paddingTop: 32, paddingBottom: 40 },
  title: {
    color: COLORS.text,
    fontSize: 36,
    fontFamily: FONTS.heading.bold,
    letterSpacing: -0.8,
    marginBottom: 8,
  },
  subtitle: {
    color: COLORS.textMuted,
    fontSize: 15,
    fontFamily: FONTS.heading.regular,
    marginBottom: 32,
  },
  card: {
    backgroundColor: COLORS.bg,
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 20,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  cardOriginal: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: COLORS.border,
    marginTop: 8,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 24,
  },
  backBtn: {
    backgroundColor: COLORS.bg,
    borderWidth: 2,
    borderColor: COLORS.win,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backBtnText: {
    color: COLORS.win,
    fontSize: 16,
    fontFamily: FONTS.body.semiBold,
  },
  regenWrapper: {
    flex: 1,
  },
  regenBtn: {
    flex: 1,
    backgroundColor: COLORS.win,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  regenBtnDisabled: {
    backgroundColor: COLORS.neutral,
  },
  regenBtnText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: FONTS.body.semiBold,
    letterSpacing: -0.2,
  },
  originalLabel: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontFamily: FONTS.body.semiBold,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  intro: {
    fontSize: 17,
    lineHeight: 26,
    letterSpacing: -0.2,
  },
  introMuted: {
    color: COLORS.textMuted,
    fontFamily: FONTS.heading.regular,
    fontSize: 17,
  },
  introUnderline: {
    color: COLORS.text,
    fontFamily: FONTS.heading.regular,
    fontSize: 17,
    textDecorationLine: 'underline',
    textDecorationColor: COLORS.text,
  },
});
