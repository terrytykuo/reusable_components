import { View, Text, StyleSheet } from 'react-native';
import { DesignTokens, resolveTokens } from '../types/tokens';

export interface StatusConfig {
  /** 顯示文字 */
  label: string;
  /** 顯示顏色（hex） */
  color: string;
}

interface Props {
  /** 對應 statusMap 的 key */
  status: string;
  /** 每個 status key 對應的 label + color */
  statusMap: Record<string, StatusConfig>;
  size?: 'sm' | 'lg';
  tokens?: Partial<DesignTokens>;
}

/**
 * StatusBadge
 * 彩色圓點 + 標籤的狀態 badge，顏色與文字由外部 statusMap 定義。
 */
export function StatusBadge({ status, statusMap, size = 'sm', tokens }: Props) {
  const t = resolveTokens(tokens);
  const config = statusMap[status];
  if (!config) return null;

  const { label, color } = config;
  const s = makeStyles(t);

  return (
    <View style={[s.badge, { borderColor: color, backgroundColor: color + '18' }]}>
      <View style={[s.dot, { backgroundColor: color }]} />
      <Text style={[s.label, { color, fontSize: size === 'lg' ? 14 : t.typography.scale[0] }]}>
        {label}
      </Text>
    </View>
  );
}

function makeStyles(t: DesignTokens) {
  return StyleSheet.create({
    badge: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: t.radius[0], // 8
      borderWidth: 1.5,
      gap: 6,
      alignSelf: 'flex-start',
    },
    dot: { width: 7, height: 7, borderRadius: 3.5 },
    label: {
      fontFamily: t.typography['font-body'],
      fontSize: t.typography.scale[0], // 12
      letterSpacing: 0.8,
    },
  });
}
