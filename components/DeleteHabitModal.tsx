import React from 'react';
import { Modal, Pressable, Text, StyleSheet, View } from 'react-native';
import { Habit } from '@components/HabitCard';
import { COLORS, FONTS } from '@constants/theme';

interface Props {
  habit: Habit | null;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function DeleteHabitModal({ habit, onConfirm, onCancel }: Props) {
  return (
    <Modal
      visible={!!habit}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <Pressable style={styles.overlay} onPress={onCancel}>
        <Pressable style={styles.sheet} onPress={() => {}}>
          <Text style={styles.title}>Delete "{habit?.name}"?</Text>
          <Text style={styles.body}>
            This will permanently delete your habit and undo all your compounding progress. Your streak and growth will be lost.
          </Text>
          <Pressable style={styles.deleteBtn} onPress={onConfirm}>
            <Text style={styles.deleteText}>Delete habit</Text>
          </Pressable>
          <Pressable style={styles.cancelBtn} onPress={onCancel}>
            <Text style={styles.cancelText}>Keep it</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: COLORS.bg,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 40,
  },
  title: {
    color: COLORS.text,
    fontSize: 20,
    fontFamily: FONTS.heading.semiBold,
    letterSpacing: -0.4,
    marginBottom: 10,
  },
  body: {
    color: COLORS.textMuted,
    fontSize: 15,
    fontFamily: FONTS.body.regular,
    lineHeight: 22,
    marginBottom: 28,
  },
  deleteBtn: {
    backgroundColor: COLORS.loss,
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
    marginBottom: 10,
  },
  deleteText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: FONTS.body.medium,
    letterSpacing: -0.2,
  },
  cancelBtn: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.neutral,
    paddingVertical: 15,
    alignItems: 'center',
  },
  cancelText: {
    color: COLORS.text,
    fontSize: 16,
    fontFamily: FONTS.body.medium,
    letterSpacing: -0.2,
  },
});
