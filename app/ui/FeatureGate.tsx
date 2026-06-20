import { Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { resolveTokens, type DesignTokens } from '../types/tokens';

export interface FeatureGateProps {
  /** 大型主圖示，預設 'home-heart' */
  icon?: keyof typeof MaterialCommunityIcons.glyphMap;
  /** 標題，預設 'Unlock this feature' */
  title?: string;
  /** 說明文字 */
  body?: string;
  /** CTA 按鈕內的小圖示，預設 'lock-open-variant' */
  ctaIcon?: keyof typeof MaterialCommunityIcons.glyphMap;
  /** CTA 按鈕文字，預設 'See plans' */
  ctaLabel?: string;
  /** 點擊 CTA 的 callback（必填，通常導向 paywall） */
  onPress: () => void;
  tokens?: Partial<DesignTokens>;
}

/**
 * 功能限制 / 升級提示卡片：大圖示 + 標題 + 說明 + CTA 按鈕，置中排版。
 *
 * 解耦：移除 expo-router 預設導航，`onPress` 改為必填 callback；
 * 文案 / 圖示皆可覆寫；顏色與字型沿用 tokens 慣例（圖示底圈用
 * primary 的低透明度疊色）。
 */
export function FeatureGate({
  icon = 'home-heart',
  title = 'Unlock this feature',
  body,
  ctaIcon = 'lock-open-variant',
  ctaLabel = 'See plans',
  onPress,
  tokens,
}: FeatureGateProps) {
  const t = resolveTokens(tokens);

  return (
    <View style={styles.container}>
      <View style={[styles.iconWrap, { backgroundColor: withAlpha(t.colors.primary, 0.12) }]}>
        <MaterialCommunityIcons name={icon} size={72} color={t.colors.primary} />
      </View>
      <View style={styles.copy}>
        <Text
          style={[
            styles.title,
            { fontFamily: t.typography['font-heading'], fontSize: t.typography.scale[5], color: t.colors.text },
          ]}
        >
          {title}
        </Text>
        {!!body && (
          <Text
            style={[
              styles.body,
              { fontFamily: t.typography['font-body'], fontSize: t.typography.scale[2], color: t.colors.textSecondary },
            ]}
          >
            {body}
          </Text>
        )}
      </View>
      <Pressable
        style={[styles.primaryButton, { backgroundColor: t.colors.primary, borderRadius: t.radius[4] }]}
        onPress={onPress}
        accessibilityRole="button"
      >
        <MaterialCommunityIcons name={ctaIcon} size={18} color="#FFFFFF" />
        <Text
          style={[styles.primaryButtonText, { fontFamily: t.typography['font-body'], fontSize: t.typography.scale[2] }]}
        >
          {ctaLabel}
        </Text>
      </Pressable>
    </View>
  );
}

/** 將 #RRGGBB 疊上 alpha，輸出 rgba()；非 hex 直接回傳原值 */
function withAlpha(hex: string, alpha: number): string {
  const match = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!match) return hex;
  const int = parseInt(match[1], 16);
  const r = (int >> 16) & 255;
  const g = (int >> 8) & 255;
  const b = int & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 18,
    paddingHorizontal: 28,
  },
  iconWrap: {
    width: 132,
    height: 132,
    borderRadius: 66,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: {
    gap: 8,
    alignItems: 'center',
  },
  title: {
    textAlign: 'center',
  },
  body: {
    lineHeight: 24,
    textAlign: 'center',
  },
  primaryButton: {
    height: 48,
    paddingHorizontal: 22,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  primaryButtonText: {
    color: '#FFFFFF',
  },
});
