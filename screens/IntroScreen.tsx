import React, { useRef, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue, useAnimatedStyle, withTiming, withDelay,
  withRepeat, withSequence, Easing,
} from 'react-native-reanimated';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import LottieView from 'lottie-react-native';
import Svg, { Path } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { FONTS } from '@constants/theme';

// ---------------------------------------------------------------------------
// Slide 1 — Two tilted rows of habit cards
// ---------------------------------------------------------------------------

const HABIT_DATA: {
  name: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  rotate: string;
  floatPhase: number;
}[] = [
  { name: 'Morning Run',    icon: 'walk-outline',          rotate: '-2deg', floatPhase: 0.0 },
  { name: 'Read 30min',     icon: 'book-outline',          rotate:  '3deg', floatPhase: 0.5 },
  { name: 'Meditate',       icon: 'leaf-outline',          rotate: '-1deg', floatPhase: 0.7 },
  { name: 'Cold Shower',    icon: 'snow-outline',          rotate:  '2deg', floatPhase: 1.0 },
  { name: 'Journal',        icon: 'document-text-outline', rotate: '-3deg', floatPhase: 1.5 },
  { name: 'Drink Water',    icon: 'water-outline',         rotate:  '1deg', floatPhase: 1.2 },
  { name: 'Walk 10k steps', icon: 'footsteps-outline',     rotate: '-2deg', floatPhase: 0.3 },
  { name: 'No Sugar',       icon: 'close-circle-outline',  rotate:  '2deg', floatPhase: 0.9 },
];

function FloatingCard({
  name, icon, rotate, floatPhase, higher, index,
}: {
  name: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  rotate: string;
  floatPhase: number;
  higher: boolean;
  index: number;
}) {
  const opacity     = useSharedValue(0);
  const slideInY    = useSharedValue(24);
  const floatY      = useSharedValue(0);
  const higherOffset = higher ? -30 : 0;

  React.useEffect(() => {
    const delay = index * 75;
    opacity.value  = withDelay(delay, withTiming(1, { duration: 350 }));
    slideInY.value = withDelay(delay, withTiming(0, { duration: 350 }));

    const floatStart = delay + 360 + Math.round(floatPhase * 700);
    floatY.value = withDelay(
      floatStart,
      withRepeat(
        withSequence(
          withTiming( 4, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
          withTiming(-4, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
        ),
        -1,
        false,
      ),
    );
  }, []);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { translateY: slideInY.value + floatY.value + higherOffset },
      { rotate: rotate },
    ],
  }));

  return (
    <Animated.View style={[styles.habitCard, style]}>
      <Ionicons name={icon} size={26} color="#555" />
      <Text style={styles.habitCardText}>{name}</Text>
    </Animated.View>
  );
}

function Slide1({ width, height }: { width: number; height: number }) {
  const rows = [HABIT_DATA.slice(0, 4), HABIT_DATA.slice(4, 8)];

  return (
    <View style={{ width, height }}>
      {/* Heading text */}
      <View style={[styles.textBlock, { paddingTop: 32 }]}>
        <Text style={styles.heading}>
          Start a habit full of energy…{'\n'}only to drop it weeks later?
        </Text>
        <Text style={styles.heading}>
          You're not lazy.{'\n'}You just can't{' '}
          <Text style={styles.italic}>see</Text> the progress.
        </Text>
      </View>

      {/* Two rows, each tilted –25 deg; cols 2 & 4 (i%2===1) are raised */}
      <View style={{ flex: 1, overflow: 'hidden' }}>
        {rows.map((row, rowIdx) => (
          <View
            key={rowIdx}
            style={{
              position: 'absolute',
              top: rowIdx === 0 ? 20 : 210,
              left: -80,
              right: -80,
              flexDirection: 'row',
              gap: 10,
              transform: [{ rotate: '-25deg' }],
            }}
          >
            {row.map((habit, i) => (
              <FloatingCard
                key={habit.name}
                name={habit.name}
                icon={habit.icon}
                rotate={habit.rotate}
                floatPhase={habit.floatPhase}
                higher={i % 2 === 1}
                index={rowIdx * 4 + i}
              />
            ))}
          </View>
        ))}
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Slide 2 — Lottie runner
// ---------------------------------------------------------------------------

function Slide2({ width, height }: { width: number; height: number }) {
  return (
    <View style={{ width, height }}>
      <View style={[styles.textBlock, { paddingTop: 32 }]}>
        <Text style={styles.body}>
          Maybe because you never asked yourself{' '}
          <Text style={styles.italic}>why</Text> you wanted this habit.
        </Text>
        <Text style={styles.bold}>What are you running towards?</Text>
      </View>

      <View style={[styles.visual, { alignItems: 'center', justifyContent: 'center' }]}>
        <LottieView
          // eslint-disable-next-line @typescript-eslint/no-require-imports
          source={require('../assets/animations/runner.json')}
          autoPlay
          loop
          style={{ width: 280, height: 280 }}
        />
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Slide 3 — Compounding math
// ---------------------------------------------------------------------------

function MiniGraph({ width }: { width: number }) {
  const opacity = useSharedValue(0);
  React.useEffect(() => {
    opacity.value = withDelay(300, withTiming(1, { duration: 600 }));
  }, []);
  const animStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  const H = 200;
  const pL = 8, pR = 8, pT = 12, pB = 12;
  const iW = width - pL - pR;
  const iH = H - pT - pB;
  const maxVal = Math.pow(1.01, 365);
  const minVal = Math.pow(0.99, 365);
  const range  = maxVal - minVal;
  const toX = (d: number) => pL + (d / 365) * iW;
  const toY = (v: number) => pT + iH - ((v - minVal) / range) * iH;

  const N = 74;
  const idealD = Array.from({ length: N }, (_, i) => {
    const d = Math.round((i / (N - 1)) * 365);
    return `${i === 0 ? 'M' : 'L'} ${toX(d).toFixed(1)} ${toY(Math.pow(1.01, d)).toFixed(1)}`;
  }).join(' ');
  const worstD = Array.from({ length: N }, (_, i) => {
    const d = Math.round((i / (N - 1)) * 365);
    return `${i === 0 ? 'M' : 'L'} ${toX(d).toFixed(1)} ${toY(Math.pow(0.99, d)).toFixed(1)}`;
  }).join(' ');

  return (
    <Animated.View style={animStyle}>
      <Svg width={width} height={H}>
        <Path d={idealD} stroke="#0BDA51" strokeWidth={2.5} fill="none" opacity={0.9} />
        <Path d={worstD} stroke="#FF8080" strokeWidth={2.5} fill="none" opacity={0.9} />
      </Svg>
    </Animated.View>
  );
}

function Slide3({ width, height }: { width: number; height: number }) {
  const innerW = width - 48;
  return (
    <View style={{ width, height }}>
      <View style={[styles.textBlock, { paddingTop: 32 }]}>
        <Text style={styles.heading}>
          The gap is invisible today.{'\n'}Enormous in a year.
        </Text>
        <Text style={styles.body}>
          You can't see it yet — but the math compounds.
        </Text>
      </View>

      <View style={[styles.visual, { alignItems: 'center', justifyContent: 'center' }]}>
        <MiniGraph width={innerW} />
        <View style={styles.legend}>
          <View style={styles.legendRow}>
            <View style={[styles.legendDot, { backgroundColor: '#0BDA51' }]} />
            <Text style={styles.legendText}>
              1% better daily: <Text style={styles.legendBold}>37.7×</Text>
            </Text>
          </View>
          <View style={styles.legendRow}>
            <View style={[styles.legendDot, { backgroundColor: '#FF8080' }]} />
            <Text style={styles.legendText}>
              1% worse daily: <Text style={styles.legendBold}>0.03×</Text>
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Root
// ---------------------------------------------------------------------------

const SLIDES = [Slide1, Slide2, Slide3];

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
    if (currentSlide < 2) {
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
          {[0, 1, 2].map(i => (
            <View
              key={i}
              style={[styles.progressBar, { backgroundColor: i <= currentSlide ? '#fff' : '#2a2a2a' }]}
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
          {SLIDES.map((SlideComponent, i) => (
            <SlideComponent key={i} width={width} height={bodyHeight} />
          ))}
        </ScrollView>

        {/* Continue button is absolute so cards show behind it */}
        <View style={styles.footer}>
          <TouchableOpacity style={styles.cta} onPress={advance} activeOpacity={0.85}>
            <Text style={styles.ctaText}>
              {currentSlide === 2 ? 'Get Started' : 'Continue'}
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
  container: { flex: 1, backgroundColor: '#000' },

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
  skip: { color: '#666', fontFamily: FONTS.body.medium, fontSize: 15 },

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
    backgroundColor: '#141414',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 14,
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: '#1e1e1e',
  },
  habitCardText: {
    color: '#fff',
    fontFamily: FONTS.body.medium,
    fontSize: 11,
    textAlign: 'center',
  },

  // Typography
  heading: {
    color: '#fff',
    fontFamily: FONTS.heading.semiBold,
    fontSize: 26,
    lineHeight: 34,
    textAlign: 'center',
  },
  body: {
    color: '#777',
    fontFamily: FONTS.body.regular,
    fontSize: 17,
    lineHeight: 26,
    textAlign: 'center',
  },
  bold: {
    color: '#fff',
    fontFamily: FONTS.body.semiBold,
    fontSize: 20,
    lineHeight: 28,
    textAlign: 'center',
  },
  italic: {
    fontFamily: FONTS.body.italic,
    color: '#fff',
  },

  // Graph legend
  legend: { gap: 8, alignItems: 'center', marginTop: 16 },
  legendRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { color: '#666', fontFamily: FONTS.body.regular, fontSize: 14 },
  legendBold: { color: '#fff', fontFamily: FONTS.body.semiBold },

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
    backgroundColor: '#fff',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  ctaText: {
    color: '#000',
    fontFamily: FONTS.body.semiBold,
    fontSize: 17,
  },
});
