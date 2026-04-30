import React, { useRef, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';

const ITEM_H = 44;
const VISIBLE = 5; // số dòng hiển thị (dòng giữa = được chọn)

const MONTHS_VI = [
  'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4',
  'Tháng 5', 'Tháng 6', 'Tháng 7', 'Tháng 8',
  'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12',
];

interface ColumnProps {
  items: string[];
  selectedIndex: number;
  onSelect: (index: number) => void;
  flex?: number;
}

function WheelColumn({ items, selectedIndex, onSelect, flex = 1 }: ColumnProps) {
  const ref = useRef<ScrollView>(null);

  useEffect(() => {
    // Cuộn đến vị trí ban đầu sau khi render
    const timer = setTimeout(() => {
      ref.current?.scrollTo({ y: selectedIndex * ITEM_H, animated: false });
    }, 50);
    return () => clearTimeout(timer);
  }, []);

  return (
    <ScrollView
      ref={ref}
      style={{ flex, height: ITEM_H * VISIBLE }}
      snapToInterval={ITEM_H}
      decelerationRate="fast"
      showsVerticalScrollIndicator={false}
      nestedScrollEnabled={true}
      scrollEnabled={true}
      contentContainerStyle={{ paddingVertical: ITEM_H * 2 }}
      onMomentumScrollEnd={(e) => {
        const raw = Math.round(e.nativeEvent.contentOffset.y / ITEM_H);
        const idx = Math.max(0, Math.min(raw, items.length - 1));
        onSelect(idx);
      }}
      onScrollEndDrag={(e) => {
        const raw = Math.round(e.nativeEvent.contentOffset.y / ITEM_H);
        const idx = Math.max(0, Math.min(raw, items.length - 1));
        onSelect(idx);
      }}
    >
      {items.map((item, i) => (
        <View key={i} style={s.itemRow}>
          <Text style={[s.itemText, i === selectedIndex && s.selectedText]}>
            {item}
          </Text>
        </View>
      ))}
    </ScrollView>
  );
}

interface DateWheelPickerProps {
  day: number;
  month: number;
  year: number;
  onChange: (day: number, month: number, year: number) => void;
}

export default function DateWheelPicker({ day, month, year, onChange }: DateWheelPickerProps) {
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 101 }, (_, i) => String(currentYear - i));
  const days = Array.from({ length: 31 }, (_, i) => String(i + 1));

  const yearIdx = years.indexOf(String(year));

  return (
    <View style={s.container}>
      {/* Highlight bar ở giữa */}
      <View style={s.highlight} pointerEvents="none" />

      <WheelColumn
        items={days}
        selectedIndex={day - 1}
        onSelect={(i) => onChange(i + 1, month, year)}
        flex={1}
      />
      <WheelColumn
        items={MONTHS_VI}
        selectedIndex={month - 1}
        onSelect={(i) => onChange(day, i + 1, year)}
        flex={2}
      />
      <WheelColumn
        items={years}
        selectedIndex={yearIdx >= 0 ? yearIdx : 0}
        onSelect={(i) => onChange(day, month, parseInt(years[i]))}
        flex={1.5}
      />
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    flexDirection: 'row',
    height: ITEM_H * VISIBLE,
  },
  highlight: {
    position: 'absolute',
    top: ITEM_H * 2,
    left: 0,
    right: 0,
    height: ITEM_H,
    backgroundColor: 'rgba(0,0,0,0.06)',
    borderRadius: 8,
    zIndex: 0,
  },
  itemRow: {
    height: ITEM_H,
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemText: {
    fontSize: 16,
    color: '#C7C7CC',
    fontWeight: '400',
  },
  selectedText: {
    fontSize: 20,
    color: '#000',
    fontWeight: '600',
  },
});
