import React, { useState } from 'react';
import { StyleSheet } from 'react-native';
import { Calendar, DateData, LocaleConfig } from 'react-native-calendars';
import { COLORS, FONTS } from '@constants/theme';

LocaleConfig.locales['en'] = {
  monthNames: ['January','February','March','April','May','June','July','August','September','October','November','December'],
  monthNamesShort: ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'],
  dayNames: ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'],
  dayNamesShort: ['S','M','T','W','T','F','S'],
  today: 'Today',
};
LocaleConfig.defaultLocale = 'en';

interface Props {
  logMap: Record<string, 'done' | 'missed'>;
  onDayPress: (day: DateData) => void;
}

export default function HabitCalendar({ logMap, onDayPress }: Props) {
  const now = new Date();
  const [currentMonth, setCurrentMonth] = useState(
    `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`
  );

  const markedDates = Object.fromEntries(
    Object.entries(logMap)
      .filter(([, status]) => status === 'done')
      .map(([date]) => {
        const [y, mo, dd] = date.split('-').map(Number);
        const prev = new Date(y, mo - 1, dd - 1);
        const next = new Date(y, mo - 1, dd + 1);
        const prevKey = `${prev.getFullYear()}-${String(prev.getMonth()+1).padStart(2,'0')}-${String(prev.getDate()).padStart(2,'0')}`;
        const nextKey = `${next.getFullYear()}-${String(next.getMonth()+1).padStart(2,'0')}-${String(next.getDate()).padStart(2,'0')}`;
        return [date, {
          color: COLORS.winLight,
          startingDay: logMap[prevKey] !== 'done',
          endingDay:   logMap[nextKey] !== 'done',
        }];
      })
  );

  const maxDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

  return (
    <Calendar
      style={styles.calendar}
      current={currentMonth}
      markingType="period"
      markedDates={markedDates}
      onDayPress={onDayPress}
      onMonthChange={(month: DateData) =>
        setCurrentMonth(`${month.year}-${String(month.month).padStart(2, '0')}-01`)
      }
      maxDate={maxDate}
      theme={{
        backgroundColor: COLORS.bg,
        calendarBackground: COLORS.bg,
        textSectionTitleColor: COLORS.textMuted,
        dayTextColor: COLORS.text,
        todayTextColor: COLORS.win,
        todayBackgroundColor: 'transparent',
        arrowColor: COLORS.text,
        monthTextColor: COLORS.text,
        textDayFontFamily: FONTS.heading.semiBold,
        textMonthFontFamily: FONTS.heading.semiBold,
        textDayHeaderFontFamily: FONTS.heading.semiBold,
        textDayFontSize: 13,
        textMonthFontSize: 15,
        textDayHeaderFontSize: 12,
      }}
    />
  );
}

const styles = StyleSheet.create({
  calendar: {
    paddingHorizontal: 10,
    paddingBottom: 12,
  },
});
