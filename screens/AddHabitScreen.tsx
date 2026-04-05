import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  SafeAreaView,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Animated as RNAnimated,
  Dimensions,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
} from 'react-native-reanimated';
import { router } from 'expo-router';
import { COLORS, FONTS } from '@constants/theme';
import { generateHabitGoalOptions } from '../api/generateHabitGoal';

const SCREEN_WIDTH = Dimensions.get('window').width;

// ─── Components ───────────────────────────────────────────────────────────────

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

function WhyParagraph() {
  // White overlay slides off to the right, revealing text left → right
  const revealX = useRef(new RNAnimated.Value(0)).current;
  useEffect(() => {
    RNAnimated.timing(revealX, {
      toValue: SCREEN_WIDTH,
      duration: 1200,
      delay: 100,
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <View style={styles.whyBox}>
      <View style={{ overflow: 'hidden' }}>
        <Text style={styles.whyBody}>
          <Text style={styles.whyMuted}>A habit without a deep reason </Text>
          <Text style={styles.whyUnderline}>dies the moment discomfort appears</Text>
          <Text style={styles.whyMuted}>. Saying </Text>
          <Text style={styles.whyUnderline}>I want to be healthy</Text>
          <Text style={styles.whyMuted}> is not enough — it won't get you out of bed.{'\n\n'}Ask yourself </Text>
          <Text style={styles.whyUnderline}>why does this matter to me</Text>
          <Text style={styles.whyMuted}>. Keep asking until the answer makes you feel something. </Text>
          <Text style={styles.whyUnderline}>That answer</Text>
          <Text style={styles.whyMuted}> is what you commit to — not the habit itself.</Text>
        </Text>
        <RNAnimated.View
          pointerEvents="none"
          style={[
            StyleSheet.absoluteFill,
            { backgroundColor: COLORS.bg, transform: [{ translateX: revealX }] },
          ]}
        />
      </View>
    </View>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function AddHabitScreen() {
  const [name, setName] = useState('');
  const [why, setWhy] = useState('');
  const [loading, setLoading] = useState(false);
  const whyRef = useRef<TextInput>(null);

  const isValid = name.trim().length > 0 && why.trim().length > 0;

  const buttonScale = useSharedValue(1);
  const buttonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
  }));

  async function handleSave() {
    if (!isValid || loading) return;
    setLoading(true);
    const options = await generateHabitGoalOptions(name.trim(), why.trim());
    setLoading(false);
    router.push({ pathname: '/habit/select', params: { name: name.trim(), why: why.trim(), options: JSON.stringify(options) } });
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
        >
          <FadeIn delay={0}>
            <Text style={styles.title}>New Habit</Text>
          </FadeIn>

          <WhyParagraph />

          <FadeIn delay={160}>
            <View style={styles.field}>
              <Text style={styles.label}>Habit name</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Morning Run"
                placeholderTextColor={COLORS.textMuted}
                value={name}
                onChangeText={setName}
                autoFocus
                returnKeyType="next"
                onSubmitEditing={() => whyRef.current?.focus()}
              />
            </View>
          </FadeIn>

          <FadeIn delay={240}>
            <View style={styles.field}>
              <Text style={styles.label}>Your why</Text>
              <TextInput
                ref={whyRef}
                style={[styles.input, styles.inputMultiline]}
                placeholder="e.g. I want to feel proud when I look in the mirror — not just look healthy, but know I kept my word to myself."
                placeholderTextColor={COLORS.textMuted}
                value={why}
                onChangeText={setWhy}
                multiline
                returnKeyType="done"
                blurOnSubmit
                onSubmitEditing={handleSave}
              />
            </View>
          </FadeIn>

          <FadeIn delay={320}>
            <Animated.View style={buttonStyle}>
              <Pressable
                style={[styles.saveBtn, (!isValid || loading) && styles.saveBtnDisabled]}
                onPress={handleSave}
                onPressIn={() => { if (isValid && !loading) buttonScale.value = withTiming(0.96, { duration: 100 }); }}
                onPressOut={() => { buttonScale.value = withTiming(1, { duration: 150 }); }}
                disabled={!isValid || loading}
              >
                <Text style={styles.saveBtnText}>{loading ? 'Adding…' : 'Add Habit'}</Text>
              </Pressable>
            </Animated.View>
          </FadeIn>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:  { flex: 1, backgroundColor: COLORS.bg },
  flex:  { flex: 1 },
  container: {
    paddingHorizontal: 20,
    paddingTop: 32,
    paddingBottom: 40,
  },
  title: {
    color: COLORS.text,
    fontSize: 36,
    fontFamily: FONTS.heading.bold,
    letterSpacing: -0.8,
    marginBottom: 24,
  },
  whyBox: {
    marginBottom: 32,
  },
  whyBody: {
    fontSize: 17,
    lineHeight: 26,
    letterSpacing: -0.2,
  },
  whyMuted: {
    color: COLORS.textMuted,
    fontFamily: FONTS.heading.regular,
    fontSize: 17,
  },
  whyUnderline: {
    color: COLORS.text,
    fontFamily: FONTS.heading.regular,
    fontSize: 17,
    textDecorationLine: 'underline',
    textDecorationColor: COLORS.text,
  },
  field: {
    marginBottom: 28,
  },
  label: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontFamily: FONTS.body.semiBold,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  input: {
    color: COLORS.text,
    fontSize: 13,
    fontFamily: FONTS.heading.regular,
    letterSpacing: -0.3,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingBottom: 8,
  },
  inputMultiline: {
    textAlignVertical: 'top',
  },
  saveBtn: {
    backgroundColor: COLORS.win,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 24,
  },
  saveBtnDisabled: {
    backgroundColor: COLORS.neutral,
  },
  saveBtnText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: FONTS.body.semiBold,
    letterSpacing: -0.2,
  },
});
