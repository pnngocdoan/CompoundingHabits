import React, { useRef, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue, useAnimatedStyle, withTiming, withDelay,
  withRepeat, withSequence, Easing,
  ColorSpace,
} from 'react-native-reanimated';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import LottieView from 'lottie-react-native';
import Svg, { Path, Line, Text as SvgText, Rect } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { FONTS, COLORS } from '@constants/theme';
import IntroSlide4 from './IntroSlide4';

// ---------------------------------------------------------------------------
// Slide 1 — Two tilted rows of habit cards
// ---------------------------------------------------------------------------

const HABIT_DATA: {
  name: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  floatPhase: number;
}[] = [
  { name: 'Morning Run',    icon: 'walk-outline',          floatPhase: 0.0 },
  { name: 'Read 30min',     icon: 'book-outline',          floatPhase: 0.5 },
  { name: 'Meditate',       icon: 'leaf-outline',          floatPhase: 0.7 },
  { name: 'Cold Shower',    icon: 'snow-outline',          floatPhase: 1.0 },
  { name: 'Journal',        icon: 'document-text-outline', floatPhase: 1.5 },
  { name: 'Drink Water',    icon: 'water-outline',         floatPhase: 1.2 },
  { name: 'Walk 10k steps', icon: 'footsteps-outline',     floatPhase: 0.3 },
  { name: 'No Sugar',       icon: 'close-circle-outline',  floatPhase: 0.9 },
];

function FloatingCard({
  name, icon, higher, index,
}: {
  name: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  higher: boolean;
  index: number;
}) {
  const opacity     = useSharedValue(0);
  const slideInY    = useSharedValue(24);
  const higherOffset = higher ? -30 : 0;

  React.useEffect(() => {
    const delay = index * 75;
    opacity.value  = withDelay(delay, withTiming(1, { duration: 350 }));
    slideInY.value = withDelay(delay, withTiming(0, { duration: 350 }));
  }, []);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { translateY: slideInY.value + higherOffset },
    ],
  }));

  return (
    <Animated.View style={[styles.habitCard, style]}>
      <Ionicons name={icon} size={26} color={COLORS.text} />
      <Text style={styles.habitCardText}>{name}</Text>
    </Animated.View>
  );
}

function Slide1({ width, height }: { width: number; height: number }) {
  const rows = [HABIT_DATA.slice(0, 4), HABIT_DATA.slice(4, 8)];
  const floatY = useSharedValue(0);

  React.useEffect(() => {
    floatY.value = withDelay(
      800,
      withRepeat(
        withSequence(
          withTiming(6, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
          withTiming(-6, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
        ),
        -1,
        false,
      ),
    );
  }, []);

  const blockStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: floatY.value }, { rotate: '-15deg' }],
  }));

  return (
    <View style={{ width, height }}>
      {/* Heading text */}
      <View style={[styles.textBlock, { paddingTop: 80 }]}>
        <Text style={styles.heading}>
          We've probably all been there. We try to{' '}
          <Text style={styles.highlight}>start strong</Text>
          {' '}with a habit,{' '}
          <Text style={styles.highlight}>do everything right</Text>
          {' '}for a few days. Then{' '}
          <Text style={styles.highlight}>slowly slip off</Text>
          {' '}and{' '}
          <Text style={styles.highlight}>quietly stop</Text>.
        </Text>
      </View>

      {/* One block rotated left; cols 2 & 4 raised via `higher` prop */}
      <View style={{ flex: 1, overflow: 'hidden' }}>
        <Animated.View style={[{
          position: 'absolute',
          bottom: 60,
          left: -20,
          right: -20,
          gap: 10,
        }, blockStyle]}>
          {rows.map((row, rowIdx) => (
            <View key={rowIdx} style={{ flexDirection: 'row', gap: 10 }}>
              {row.map((habit, i) => (
                <FloatingCard
                  key={habit.name}
                  name={habit.name}
                  icon={habit.icon}
                  higher={i % 2 === 1}
                  index={rowIdx * 4 + i}
                />
              ))}
            </View>
          ))}
        </Animated.View>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Slide 2 — Lottie runner
// ---------------------------------------------------------------------------

function Slide2({ width, height }: { width: number; height: number }) {
  const lottieRef = React.useRef<LottieView>(null);
  React.useEffect(() => { lottieRef.current?.play(); }, []);

  return (
    <View style={{ width, height }}>
      <View style={[styles.textBlock, { paddingTop: 32 }]}>
        <Text style={styles.heading}>
        Deep down, we may know why. We're{' '}
        <Text style={styles.highlight}>too focused</Text>
        {' '}on the act of the habit itself — it doesn't feel grounded in our{' '}
        <Text style={styles.highlight}>identity</Text>
        {' '}or{' '}
        <Text style={styles.highlight}>core values</Text>
        {' '}yet.
        </Text>
        <Text style={styles.bold}>What are you running towards?</Text>
      </View>

      <View style={[styles.visual, { alignItems: 'center', justifyContent: 'center' }]}>
        <LottieView
          ref={lottieRef}
          // eslint-disable-next-line @typescript-eslint/no-require-imports
          source={require('../assets/animations/runner.json')}
          autoPlay
          loop
          renderMode="SOFTWARE"
          style={{ flex: 1.2, width: '100%' }}
        />
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Slide 3 — Compounding math
// ---------------------------------------------------------------------------

const TOTAL_DAYS = 365;
const ANIM_DURATION = 3000;

function AnimatedGraph({ width, active }: { width: number; active: boolean }) {
  const [day, setDay] = useState(0);

  const H = 320;
  const pL = 8, pR = 32, pT = 28, pB = 32;
  const iW = width - pL - pR;
  const iH = H - pT - pB;
  const maxVal = Math.pow(1.01, TOTAL_DAYS);
  const minVal = Math.pow(0.99, TOTAL_DAYS);
  const range  = maxVal - minVal;
  const toX = (d: number) => pL + (d / TOTAL_DAYS) * iW;
  const toY = (v: number) => pT + iH - ((v - minVal) / range) * iH;
  const axisY = pT + iH;

  const TICKS = [
    { d: 30,  label: '1mo' },
    { d: 90,  label: '3mo' },
    { d: 365, label: '1y' },
  ];

  React.useEffect(() => {
    if (!active) return;
    setDay(0);
    const start = Date.now();
    const DELAY = 400;
    const id = setInterval(() => {
      const elapsed = Date.now() - start - DELAY;
      const t = Math.min(Math.max(elapsed / ANIM_DURATION, 0), 1);
      const eased = 1 - Math.pow(1 - t, 2);
      setDay(Math.round(eased * TOTAL_DAYS));
      if (t >= 1) clearInterval(id);
    }, 16);
    return () => clearInterval(id);
  }, [active]);

  const growth = ((Math.pow(1.01, day) - 1) * 100).toFixed(1);

  // Build partial path up to current day
  const pathForDay = (d: number) => {
    const N = Math.max(2, Math.round((d / TOTAL_DAYS) * 73) + 1);
    return Array.from({ length: N }, (_, i) => {
      const dd = Math.round((i / (N - 1)) * d);
      return `${i === 0 ? 'M' : 'L'} ${toX(dd).toFixed(1)} ${toY(Math.pow(1.01, dd)).toFixed(1)}`;
    }).join(' ');
  };

  return (
    <View style={{ width, position: 'relative' }}>
      <Svg width={width} height={H}>
        {/* X-axis baseline */}
        <Line x1={pL} y1={axisY} x2={width - pR} y2={axisY} stroke="#000" strokeWidth={1.5} />
        {/* Tick marks + vertical dash + growth label — appear when animation passes each milestone */}
        {TICKS.filter(t => day >= t.d).map(t => {
          const x = toX(t.d);
          const y = toY(Math.pow(1.01, t.d));
          const growthPct = ((Math.pow(1.01, t.d) - 1) * 100).toFixed(1);
          return (
            <React.Fragment key={t.d}>
              {/* X-axis tick */}
              <Line x1={x} y1={axisY - 4} x2={x} y2={axisY + 6} stroke="#000" strokeWidth={1.5} />
              <SvgText x={x} y={axisY + 18} fontSize={10} fill="#000" textAnchor={t.d === 365 ? 'end' : 'middle'} fontFamily="System">
                {t.label}
              </SvgText>
              {/* Vertical dashed line from axis to graph point */}
              <Line x1={x} y1={axisY} x2={x} y2={y} stroke="#000" strokeWidth={1} strokeDasharray="3,3" />
              {/* Growth label above graph point */}
              <SvgText x={x} y={y - 8} fontSize={11} fill="#000" textAnchor={t.d === 365 ? 'end' : 'middle'} fontFamily="System" fontWeight="bold" letterSpacing={-1.5}>{'+' + growthPct + '%'}</SvgText>
            </React.Fragment>
          );
        })}
        {/* Growth curve */}
        {day > 0 && (
          <Path d={pathForDay(day)} stroke="#000" strokeWidth={2.5} fill="none" />
        )}
      </Svg>
      {/* Badge top-left */}
      <View style={graphStyles.badge}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <Text style={graphStyles.badgeLabel}>Growth:</Text>
          <Ionicons name="arrow-up" size={14} color={COLORS.win} />
          <Text style={graphStyles.badgeValue}>{growth}%</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 4 }}>
          <Text style={graphStyles.badgeLabel}>Day:</Text>
          <Text style={graphStyles.badgeValue}>{day}</Text>
        </View>
      </View>
    </View>
  );
}

const graphStyles = StyleSheet.create({
  badge: {
    position: 'absolute',
    top: 8,
    left: 12,
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    minWidth: 80,
  },
  badgeLabel: {
    fontFamily: FONTS.body.semiBold,
    fontSize: 16,
    color: COLORS.text,
    lineHeight: 22,
  },
  badgeValue: {
    fontFamily: FONTS.body.semiBold,
    fontSize: 20,
    color: COLORS.win,
    lineHeight: 22,
  },
});

function Slide3({ width, height, active }: { width: number; height: number; active: boolean }) {
  const innerW = width - 48;
  return (
    <View style={{ width, height }}>
      <View style={[styles.textBlock, { paddingTop: 32 }]}>
        <Text style={styles.heading}>
        We know habits and benefits don't come overnight, but when nothing really changes, we slowly lose our drive
        </Text>
        <Text style={styles.bold}>
        But do you know we can see our progress with compounding effects?
        </Text>
      </View>

      <View style={[styles.visual, { alignItems: 'center', justifyContent: 'center' }]}>
        <AnimatedGraph width={innerW} active={active} />
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Root
// ---------------------------------------------------------------------------


export default function IntroScreen() {
  const { width } = useWindowDimensions();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [bodyHeight, setBodyHeight] = useState(0);
  const scrollRef = useRef<ScrollView>(null);

  const complete = async () => {
    await AsyncStorage.setItem('intro_seen', '1');
    router.replace('/(tabs)');
  };

  const advance = () => {
    if (currentSlide < 3) {
      const next = currentSlide + 1;
      setCurrentSlide(next);
      scrollRef.current?.scrollTo({ x: width * next, animated: true });
    } else {
      complete();
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.progressBars}>
          {[0, 1, 2, 3].map(i => (
            <View
              key={i}
              style={[styles.progressBar, { backgroundColor: i <= currentSlide ? COLORS.text : COLORS.neutral }]}
            />
          ))}
        </View>
        <TouchableOpacity onPress={complete} hitSlop={12}>
          <Text style={styles.skip}>Skip</Text>
        </TouchableOpacity>
      </View>

      {/* Body: slides + Continue button overlaid at bottom */}
      <View
        style={styles.bodyArea}
        onLayout={e => setBodyHeight(e.nativeEvent.layout.height)}
      >
        <ScrollView
          ref={scrollRef}
          horizontal
          pagingEnabled
          scrollEnabled={false}
          showsHorizontalScrollIndicator={false}
          style={{ flex: 1 }}
        >
          <Slide1 width={width} height={bodyHeight} />
          <Slide2 width={width} height={bodyHeight} />
          <Slide3 width={width} height={bodyHeight} active={currentSlide === 2} />
          <IntroSlide4 width={width} height={bodyHeight} active={currentSlide === 3} />
        </ScrollView>

        {/* Continue button is absolute so cards show behind it */}
        <View style={styles.footer}>
          <TouchableOpacity style={styles.cta} onPress={advance} activeOpacity={0.85}>
            <Text style={styles.ctaText}>
              {currentSlide === 3 ? 'Get Started' : 'Continue'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
    gap: 12,
  },
  progressBars: { flex: 1, flexDirection: 'row', gap: 6 },
  progressBar:  { flex: 1, height: 3, borderRadius: 2 },
  skip: { color: COLORS.textMuted, fontFamily: FONTS.body.medium, fontSize: 15 },

  // Body: full remaining height, relative so footer can be absolute
  bodyArea: { flex: 1, position: 'relative' },

  // Slide layout
  textBlock: {
    paddingHorizontal: 24,
    paddingBottom: 24,
    gap: 16,
  },
  visual: {
    flex: 1,
    position: 'relative',
  },

  // Habit cards (slide 1) — flex: 1 so they share row width evenly
  habitCard: {
    flex: 1,
    backgroundColor: COLORS.bgCard,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 22,
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  habitCardText: {
    color: COLORS.text,
    fontFamily: FONTS.body.medium,
    fontSize: 14,
    textAlign: 'center',
  },

  // Typography
  heading: {
    color: COLORS.textMuted,
    fontFamily: FONTS.heading.semiBold,
    fontSize: 25,
    lineHeight: 34,
    textAlign: 'center',
  },
  highlight: {
    color: COLORS.text,
    textDecorationLine: 'underline',
  },
  body: {
    color: COLORS.textSecondary,
    fontFamily: FONTS.body.regular,
    fontSize: 17,
    lineHeight: 26,
    textAlign: 'center',
  },
  bold: {
    color: COLORS.text,
    fontFamily: FONTS.body.semiBold,
    fontSize: 20,
    lineHeight: 28,
    textAlign: 'center',
  },
  italic: {
    fontFamily: FONTS.heading.italic,
    color: COLORS.text,
  },

  // Graph legend
  legend: { gap: 8, alignItems: 'center', marginTop: 16 },
  legendRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { color: COLORS.textMuted, fontFamily: FONTS.body.regular, fontSize: 14 },
  legendBold: { color: COLORS.text, fontFamily: FONTS.body.semiBold },

  // Footer — absolute so it overlays the bottom of the card fan
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 24,
  },
  cta: {
    backgroundColor: COLORS.text,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  ctaText: {
    color: COLORS.bg,
    fontFamily: FONTS.body.semiBold,
    fontSize: 17,
  },
});
