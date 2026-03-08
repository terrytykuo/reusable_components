import { View, Text, Pressable, StyleSheet } from 'react-native';
import { DesignTokens, resolveTokens } from '../types/tokens';

interface Props {
  daysLeft: number;
  /** 點擊「升級」按鈕的 callback */
  onUpgradePress: () => void;
  /** 升級按鈕文字，預設 'Upgrade' */
  upgradeLabel?: string;
  tokens?: Partial<DesignTokens>;
}

/**
 * TrialBanner
 * 頂部通知條：顯示剩餘試用天數，右側帶升級 CTA 按鈕。
 * daysLeft <= 0 時自動隱藏。
 */
export function TrialBanner({ daysLeft, onUpgradePress, upgradeLabel = 'Upgrade', tokens }: Props) {
  const t = resolveTokens(tokens);
  const s = makeStyles(t);

  if (daysLeft <= 0) return null;

  return (
    <View style={s.container}>
      <Text style={s.text}>
        Free trial: <Text style={s.bold}>{daysLeft} days left</Text>
      </Text>
      <Pressable onPress={onUpgradePress}>
        <Text style={s.cta}>{upgradeLabel}</Text>
      </Pressable>
    </View>
  );
}

function makeStyles(t: DesignTokens) {
  return StyleSheet.create({
    container: {
      backgroundColor: '#FEF3C7',
      paddingHorizontal: t.spacing.scale[3], // 16
      paddingVertical: t.spacing.scale[1], // 8
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    text: {
      fontFamily: t.typography['font-body'],
      fontSize: t.typography.scale[1], // 14
      color: '#92400E',
    },
    bold: { fontFamily: t.typography['font-body'] },
    cta: {
      fontFamily: t.typography['font-body'],
      fontSize: t.typography.scale[1], // 14
      color: t.colors.primary,
    },
  });
}
