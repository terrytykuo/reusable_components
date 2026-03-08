import { View, Text, StyleSheet } from 'react-native';
import { DesignTokens, defaultTokens, resolveTokens } from '../types/tokens';

interface Props {
  text: string;
  tokens?: Partial<DesignTokens>;
  /** 顯示外框（預設 false，只有純文字） */
  boxed?: boolean;
}

/**
 * DisclaimerNote
 * 小字免責聲明，支援純文字或加框版本。
 */
export function DisclaimerNote({ text, tokens, boxed = false }: Props) {
  const t = resolveTokens(tokens);
  const s = makeStyles(t);
  return (
    <View style={[s.container, boxed && s.boxed]}>
      <Text style={s.text}>{text}</Text>
    </View>
  );
}

function makeStyles(t: DesignTokens) {
  return StyleSheet.create({
    container: { paddingHorizontal: 4 },
    boxed: {
      backgroundColor: t.colors.surface,
      borderRadius: t.radius[0],
      borderWidth: 1,
      borderColor: t.colors.border,
      padding: t.spacing.scale[2],
    },
    text: {
      fontFamily: t.typography['font-body'],
      fontSize: t.typography.scale[0], // 12
      color: t.colors.textMuted,
      textAlign: 'center',
      lineHeight: 18,
    },
  });
}
