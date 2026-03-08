import { View, Text, TextInput, Pressable, StyleSheet, Animated } from 'react-native';
import { useRef, useState } from 'react';
import { DesignTokens, resolveTokens } from '../types/tokens';

interface Props {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  tokens?: Partial<DesignTokens>;
  /** 左側 icon，預設不顯示（可傳入任何 ReactNode，例如 <Ionicons name="search" />） */
  icon?: React.ReactNode;
}

/**
 * SearchBar
 * 帶 focus 動畫邊框的搜尋輸入框，value 不為空時顯示清除按鈕。
 */
export function SearchBar({ value, onChangeText, placeholder = 'Search...', tokens, icon }: Props) {
  const t = resolveTokens(tokens);
  const [, setFocused] = useState(false);
  const borderAnim = useRef(new Animated.Value(0)).current;

  const handleFocus = () => {
    setFocused(true);
    Animated.timing(borderAnim, { toValue: 1, duration: 200, useNativeDriver: false }).start();
  };

  const handleBlur = () => {
    setFocused(false);
    Animated.timing(borderAnim, { toValue: 0, duration: 200, useNativeDriver: false }).start();
  };

  const borderColor = borderAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [t.colors.border, t.colors.primary],
  });

  const s = makeStyles(t);

  return (
    <Animated.View style={[s.container, { borderColor }]}>
      {icon ?? null}
      <TextInput
        style={s.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={t.colors.textMuted}
        onFocus={handleFocus}
        onBlur={handleBlur}
        autoCapitalize="none"
        autoCorrect={false}
        returnKeyType="search"
      />
      {value.length > 0 && (
        <Pressable onPress={() => onChangeText('')} hitSlop={8}>
          <Text style={s.clear}>✕</Text>
        </Pressable>
      )}
    </Animated.View>
  );
}

function makeStyles(t: DesignTokens) {
  return StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: t.colors.surface,
      borderRadius: t.radius[3], // 32
      borderWidth: 1.5,
      paddingHorizontal: t.spacing.scale[1] + 6, // 14
      height: 50,
      gap: t.spacing.scale[1], // 8
    },
    input: {
      flex: 1,
      fontFamily: t.typography['font-body'],
      fontSize: t.typography.scale[2], // 16
      color: t.colors.text,
    },
    clear: {
      fontSize: 14,
      color: t.colors.textMuted,
      padding: 4,
    },
  });
}
