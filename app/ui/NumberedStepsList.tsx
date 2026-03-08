import { View, Text, StyleSheet } from 'react-native';
import { DesignTokens, resolveTokens } from '../types/tokens';

export interface Step {
  title: string;
  description?: string;
}

interface Props {
  steps: Step[];
  title?: string;
  tokens?: Partial<DesignTokens>;
}

/**
 * NumberedStepsList
 * 帶圓形數字編號的有序步驟列表，每步包含標題與可選的說明文字。
 */
export function NumberedStepsList({ steps, title, tokens }: Props) {
  const t = resolveTokens(tokens);
  const s = makeStyles(t);

  return (
    <View style={s.container}>
      {title && <Text style={s.title}>{title}</Text>}
      {steps.map((step, i) => (
        <View key={i} style={s.row}>
          <View style={s.numberCircle}>
            <Text style={s.numberText}>{i + 1}</Text>
          </View>
          <View style={s.content}>
            <Text style={s.stepTitle}>{step.title}</Text>
            {step.description && (
              <Text style={s.stepDesc}>{step.description}</Text>
            )}
          </View>
        </View>
      ))}
    </View>
  );
}

function makeStyles(t: DesignTokens) {
  return StyleSheet.create({
    container: { gap: t.spacing.scale[2] }, // 12
    title: {
      fontFamily: t.typography['font-heading'],
      fontSize: t.typography.scale[4], // 20
      color: t.colors.text,
      marginBottom: t.spacing.scale[0], // 4
    },
    row: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: t.spacing.scale[2], // 12
      paddingVertical: 4,
    },
    numberCircle: {
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: t.colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 1,
    },
    numberText: {
      fontFamily: t.typography['font-body'],
      fontSize: t.typography.scale[0], // 12
      color: '#FFFFFF',
    },
    content: { flex: 1 },
    stepTitle: {
      fontFamily: t.typography['font-body'],
      fontSize: t.typography.scale[2], // 16
      color: t.colors.text,
    },
    stepDesc: {
      fontFamily: t.typography['font-body'],
      fontSize: t.typography.scale[1], // 14
      color: t.colors.textSecondary,
      lineHeight: 20,
      marginTop: 2,
    },
  });
}
