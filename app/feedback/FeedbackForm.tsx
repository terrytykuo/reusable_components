import { View, Text, TextInput, Pressable, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { useState } from 'react';
import { DesignTokens, resolveTokens } from '../types/tokens';

interface Props {
  /**
   * 自訂送出邏輯。傳入後，內建的 Firestore 寫入不會執行。
   * 若不傳，必須傳入 firestoreCollection 並在 app 端設定好 Firebase。
   */
  onSubmit?: (message: string) => Promise<void>;
  /**
   * Firestore collection 名稱，預設 'feedback'。
   * 僅在未傳 onSubmit 時生效，需搭配 app 端初始化的 firebase/firestore db。
   */
  firestoreCollection?: string;
  /** 附加到每筆 Firestore 記錄的 user email */
  userEmail?: string | null;
  placeholder?: string;
  /** 送出成功後的提示訊息，預設 'Thank you for your feedback!' */
  successMessage?: string;
  tokens?: Partial<DesignTokens>;
}

/**
 * FeedbackForm
 * 多行文字輸入框 + 送出按鈕。支援兩種模式：
 * 1. 傳入 onSubmit — 完全自訂送出邏輯（推薦，與 Firebase 無關）
 * 2. 不傳 onSubmit — 使用內建 Firestore 寫入（需 app 端已初始化 Firebase）
 */
export function FeedbackForm({
  onSubmit,
  firestoreCollection = 'feedback',
  userEmail,
  placeholder = 'Share your thoughts...',
  successMessage = 'Thank you for your feedback!',
  tokens,
}: Props) {
  const t = resolveTokens(tokens);
  const s = makeStyles(t);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  async function handleSend() {
    if (!message.trim()) return;
    setSending(true);
    try {
      if (onSubmit) {
        await onSubmit(message.trim());
      } else {
        // 內建 Firestore 寫入（lazy import，避免強制依賴 firebase）
        const { collection, addDoc, serverTimestamp } = await import('firebase/firestore');
        const { db } = await import('../_internal/firebaseInstance');
        await addDoc(collection(db, firestoreCollection), {
          message: message.trim(),
          userEmail: userEmail ?? null,
          createdAt: serverTimestamp(),
        });
      }
      setMessage('');
      Alert.alert('', successMessage);
    } catch {
      Alert.alert('Error', 'Failed to send. Please try again.');
    } finally {
      setSending(false);
    }
  }

  return (
    <View style={s.container}>
      <View style={s.inputWrap}>
        <TextInput
          value={message}
          onChangeText={setMessage}
          placeholder={placeholder}
          placeholderTextColor={t.colors.textMuted}
          multiline
          numberOfLines={6}
          style={s.input}
          textAlignVertical="top"
        />
      </View>
      <Pressable style={s.button} onPress={handleSend} disabled={sending}>
        {sending ? (
          <ActivityIndicator size="small" color={t.colors.primary} />
        ) : (
          <Text style={s.buttonText}>Send</Text>
        )}
      </Pressable>
    </View>
  );
}

function makeStyles(t: DesignTokens) {
  return StyleSheet.create({
    container: { gap: t.spacing.scale[3], alignItems: 'center' }, // 16
    inputWrap: {
      width: '100%',
      backgroundColor: t.colors.surface,
      borderRadius: t.radius[2], // 20
      borderWidth: 1,
      borderColor: t.colors.border,
      paddingHorizontal: t.spacing.scale[3], // 16
      paddingVertical: t.spacing.scale[2], // 12
    },
    input: {
      minHeight: 110,
      fontFamily: t.typography['font-body'],
      fontSize: t.typography.scale[2], // 16
      color: t.colors.text,
      lineHeight: 24,
    },
    button: {
      width: 220,
      height: 44,
      borderRadius: t.radius[4], // 9999
      borderWidth: 1.5,
      borderColor: t.colors.primary,
      backgroundColor: t.colors.surface,
      justifyContent: 'center',
      alignItems: 'center',
    },
    buttonText: {
      fontFamily: t.typography['font-body'],
      fontSize: t.typography.scale[2], // 16
      color: t.colors.primary,
    },
  });
}
