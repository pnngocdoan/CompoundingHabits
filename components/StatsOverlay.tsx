import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, Modal } from 'react-native';
import { COLORS, FONTS } from '@constants/theme';

export interface StatsOverlayProps {
  currentVal: number;
  isPositive: boolean;
  isDailyPositive: boolean;
  dailyDeltaStr: string;
}

function toGrowthStr(multiplier: number): string {
  const pct = (multiplier - 1) * 100;
  const sign = pct >= 0 ? '+' : '';
  const abs = Math.abs(pct);
  const str = abs >= 1000
    ? `${Math.floor(abs / 1000)},${(abs % 1000).toFixed(1).padStart(5, '0')}`
    : abs.toFixed(1);
  return `${sign}${str}%`;
}

export default function StatsOverlay({ currentVal, isDailyPositive, dailyDeltaStr }: StatsOverlayProps) {
  const [infoVisible, setInfoVisible] = useState(false);

  return (
    <View style={styles.container} pointerEvents="box-none">
      <View style={styles.statsRow}>
        <Text style={styles.totalGrowth}>{toGrowthStr(currentVal)} total</Text>
        <Pressable onPress={() => setInfoVisible(v => !v)} hitSlop={10} style={styles.infoButton}>
          <Text style={styles.infoIcon}>ⓘ</Text>
        </Pressable>
      </View>

      <View style={styles.dailyRow}>
        <Text style={[styles.dailyChange, { color: isDailyPositive ? COLORS.win : COLORS.loss }]}>
          {isDailyPositive ? '↑' : '↓'} {dailyDeltaStr} today
        </Text>
      </View>

      <Modal
        visible={infoVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setInfoVisible(false)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setInfoVisible(false)}>
          <View style={styles.infoPanel}>
            <Text style={styles.infoPanelTitle}>How it works</Text>

            <Text style={styles.infoPanelBody}>
              Each day you follow through on a habit, you grow 1% better. Each time you don't, you slip 1% behind. It feels small in the moment, but over time, these tiny changes multiply:
            </Text>

            <View style={styles.formulaRow}>
              <Text style={styles.infoPanelFormula}>Score = 1.01</Text>
              <Text style={styles.superscript}> wins</Text>
              <Text style={styles.infoPanelFormula}> × 0.99</Text>
              <Text style={styles.superscript}> losses</Text>
            </View>

            <Text style={styles.infoPanelBody}>
              Changes seems invisible at first, but the math tells a different story:
            </Text>

            <View style={styles.statsGrid}>
              <View style={styles.statRow}>
                <Text style={styles.statLabel}>30 perfect days</Text>
                <Text style={[styles.statVal, { color: COLORS.win }]}>+34.8%</Text>
              </View>
              <View style={styles.statRow}>
                <Text style={styles.statLabel}>90 days</Text>
                <Text style={[styles.statVal, { color: COLORS.win }]}>+144.9%</Text>
              </View>
              <View style={styles.statRow}>
                <Text style={styles.statLabel}>A full year</Text>
                <Text style={[styles.statVal, { color: COLORS.win }]}>+3,678%</Text>
              </View>
            </View>

            <Text style={styles.infoPanelBody}>
              You don't need to do it right - just show up. Let compounding do the work.
            </Text>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 16,   // PAD.top
    left: 14,  // PAD.left + 6
    gap: 1,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  totalGrowth: {
    color: COLORS.text,
    fontSize: 18,
    fontFamily: FONTS.body.semiBold,
    fontVariant: ['tabular-nums'],
    letterSpacing: -0.5,
    lineHeight: 20,
  },
  infoButton: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoIcon: {
    color: COLORS.textMuted,
    fontSize: 14,
    lineHeight: 20,
  },
  dailyRow: {
    marginTop: 3,
  },
  dailyChange: {
    fontSize: 13,
    fontFamily: FONTS.body.medium,
    fontVariant: ['tabular-nums'],
  },
  modalBackdrop: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
    paddingTop: 80,
    paddingLeft: 14,
  },
  infoPanel: {
    backgroundColor: COLORS.bgCard,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.border,
    minWidth: 220,
    maxWidth: 270,
    gap: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 6,
  },
  infoPanelTitle: {
    color: COLORS.text,
    fontSize: 11,
    fontFamily: FONTS.body.semiBold,
    letterSpacing: 0.2,
    marginBottom: 2,
  },
  infoPanelBody: {
    color: COLORS.textSecondary,
    fontSize: 11.5,
    fontFamily: FONTS.body.regular,
    lineHeight: 16,
  },
  formulaRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginTop: 2,
  },
  superscript: {
    color: COLORS.text,
    fontSize: 9.5,
    fontFamily: FONTS.body.medium,
    marginBottom: 3,
    letterSpacing: 0.1,
  },
  infoPanelFormula: {
    color: COLORS.text,
    fontSize: 11,
    fontFamily: FONTS.body.medium,
    letterSpacing: 0.2,
  },
  statsGrid: {
    gap: 2,
    marginTop: 2,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statLabel: {
    color: COLORS.textSecondary,
    fontSize: 11,
    fontFamily: FONTS.body.semiBold,
  },
  statVal: {
    fontSize: 11,
    fontFamily: FONTS.body.semiBold,
    fontVariant: ['tabular-nums'],
  },
});
