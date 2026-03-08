import { View, Text, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { useState } from 'react';
import { DesignTokens, resolveTokens } from '../types/tokens';

type Provider = 'apple' | 'google';

interface Props {
  onApplePress: () => Promise<void>;
  onGooglePress: () => Promise<void>;
  /** Apple 登入按鈕是否可用（iOS only，由 expo-apple-authentication.isAvailableAsync 決定） */
  appleAvailable?: boolean;
  /** 自訂 Apple 按鈕文字，預設 'Continue with Apple' */
  appleLabel?: string;
  /** 自訂 Google 按鈕文字，預設 'Continue with Google' */
  googleLabel?: string;
  /** 錯誤訊息；傳入非空字串即顯示 */
  error?: string;
  tokens?: Partial<DesignTokens>;
}

/**
 * SocialAuthButtons
 * Apple + Google 登入按鈕組合。
 * - 不依賴 expo-apple-authentication（由外部控制 appleAvailable）
 * - 不依賴 expo-auth-session（onGooglePress 由外部傳入）
 * - loading 狀態由 onApplePress / onGooglePress 的 Promise 生命週期自動管理
 *
 * 使用方式：
 * ```tsx
 * <SocialAuthButtons
 *   appleAvailable={isIOS}
 *   onApplePress={async () => { await signInWithApple(); router.replace('/home'); }}
 *   onGooglePress={async () => { await promptGoogleAsync(); }}
 * />
 * ```
 */
export function SocialAuthButtons({
  onApplePress,
  onGooglePress,
  appleAvailable = false,
  appleLabel = 'Continue with Apple',
  googleLabel = 'Continue with Google',
  error,
  tokens,
}: Props) {
  const t = resolveTokens(tokens);
  const s = makeStyles(t);
  const [loading, setLoading] = useState<Provider | null>(null);

  async function handle(provider: Provider, fn: () => Promise<void>) {
    setLoading(provider);
    try {
      await fn();
    } finally {
      setLoading(null);
    }
  }

  const busy = loading !== null;

  return (
    <View style={s.container}>
      {error ? <Text style={s.error}>{error}</Text> : null}

      {appleAvailable && (
        <Pressable
          style={[s.appleButton, busy && s.disabled]}
          onPress={() => handle('apple', onApplePress)}
          disabled={busy}
        >
          {loading === 'apple' ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={s.appleLabel}>{appleLabel}</Text>
          )}
        </Pressable>
      )}

      <Pressable
        style={[s.googleButton, busy && s.disabled]}
        onPress={() => handle('google', onGooglePress)}
        disabled={busy}
      >
        {loading === 'google' ? (
          <ActivityIndicator color={t.colors.text} />
        ) : (
          <>
            <Text style={s.googleIcon}>G</Text>
            <Text style={s.googleLabel}>{googleLabel}</Text>
          </>
        )}
      </Pressable>
    </View>
  );
}

function makeStyles(t: DesignTokens) {
  return StyleSheet.create({
    container: { gap: t.spacing.scale[2], alignItems: 'center', width: '100%' }, // 12
    error: {
      fontFamily: t.typography['font-body'],
      fontSize: t.typography.scale[1],
      color: t.colors.danger,
      textAlign: 'center',
    },
    appleButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      width: '100%',
      height: 52,
      borderRadius: t.radius[3], // 32
      backgroundColor: '#000000',
    },
    appleLabel: {
      fontFamily: t.typography['font-body'],
      fontSize: t.typography.scale[3], // 18
      color: '#FFFFFF',
    },
    googleButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 10,
      width: '100%',
      height: 52,
      borderRadius: t.radius[3], // 32
      backgroundColor: t.colors.surface,
      borderWidth: 1.5,
      borderColor: t.colors.border,
    },
    googleIcon: { fontSize: 18, fontWeight: '700', color: '#4285F4' },
    googleLabel: {
      fontFamily: t.typography['font-body'],
      fontSize: t.typography.scale[3], // 18
      color: t.colors.text,
    },
    disabled: { opacity: 0.6 },
  });
}
