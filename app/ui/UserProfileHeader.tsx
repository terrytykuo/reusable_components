import { View, Text, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { DesignTokens, resolveTokens } from '../types/tokens';

interface Props {
  name: string;
  email?: string;
  avatarUri?: string;
  /** 頭像尺寸，預設 120 */
  avatarSize?: number;
  tokens?: Partial<DesignTokens>;
}

/**
 * UserProfileHeader
 * 圓形頭像 + 名稱 + email 的帳號頁頂部區塊。
 * avatarUri 不傳時顯示名稱首字母的純色佔位。
 */
export function UserProfileHeader({ name, email, avatarUri, avatarSize = 120, tokens }: Props) {
  const t = resolveTokens(tokens);
  const s = makeStyles(t, avatarSize);

  return (
    <View style={s.container}>
      {avatarUri ? (
        <Image
          source={{ uri: avatarUri }}
          style={s.avatar}
          contentFit="cover"
          cachePolicy="disk"
        />
      ) : (
        <View style={[s.avatar, s.avatarPlaceholder]}>
          <Text style={s.avatarInitial}>{name.charAt(0).toUpperCase()}</Text>
        </View>
      )}
      <Text style={s.name}>{name}</Text>
      {email && <Text style={s.email}>{email}</Text>}
    </View>
  );
}

function makeStyles(t: DesignTokens, avatarSize: number) {
  return StyleSheet.create({
    container: {
      alignItems: 'center',
      gap: t.spacing.scale[3], // 16
    },
    avatar: {
      width: avatarSize,
      height: avatarSize,
      borderRadius: avatarSize / 2,
    },
    avatarPlaceholder: {
      backgroundColor: t.colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
    },
    avatarInitial: {
      fontFamily: t.typography['font-heading'],
      fontSize: avatarSize * 0.4,
      color: '#FFFFFF',
    },
    name: {
      fontFamily: t.typography['font-heading'],
      fontSize: t.typography.scale[5], // 24
      color: t.colors.text,
      textAlign: 'center',
    },
    email: {
      fontFamily: t.typography['font-body'],
      fontSize: t.typography.scale[2], // 16
      color: t.colors.textSecondary,
      textAlign: 'center',
    },
  });
}
