import React, { useState, useEffect, useRef } from 'react';
import { Text, StyleSheet, SafeAreaView, ScrollView, useWindowDimensions, TextInput, View, Animated as RNAnimated } from 'react-native';
import { useLocalSearchParams, useNavigation } from 'expo-router';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import CompoundingGraph from '@components/CompoundingGraph';
import HabitCalendar from '@components/HabitCalendar';
import { DateData } from 'react-native-calendars';
import { COLORS, FONTS, DEBUG_OUTLINES, calcMultiplier, getMilestone } from '@constants/theme';
import { fetchEntries, upsertEntry, deleteEntry } from '../api/habits';

function buildGraphData(logMap: Record<string, 'done' | 'missed'>): number[] {
  const sortedDates = Object.keys(logMap).sort();
  const points: number[] = [1.0];
  let current = 1.0;
  for (const date of sortedDates) {
    current *= logMap[date] === 'done' ? 1.01 : 0.99;
    points.push(current);
  }
  return points;
}

function useFadeSlideIn(delayMs: number) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(10);
  useEffect(() => {
    opacity.value = withDelay(delayMs, withTiming(1, { duration: 260, easing: Easing.bezier(0.23, 1, 0.32, 1) }));
    translateY.value = withDelay(delayMs, withTiming(0, { duration: 260, easing: Easing.bezier(0.23, 1, 0.32, 1) }));
  }, []);
  return useAnimatedStyle(() => ({ opacity: opacity.value, transform: [{ translateY: translateY.value }] }));
}

// Animates color + textDecorationColor from transparent → target so underline fades with text
function useColorReveal(delayMs: number, hex: string) {
  const alpha = useRef(new RNAnimated.Value(0)).current;
  useEffect(() => {
    RNAnimated.timing(alpha, { toValue: 1, duration: 600, delay: delayMs, useNativeDriver: false }).start();
  }, []);
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const color = alpha.interpolate({ inputRange: [0, 1], outputRange: [`rgba(${r},${g},${b},0)`, `rgba(${r},${g},${b},1)`] });
  return { color, textDecorationColor: color };
}

export default function HabitDetailScreen() {
  const { id, name: paramName, aiGoal } = useLocalSearchParams<{ id: string; name: string; aiGoal: string }>();
  const navigation = useNavigation();
  const { height: screenH } = useWindowDimensions();

  const initName = paramName
    ? (() => {
        const [actionPart] = (aiGoal ?? paramName).split(' every day to ');
        return actionPart?.replace(/^i will /i, '').trim() ?? paramName;
      })()
    : paramName ?? 'Unknown';
  const initIdentity = paramName
    ? (() => {
        const [, identityPart] = (aiGoal ?? '').split(' every day to ');
        return identityPart?.trim() ?? (aiGoal ?? paramName ?? 'my best self');
      })()
    : (aiGoal ?? 'my best self');

  const [logMap, setLogMap] = useState<Record<string, 'done' | 'missed'>>({});

  useEffect(() => {
    if (!id) return;
    fetchEntries(id).then(setLogMap).catch(() => {});
  }, [id]);
  const [editableName, setEditableName] = useState(initName);
  const [editableIdentity, setEditableIdentity] = useState(initIdentity);
  const [editingField, setEditingField] = useState<'name' | 'identity' | null>(null);
  const [editValue, setEditValue] = useState('');
  const [nameWidth, setNameWidth] = useState<number | undefined>(undefined);
  const [identityWidth, setIdentityWidth] = useState<number | undefined>(undefined);
  const now = new Date();

  useEffect(() => { navigation.setOptions({ title: paramName ?? '' }); }, [paramName]);

  const introStyle = useFadeSlideIn(0);
  const graphStyle = useFadeSlideIn(100);
  const calStyle   = useFadeSlideIn(220);

  const wins   = Object.values(logMap).filter(s => s === 'done').length;
  const losses = Object.values(logMap).filter(s => s === 'missed').length;
  const total  = wins + losses;

  const isPositive    = calcMultiplier(wins, losses) >= 1.0;
  const growthHex     = isPositive ? COLORS.win : COLORS.loss;

  // Sequential left-to-right color reveal — staggered as you read through the sentence
  const STAGGER = 250;
  const hlName     = useColorReveal(100,              COLORS.text);
  const hlIdentity = useColorReveal(100 + STAGGER,    COLORS.text);
  const hlGrowth   = useColorReveal(100 + STAGGER * 2, growthHex);
  const hlWins     = useColorReveal(100 + STAGGER * 3, COLORS.text);
  const hlTotal    = useColorReveal(100 + STAGGER * 4, COLORS.text);

  const milestone = getMilestone(total);
  const graphData = buildGraphData(logMap);
  const minDataVal = graphData.length > 0 ? Math.min(...graphData) : 1.0;
  const belowRange = Math.max(0, 1.0 - minDataVal);
  const aboveRange = milestone.maxVal - 1.0;
  const extraRatio = aboveRange > 0 ? belowRange / aboveRange : 0;
  const graphH = screenH * milestone.heightRatio * (1 + extraRatio);

  const startDateLabel = (() => {
    if (total === 0) return '';
    const d = new Date(now);
    d.setDate(d.getDate() - total);
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    return `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
  })();

  const growthPct   = (calcMultiplier(wins, losses) - 1) * 100;
  const growthLabel = `${isPositive ? '+' : ''}${growthPct.toFixed(0)}%`;

  const isBig = isPositive && growthPct >= 5;
  const motivationalText = isBig
    ? `I'm grateful for believing in compound effects — ${total} days in${habit.streak > 0 ? `, ${habit.streak}-day streak` : ''}!`
    : 'The changes may not be visible at first, but I believe in the compound effects!';

  function startEdit(field: 'name' | 'identity') {
    setEditValue(field === 'name' ? editableName : editableIdentity);
    setEditingField(field);
  }

  function commitEdit() {
    if (editingField === 'name') {
      if (editValue.trim()) setEditableName(editValue.trim());
    } else if (editingField === 'identity') {
      if (editValue.trim()) setEditableIdentity(editValue.trim());
    }
    setEditingField(null);
  }

  function handleDayPress(day: DateData) {
    const today = new Date();
    const pressed = new Date(day.dateString);
    today.setHours(0, 0, 0, 0);
    pressed.setHours(0, 0, 0, 0);
    if (pressed > today) return;
    setLogMap(prev => {
      const cur = prev[day.dateString];
      if (cur === 'done') {
        upsertEntry(id, day.dateString, false).catch(() => {});
        return { ...prev, [day.dateString]: 'missed' };
      }
      if (cur === 'missed') {
        deleteEntry(id, day.dateString).catch(() => {});
        const n = { ...prev }; delete n[day.dateString]; return n;
      }
      upsertEntry(id, day.dateString, true).catch(() => {});
      return { ...prev, [day.dateString]: 'done' };
    });
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

      {/* ① Intro */}
      <Animated.View style={[styles.introSection, introStyle, DEBUG_OUTLINES && { borderWidth: 1, borderColor: '#f0f' }]}>
        {editingField !== null ? (
          // Edit mode: flex row so TextInput can sit inline
          <View style={styles.introParagraph}>
            <Text style={styles.introMuted}>{'I will '}</Text>
            {editingField === 'name' ? (
              <View style={[styles.inlineEditWrapper, nameWidth ? { width: nameWidth } : { minWidth: 80 }]}>
                <TextInput style={styles.inlineEditInput} value={editValue} onChangeText={setEditValue}
                  autoFocus onBlur={commitEdit} onSubmitEditing={commitEdit} returnKeyType="done" selectTextOnFocus />
              </View>
            ) : (
              <Text style={styles.introUnderline} onPress={() => startEdit('name')}>{editableName}</Text>
            )}
            <Text style={styles.introMuted}>{' every day to '}</Text>
            {editingField === 'identity' ? (
              <View style={[styles.inlineEditWrapper, identityWidth ? { width: identityWidth } : { minWidth: 80 }]}>
                <TextInput style={styles.inlineEditInput} value={editValue} onChangeText={setEditValue}
                  autoFocus onBlur={commitEdit} onSubmitEditing={commitEdit} returnKeyType="done" selectTextOnFocus />
              </View>
            ) : (
              <Text style={styles.introUnderline} onPress={() => startEdit('identity')}>{editableIdentity}</Text>
            )}
            <Text style={styles.introMuted}>
              {'. Today, I have grown '}
              <Text style={[styles.introUnderline, { color: growthHex, textDecorationColor: growthHex, fontVariant: ['tabular-nums'] }]}>{growthLabel}</Text>
              {' with '}
              <Text style={styles.introUnderline}>{wins} days</Text>
              {' within '}
              <Text style={styles.introUnderline}>{total} days</Text>
              {'. '}{motivationalText}
            </Text>
          </View>
        ) : (
          // Display mode: single Text parent for natural inline flow — no period-on-new-line issues
          <Text style={styles.introBody}>
            <Text style={styles.introMuted}>{'I will '}</Text>
            <RNAnimated.Text
              style={[styles.introUnderline, hlName]}
              onPress={() => startEdit('name')}
              onLayout={(e) => setNameWidth(e.nativeEvent.layout.width)}
            >{editableName}</RNAnimated.Text>
            <Text style={styles.introMuted}>{' every day to '}</Text>
            <RNAnimated.Text
              style={[styles.introUnderline, hlIdentity]}
              onPress={() => startEdit('identity')}
              onLayout={(e) => setIdentityWidth(e.nativeEvent.layout.width)}
            >{editableIdentity}</RNAnimated.Text>
            <Text style={styles.introMuted}>{'. Today, I have grown '}</Text>
            <RNAnimated.Text style={[styles.introUnderline, { fontVariant: ['tabular-nums'] }, hlGrowth]}>{growthLabel}</RNAnimated.Text>
            <Text style={styles.introMuted}>{' with '}</Text>
            <RNAnimated.Text style={[styles.introUnderline, hlWins]}>{wins} days</RNAnimated.Text>
            <Text style={styles.introMuted}>{' within '}</Text>
            <RNAnimated.Text style={[styles.introUnderline, hlTotal]}>{total} days</RNAnimated.Text>
            <Text style={styles.introMuted}>{'. '}{motivationalText}</Text>
          </Text>
        )}
      </Animated.View>

      {/* ② Graph */}
      <Animated.View style={[styles.graphSection, { height: graphH }, graphStyle, DEBUG_OUTLINES && { borderWidth: 1, borderColor: '#0ff' }]}>
        <CompoundingGraph data={graphData} height={graphH} startDate={startDateLabel} />
      </Animated.View>

      {/* ③ Calendar */}
      <Animated.View style={[calStyle, DEBUG_OUTLINES && { borderWidth: 1, borderColor: '#0f0' }]}>
        <HabitCalendar logMap={logMap} onDayPress={handleDayPress} />
      </Animated.View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  introSection: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
  },
  introBody: {
    fontFamily: FONTS.heading.regular,
    fontSize: 17,
    lineHeight: 26,
    letterSpacing: -0.2,
  },
  introParagraph: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  introMuted: {
    color: COLORS.textMuted,
    fontFamily: FONTS.heading.regular,
    fontSize: 17,
    lineHeight: 26,
    letterSpacing: -0.2,
  },
  introUnderline: {
    color: COLORS.text,
    fontFamily: FONTS.heading.regular,
    fontSize: 17,
    lineHeight: 26,
    letterSpacing: -0.2,
    textDecorationLine: 'underline',
    textDecorationColor: COLORS.text,
  },
  inlineEditWrapper: {
    borderWidth: 0,
    borderBottomWidth: 1.5,
    borderBottomColor: COLORS.text,
    borderStyle: 'dashed',
    height: 26,
    justifyContent: 'center',
  },
  inlineEditInput: {
    fontSize: 17,
    fontFamily: FONTS.heading.regular,
    color: COLORS.text,
    letterSpacing: -0.2,
    padding: 0,
  },
  graphSection: {
    marginVertical: 6,
    backgroundColor: COLORS.bg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
  },
  scroll: {
    paddingBottom: 40,
  },
});
