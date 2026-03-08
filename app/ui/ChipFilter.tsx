import { ScrollView, Pressable, Text, StyleSheet } from 'react-native';
import { DesignTokens, resolveTokens } from '../types/tokens';

export interface ChipItem<T extends string = string> {
  key: T;
  label: string;
  /** 顯示在文字左側的 emoji 或字元 */
  icon?: string;
}

interface Props<T extends string = string> {
  items: ChipItem<T>[];
  selected: T;
  onSelect: (key: T) => void;
  tokens?: Partial<DesignTokens>;
}

/**
 * ChipFilter
 * 水平可捲動的篩選 chip 列。選中時顯示 primary 色邊框與淡色背景。
 */
export function ChipFilter<T extends string = string>({
  items,
  selected,
  onSelect,
  tokens,
}: Props<T>) {
  const t = resolveTokens(tokens);
  const s = makeStyles(t);

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={s.container}
    >
      {items.map((item) => {
        const isSelected = selected === item.key;
        return (
          <Pressable
            key={item.key}
            style={[s.chip, isSelected && s.chipSelected]}
            onPress={() => onSelect(item.key)}
          >
            {item.icon && <Text style={s.icon}>{item.icon}</Text>}
            <Text style={[s.label, isSelected && s.labelSelected]}>
              {item.label}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

function makeStyles(t: DesignTokens) {
  return StyleSheet.create({
    container: {
      paddingHorizontal: t.spacing.scale[3], // 16
      gap: t.spacing.scale[1], // 8
      paddingVertical: 1,
      alignItems: 'center',
    },
    chip: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: t.spacing.scale[1] + 6, // 14
      paddingVertical: 6,
      borderRadius: t.radius[4], // 9999
      borderWidth: 1.5,
      borderColor: t.colors.border,
      backgroundColor: t.colors.surface,
      gap: 5,
    },
    chipSelected: {
      borderColor: t.colors.primary,
      backgroundColor: t.colors.primary + '14',
    },
    icon: { fontSize: 16 },
    label: {
      fontFamily: t.typography['font-body'],
      fontSize: t.typography.scale[1], // 14
      color: t.colors.textSecondary,
    },
    labelSelected: { color: t.colors.primary },
  });
}
