import { useMemo } from 'react';
import type { ReactNode } from 'react';
import { PanResponder, StyleSheet, View } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';

/** 啟動水平 swipe 攔截所需的最小位移（px） */
const DEFAULT_INTENT_DISTANCE = 16;
/** 判定為一次 swipe 的最小距離（px） */
const DEFAULT_SWIPE_DISTANCE = 52;
/** 短距離快滑的速度門檻 */
const DEFAULT_SWIPE_VELOCITY = 0.35;
/** 短距離 + 高速度時所需的最小距離（px） */
const DEFAULT_VELOCITY_MIN_DISTANCE = 28;

export interface OnboardingSwipeViewProps {
  children: ReactNode;
  disabled?: boolean;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  /** 攔截手勢前的最小水平位移，預設 16 */
  intentDistance?: number;
  /** 判定 swipe 的最小水平距離，預設 52 */
  swipeDistance?: number;
  /** 短滑時的速度門檻，預設 0.35 */
  swipeVelocity?: number;
  /** 短滑速度判定下的最小距離，預設 28 */
  velocityMinDistance?: number;
  style?: StyleProp<ViewStyle>;
}

/**
 * 以 PanResponder 偵測水平 swipe 的容器，常用於 onboarding 翻頁。
 *
 * 解耦：velocity / distance 門檻全部可參數化；只攔截水平意圖明顯
 * （|dx| > |dy| * 1.25）且有對應 handler 的手勢，避免吃掉垂直捲動。
 */
export function OnboardingSwipeView({
  children,
  disabled = false,
  onSwipeLeft,
  onSwipeRight,
  intentDistance = DEFAULT_INTENT_DISTANCE,
  swipeDistance = DEFAULT_SWIPE_DISTANCE,
  swipeVelocity = DEFAULT_SWIPE_VELOCITY,
  velocityMinDistance = DEFAULT_VELOCITY_MIN_DISTANCE,
  style,
}: OnboardingSwipeViewProps) {
  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => false,
        onMoveShouldSetPanResponder: (_, gesture) => {
          if (disabled) return false;

          const absX = Math.abs(gesture.dx);
          const absY = Math.abs(gesture.dy);
          const hasHandler = gesture.dx < 0 ? !!onSwipeLeft : !!onSwipeRight;

          return hasHandler && absX > intentDistance && absX > absY * 1.25;
        },
        onPanResponderRelease: (_, gesture) => {
          if (disabled) return;

          const absX = Math.abs(gesture.dx);
          const absY = Math.abs(gesture.dy);
          const isSwipe =
            absX >= swipeDistance ||
            (absX >= velocityMinDistance && Math.abs(gesture.vx) >= swipeVelocity);

          if (!isSwipe || absX <= absY * 1.25) return;

          if (gesture.dx < 0) {
            onSwipeLeft?.();
          } else {
            onSwipeRight?.();
          }
        },
      }),
    [
      disabled,
      onSwipeLeft,
      onSwipeRight,
      intentDistance,
      swipeDistance,
      swipeVelocity,
      velocityMinDistance,
    ],
  );

  return (
    <View style={[styles.container, style]} {...panResponder.panHandlers}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
