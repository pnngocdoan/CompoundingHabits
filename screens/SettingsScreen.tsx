import React, { useEffect } from 'react';
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  Pressable,
  Alert,
  Linking,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withDelay,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { COLORS, FONTS } from '@constants/theme';
import { supabase } from '../api/supabase';

const PRIVACY_POLICY_URL = 'https://ngocdoanpn.github.io/CompoundingHabits/privacy'; // TODO: update after publishing PRIVACY_POLICY.html to GitHub Pages

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function useFadeSlideIn(delayMs: number) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(10);
  useEffect(() => {
    opacity.value = withDelay(delayMs, withTiming(1, { duration: 320, easing: Easing.out(Easing.cubic) }));
    translateY.value = withDelay(delayMs, withTiming(0, { duration: 320, easing: Easing.out(Easing.cubic) }));
  }, []);
  return useAnimatedStyle(() => ({ opacity: opacity.value, transform: [{ translateY: translateY.value }] }));
}

function SectionHeader({ title }: { title: string }) {
  return <Text style={s.sectionHeader}>{title}</Text>;
}

function RowItem({
  icon,
  label,
  onPress,
  danger,
}: {
  icon?: React.ReactNode;
  label: string;
  onPress: () => void;
  danger?: boolean;
}) {
  const scale = useSharedValue(1);
  const pressStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  return (
    <AnimatedPressable
      style={[s.row, pressStyle]}
      onPress={onPress}
      onPressIn={() => { scale.value = withSpring(0.96, { mass: 0.3, damping: 15, stiffness: 300 }); }}
      onPressOut={() => { scale.value = withSpring(1,    { mass: 0.3, damping: 15, stiffness: 300 }); }}
      hitSlop={{ top: 4, bottom: 4 }}
    >
      {icon && <View style={s.rowIcon}>{icon}</View>}
      <Text style={[s.rowLabel, danger && s.rowLabelDanger]}>{label}</Text>
      <Feather name="chevron-right" size={16} color={danger ? COLORS.loss : COLORS.textMuted} />
    </AnimatedPressable>
  );
}

function Separator() {
  return <View style={s.separator} />;
}

export default function SettingsScreen() {
  const cardFade    = useFadeSlideIn(0);
  const accountFade = useFadeSlideIn(80);
  const appFade     = useFadeSlideIn(160);

  // Theory card spring scale
  const cardScale = useSharedValue(1);
  const cardPressStyle = useAnimatedStyle(() => ({ transform: [{ scale: cardScale.value }] }));

  // Logout button spring scale
  const logoutScale = useSharedValue(1);
  const logoutPressStyle = useAnimatedStyle(() => ({ transform: [{ scale: logoutScale.value }] }));

  function handleLogout() {
    Alert.alert(
      'Log out & delete data',
      'This will permanently delete all your habits and entries. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await supabase.auth.signOut().catch(() => {});
            router.replace('/intro');
          },
        },
      ]
    );
  }

  function handleFeedback() {
    Linking.openURL('mailto:ngocdoanpn@gmail.com?subject=Compounding Habits Feedback').catch(() =>
      Alert.alert('Could not open mail app')
    );
  }

  function handlePrivacy() {
    Linking.openURL(PRIVACY_POLICY_URL).catch(() =>
      Alert.alert('Could not open link')
    );
  }

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView style={s.scroll} showsVerticalScrollIndicator={false}>

        {/* Theory card */}
        <Animated.View style={cardFade}>
          <AnimatedPressable
            style={[s.theoryCard, cardPressStyle]}
            onPress={() => router.push('/theory')}
            onPressIn={() => { cardScale.value = withSpring(0.97, { mass: 0.3, damping: 15, stiffness: 300 }); }}
            onPressOut={() => { cardScale.value = withSpring(1,    { mass: 0.3, damping: 15, stiffness: 300 }); }}
          >
            <Text style={s.theoryLabel}>ABOUT</Text>
            <Text style={s.theoryHeading}>The 1% Better Theory</Text>
            <Text style={s.theoryTeaser}>
              Small daily improvements compound into massive results. Showing up 1% every day makes you 37× better in a year.
            </Text>
            <View style={s.theoryFooter}>
              <Text style={s.theoryReadMore}>Read more</Text>
              <Feather name="chevron-right" size={14} color={COLORS.textMuted} />
            </View>
          </AnimatedPressable>
        </Animated.View>

        {/* Account */}
        <Animated.View style={accountFade}>
          <SectionHeader title="Account" />
          <View style={s.card}>
            <View style={s.accountRow}>
              <View style={s.avatar}>
                <Feather name="user" size={22} color={COLORS.textMuted} />
              </View>
              <View style={s.accountInfo}>
                <Text style={s.accountName}>Guest</Text>
                <Text style={s.accountDesc}>
                  Your data is only accessible on this device.
                </Text>
              </View>
            </View>
          </View>

          <AnimatedPressable
            style={[s.logoutBtn, logoutPressStyle]}
            onPress={handleLogout}
            onPressIn={() => { logoutScale.value = withSpring(0.97, { mass: 0.3, damping: 15, stiffness: 300 }); }}
            onPressOut={() => { logoutScale.value = withSpring(1,    { mass: 0.3, damping: 15, stiffness: 300 }); }}
          >
            <Feather name="trash-2" size={15} color={COLORS.loss} />
            <Text style={s.logoutText}>Log out & delete data</Text>
          </AnimatedPressable>
        </Animated.View>

        {/* App */}
        <Animated.View style={appFade}>
          <SectionHeader title="App" />
          <View style={s.card}>
            <RowItem
              label="Leave a Feedback"
              icon={<Feather name="message-square" size={16} color={COLORS.textMuted} />}
              onPress={handleFeedback}
            />
            <Separator />
            <RowItem
              label="Privacy Policy"
              icon={<Feather name="shield" size={16} color={COLORS.textMuted} />}
              onPress={handlePrivacy}
            />
          </View>
        </Animated.View>

        <View style={{ height: 48 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: COLORS.bg },
  scroll: { flex: 1 },

  // Theory card
  theoryCard: {
    margin: 16,
    padding: 24,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    gap: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.10,
    shadowRadius: 12,
    elevation: 5,
  },
  theoryLabel: {
    fontFamily: FONTS.body.semiBold,
    fontSize: 16,
    letterSpacing: 1.2,
    color: COLORS.textMuted,
    textTransform: 'uppercase',
  },
  theoryHeading: {
    fontFamily: FONTS.heading.semiBold,
    fontSize: 24,
    lineHeight: 32,
    letterSpacing: -0.5,
    color: COLORS.text,
  },
  theoryTeaser: {
    fontFamily: FONTS.body.regular,
    fontSize: 15,
    lineHeight: 24,
    color: COLORS.textSecondary,
  },
  theoryFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    marginTop: 4,
  },
  theoryReadMore: {
    fontFamily: FONTS.body.medium,
    fontSize: 13,
    color: COLORS.textMuted,
  },

  // Section header
  sectionHeader: {
    fontFamily: FONTS.heading.semiBold,
    fontSize: 22,
    color: COLORS.text,
    marginHorizontal: 16,
    marginTop: 24,
    marginBottom: 10,
    letterSpacing: -0.3,
  },

  // Card — concentric radius: theoryCard outer=16, inner content has no rounded corners (fine)
  // card outer=14, rows inside have no radius needed
  card: {
    marginHorizontal: 16,
    backgroundColor: COLORS.bgCard,
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },

  // Account
  accountRow: {
    flexDirection: 'row',
    gap: 14,
    padding: 16,
    alignItems: 'flex-start',
  },
  // avatar: concentric — sits inside card (borderRadius 14, padding 16),
  // so avatar inner radius 22 on a 44px circle is self-contained, not nested visually
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.bgCardAlt,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  accountInfo: { flex: 1, gap: 4 },
  accountName: {
    fontFamily: FONTS.body.semiBold,
    fontSize: 16,
    color: COLORS.text,
  },
  accountDesc: {
    fontFamily: FONTS.body.regular,
    fontSize: 13,
    lineHeight: 20,
    color: COLORS.textMuted,
  },

  // Logout button — concentric: sits below card, standalone, borderRadius 12
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginHorizontal: 16,
    marginTop: 10,
    paddingVertical: 13,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: COLORS.loss,
    // min hit area satisfied: paddingVertical 13 * 2 + lineHeight ≈ 46px
  },
  logoutText: {
    fontFamily: FONTS.body.medium,
    fontSize: 14,
    color: COLORS.loss,
  },

  // Row item — paddingVertical 14 * 2 + ~22px line = ~50px, meets 40px minimum
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  rowIcon: { width: 20, alignItems: 'center' },
  rowLabel: {
    flex: 1,
    fontFamily: FONTS.body.regular,
    fontSize: 15,
    color: COLORS.text,
  },
  rowLabelDanger: { color: COLORS.loss },
  separator: {
    height: 1,
    backgroundColor: COLORS.separator,
    marginLeft: 48,
  },
});
