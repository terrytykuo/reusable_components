import { useWindowDimensions } from 'react-native';

/** 預設 tablet 斷點寬度（px） */
export const DEFAULT_TABLET_BREAKPOINT = 768;
/** 預設內容區最大寬度（px） */
export const DEFAULT_CONTENT_MAX_WIDTH = 720;
/** 預設手機 page padding（px） */
export const DEFAULT_PHONE_PADDING = 20;
/** 預設 tablet page padding（px） */
export const DEFAULT_TABLET_PADDING = 48;

export interface UseLayoutOptions {
  /** tablet 斷點寬度，預設 768 */
  tabletBreakpoint?: number;
  /** 內容區最大寬度，預設 720 */
  contentMaxWidth?: number;
  /** 手機時的水平 padding，預設 20 */
  phonePadding?: number;
  /** tablet 時的水平 padding，預設 48 */
  tabletPadding?: number;
}

export interface UseLayoutResult {
  width: number;
  height: number;
  /** 是否達到 tablet 斷點 */
  isTablet: boolean;
  /** 依裝置寬度動態計算的水平 padding */
  pagePadding: number;
  /** 內容區最大寬度 */
  contentMaxWidth: number;
}

/**
 * 響應式 layout hook：tablet 斷點偵測、內容最大寬度、動態 padding。
 *
 * 解耦：斷點 / maxWidth / padding 全改為可選參數，未傳時使用預設值。
 *
 * @example
 * const { isTablet, pagePadding, contentMaxWidth } = useLayout();
 * const { isTablet } = useLayout({ tabletBreakpoint: 900, contentMaxWidth: 960 });
 */
export function useLayout(options: UseLayoutOptions = {}): UseLayoutResult {
  const {
    tabletBreakpoint = DEFAULT_TABLET_BREAKPOINT,
    contentMaxWidth = DEFAULT_CONTENT_MAX_WIDTH,
    phonePadding = DEFAULT_PHONE_PADDING,
    tabletPadding = DEFAULT_TABLET_PADDING,
  } = options;

  const { width, height } = useWindowDimensions();
  const isTablet = width >= tabletBreakpoint;
  const pagePadding = isTablet ? tabletPadding : phonePadding;

  return {
    width,
    height,
    isTablet,
    pagePadding,
    contentMaxWidth,
  };
}
