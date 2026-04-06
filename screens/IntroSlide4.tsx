import React, { useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withDelay,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { FONTS, COLORS } from '@constants/theme';

function useFadeSlideIn(delayMs: number, active: boolean) {
  const opacity    = useSharedValue(0);
  const translateY = useSharedValue(10);
  useEffect(() => {
    if (!active) return;
    opacity.value    = withDelay(delayMs, withTiming(1, { duration: 340, easing: Easing.out(Easing.cubic) }));
    translateY.value = withDelay(delayMs, withTiming(0, { duration: 340, easing: Easing.out(Easing.cubic) }));
  }, [active]);
  return useAnimatedStyle(() => ({ opacity: opacity.value, transform: [{ translateY: translateY.value }] }));
}

export default function IntroSlide4({
  width, height, active,
}: {
  width: number;
  height: number;
  active: boolean;
}) {
  const a0 = useFadeSlideIn(0,   active);
  const a1 = useFadeSlideIn(80,  active);
  const a2 = useFadeSlideIn(160, active);
  const a3 = useFadeSlideIn(240, active);
  const a4 = useFadeSlideIn(320, active);

  return (
    <View style={{ width, height }}>
      <ScrollView
        contentContainerStyle={[s.container, { paddingBottom: 110 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Heading */}
        <Animated.View style={a0}>
          <Text style={s.heading}>The 1% Better Theory</Text>
        </Animated.View>

        {/* Intro body */}
        <Animated.View style={a1}>
          <Text style={s.body}>
            The idea is simple: small improvements of just{' '}
            <Text style={s.highlight}>1% each day</Text>
            {' '}lead to massive results over time due to the power of compounding.
          </Text>

          <Text style={[s.body, { marginTop: 16 }]}>
            On <Text style={s.bold}>Day 0</Text>, you are the baseline — in math, that's{' '}
            <Text style={s.mono}>1</Text>, or 100% of yourself.{'\n'}
            On <Text style={s.bold}>Day 1</Text>, you show up and add 1%, becoming{' '}
            <Text style={s.mono}>1.01</Text>.{'\n'}
            On <Text style={s.bold}>Day 2</Text>, you improve again — not 1% of your original self,
            but 1% of your Day 1 self. So you're at{' '}
            <Text style={s.mono}>1.01 × 1.01</Text>.{'\n'}
            Show up for <Text style={s.bold}>n days</Text> in a row and you become{' '}
            <Text style={s.mono}>(1.01)ⁿ</Text> compared to who you were on Day 0.
          </Text>
        </Animated.View>

        {/* Milestones */}
        <Animated.View style={[a2, { gap: 10 }]}>
          <Text style={s.sectionLabel}>In other words:</Text>

          {[
            { period: '1 week',   formula: '(1.01)⁷',   result: '7%',     times: '0.07×' },
            { period: '1 month',  formula: '(1.01)³⁰',  result: '35%',    times: '0.35×' },
            { period: '3 months', formula: '(1.01)⁹⁰',  result: '144%',   times: '1.4×'  },
            { period: '1 year',   formula: '(1.01)³⁶⁵', result: '3,678%', times: '36.78×' },
          ].map(({ period, formula, result, times }) => (
            <View key={period} style={s.milestoneRow}>
              <Text style={s.milestonePeriod}>In {period}</Text>
              <Text style={s.milestoneDetail}>
                {formula} = <Text style={s.milestoneResult}>{result}</Text>
                {', or '}{times} better
              </Text>
            </View>
          ))}
        </Animated.View>

        {/* Conclusion */}
        <Animated.View style={a3}>
          <Text style={s.body}>
            By doing just 1% every day, you end up{' '}
            <Text style={s.highlight}>37 times better</Text>
            {' '}— 3,778% of where you started — in just one year.
          </Text>
        </Animated.View>

        {/* How it applies */}
        <Animated.View style={[a4, { gap: 12 }]}>
          <Text style={s.sectionLabel}>How this app applies it</Text>

          <Text style={s.body}>
            In this app, simply{' '}
            <Text style={s.highlight}>showing up for a habit</Text>
            {' '}counts as 1% better. You don't need a perfect 5-mile run or 3 hours of study.
            No matter the amount, if you show up, you have grown 1%.
          </Text>

          <Text style={s.body}>
            You may not notice much in a week or a month — the math says you're only 0.07× or 0.35× better.
            But{' '}
            <Text style={s.highlight}>the math guarantees</Text>
            {' '}you'll see an upgraded version of yourself in 3 months, and a transformed one in a year.
          </Text>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    paddingHorizontal: 24,
    paddingTop: 32,
    gap: 16,
  },
  heading: {
    fontFamily: FONTS.heading.semiBold,
    fontSize: 25,
    lineHeight: 34,
    letterSpacing: -0.5,
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: 4,
  },
  sectionLabel: {
    fontFamily: FONTS.body.semiBold,
    fontSize: 16,
    color: COLORS.text,
    marginTop: 4,
  },
  body: {
    fontFamily: FONTS.body.regular,
    fontSize: 13.5,
    lineHeight: 25,
    color: COLORS.textSecondary,
  },
  bold: {
    fontFamily: FONTS.body.semiBold,
    color: COLORS.text,
  },
  highlight: {
    fontFamily: FONTS.body.semiBold,
    color: COLORS.text,
    textDecorationLine: 'underline',
  },
  mono: {
    fontFamily: FONTS.body.semiBold,
    color: COLORS.text,
    fontVariant: ['tabular-nums'],
  },
  milestoneRow: {
    gap: 2,
    paddingLeft: 12,
    borderLeftWidth: 2,
    borderLeftColor: COLORS.border,
  },
  milestonePeriod: {
    fontFamily: FONTS.body.semiBold,
    fontSize: 15,
    color: COLORS.text,
  },
  milestoneDetail: {
    fontFamily: FONTS.body.regular,
    fontSize: 14,
    color: COLORS.textMuted,
    fontVariant: ['tabular-nums'],
  },
  milestoneResult: {
    fontFamily: FONTS.body.semiBold,
    color: COLORS.text,
  },
});
