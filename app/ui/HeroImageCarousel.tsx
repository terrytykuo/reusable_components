import { View, Text, Pressable, StyleSheet, Dimensions } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import { Image } from 'expo-image';
import { useState } from 'react';
import { DesignTokens, resolveTokens } from '../types/tokens';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface Props {
  images: string[];
  height?: number;
  /** 點擊返回按鈕的 callback；不傳則不顯示返回按鈕 */
  onBack?: () => void;
  /** 自訂寬度，預設使用螢幕寬度 */
  width?: number;
  tokens?: Partial<DesignTokens>;
}

/**
 * HeroImageCarousel
 * 全寬橫向圖片輪播，底部顯示 dots 指示器，左上角可選顯示返回按鈕。
 * 依賴 react-native-gesture-handler 的 ScrollView 以支援 Android paging。
 */
export function HeroImageCarousel({ images, height = 320, onBack, width = SCREEN_WIDTH, tokens }: Props) {
  const t = resolveTokens(tokens);
  const s = makeStyles(t, width, height);
  const [currentIndex, setCurrentIndex] = useState(0);

  if (images.length === 0) {
    return (
      <View style={[s.container, s.empty]}>
        <Text style={s.emptyText}>No image</Text>
      </View>
    );
  }

  return (
    <View style={s.container}>
      <ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(e) => {
          const index = Math.round(e.nativeEvent.contentOffset.x / width);
          setCurrentIndex(index);
        }}
        style={{ width, height }}
      >
        {images.map((uri) => (
          <Image
            key={uri}
            source={{ uri }}
            style={s.image}
            contentFit="cover"
            cachePolicy="disk"
          />
        ))}
      </ScrollView>

      {onBack && (
        <Pressable style={s.backButton} onPress={onBack}>
          <Text style={s.backIcon}>←</Text>
        </Pressable>
      )}

      {images.length >= 2 && (
        <View style={s.dots}>
          {images.map((_, i) => (
            <View key={i} style={[s.dot, i === currentIndex && s.dotActive]} />
          ))}
        </View>
      )}
    </View>
  );
}

function makeStyles(t: DesignTokens, width: number, height: number) {
  return StyleSheet.create({
    container: { position: 'relative', width, height },
    image: { width, height },
    empty: {
      backgroundColor: t.colors.border,
      justifyContent: 'center',
      alignItems: 'center',
    },
    emptyText: {
      fontFamily: t.typography['font-body'],
      fontSize: t.typography.scale[1],
      color: t.colors.textMuted,
    },
    backButton: {
      position: 'absolute',
      top: 50,
      left: 20,
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: 'rgba(0,0,0,0.6)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    backIcon: { color: '#FFFFFF', fontSize: 20, lineHeight: 24 },
    dots: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      height: 28,
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      gap: 8,
    },
    dot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: 'rgba(255,255,255,0.4)',
    },
    dotActive: { backgroundColor: '#FFFFFF' },
  });
}
