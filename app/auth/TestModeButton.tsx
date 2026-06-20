import { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  ViewStyle,
} from 'react-native';
import { DesignTokens, resolveTokens } from '../types/tokens';

interface Props {
  onPress: () => Promise<void>;
  label?: string;
  disabled?: boolean;
  visible?: boolean;
  tokens?: Partial<DesignTokens>;
  style?: StyleProp<ViewStyle>;
}

/**
 * Development-only CTA for anonymous sign-in, preview mode, or QA shortcuts.
 * Hidden by default in production builds via `visible = __DEV__`.
 */
export function TestModeButton({
  onPress,
  label = 'Skip - Test Mode',
  disabled = false,
  visible = __DEV__,
  tokens,
  style,
}: Props) {
  const t = resolveTokens(tokens);
  const s = makeStyles(t);
  const [loading, setLoading] = useState(false);

  if (!visible) return null;

  async function handlePress() {
    if (disabled || loading) return;
    setLoading(true);
    try {
      await onPress();
    } finally {
      setLoading(false);
    }
  }

  return (
    <Pressable
      style={[s.button, (disabled || loading) && s.disabled, style]}
      onPress={handlePress}
      disabled={disabled || loading}
    >
      {loading ? (
        <ActivityIndicator color={t.colors.textMuted} />
      ) : (
        <Text style={s.label}>{label}</Text>
      )}
    </Pressable>
  );
}

function makeStyles(t: DesignTokens) {
  return StyleSheet.create({
    button: {
      alignItems: 'center',
      justifyContent: 'center',
      width: '100%',
      height: 44,
      borderRadius: t.radius[3],
      borderWidth: 1,
      borderColor: t.colors.border,
      borderStyle: 'dashed',
      backgroundColor: 'transparent',
    },
    label: {
      fontFamily: t.typography['font-body'],
      fontSize: t.typography.scale[1],
      color: t.colors.textMuted,
    },
    disabled: {
      opacity: 0.6,
    },
  });
}
