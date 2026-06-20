import { Pressable, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { resolveTokens, type DesignTokens } from '../types/tokens';

export interface OnboardingBackButtonProps {
  /** 距容器左緣的絕對距離（px） */
  left: number;
  /** 距容器上緣的絕對距離（px） */
  top: number;
  /** 按鈕直徑（px）；圖示為其 0.68 倍 */
  size: number;
  onPress: () => void;
  disabled?: boolean;
  /** @expo/vector-icons MaterialCommunityIcons 名稱，預設 'chevron-left' */
  icon?: keyof typeof MaterialCommunityIcons.glyphMap;
  tokens?: Partial<DesignTokens>;
}

/**
 * 絕對定位的圓形返回鈕（@expo/vector-icons），常疊在 onboarding / hero 圖上。
 *
 * 解耦：背景 / 邊框 / 圖示色改由 tokens 推導（surface / border / text），
 * 並沿用 tokens 慣例；位置與尺寸由 left / top / size 控制。
 */
export function OnboardingBackButton({
  disabled,
  left,
  onPress,
  size,
  top,
  icon = 'chevron-left',
  tokens,
}: OnboardingBackButtonProps) {
  const t = resolveTokens(tokens);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Back"
      disabled={disabled}
      hitSlop={8}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor: t.colors.surface,
          borderColor: t.colors.border,
          borderRadius: size / 2,
          height: size,
          left,
          opacity: disabled ? 0.45 : pressed ? 0.75 : 1,
          top,
          width: size,
        },
      ]}
    >
      <MaterialCommunityIcons name={icon} size={size * 0.68} color={t.colors.text} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    position: 'absolute',
    zIndex: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
});
