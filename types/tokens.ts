/**
 * DesignTokens — 對應 .design/system.json 格式
 * 可直接傳入整個 system.json 物件
 */
export interface DesignTokens {
  colors: {
    primary: string;
    background: string;
    surface: string;
    text: string;
    textSecondary: string;
    textMuted: string;
    border: string;
    danger: string;
  };
  typography: {
    'font-heading': string;
    'font-body': string;
    scale: number[]; // [12,14,16,18,20,24,28,32,40,48]
  };
  spacing: {
    scale: number[]; // [4,8,12,16,24,32,48,64,96]
  };
  radius: number[]; // [8,12,20,32,9999]
}

/** 預設 token（來自 cat_toxin_app 的暖色系設計） */
export const defaultTokens: DesignTokens = {
  colors: {
    primary: '#1b9150',
    background: '#F1ECE3',
    surface: '#FFFFFF',
    text: '#2C1810',
    textSecondary: '#7A5C4A',
    textMuted: '#B8967A',
    border: '#E3D8CC',
    danger: '#DC2626',
  },
  typography: {
    'font-heading': 'PlayfairDisplay_700Bold',
    'font-body': 'DMSans_400Regular',
    scale: [12, 14, 16, 18, 20, 24, 28, 32, 40, 48],
  },
  spacing: {
    scale: [4, 8, 12, 16, 24, 32, 48, 64, 96],
  },
  radius: [8, 12, 20, 32, 9999],
};

/** 合併傳入的 tokens 與預設值 */
export function resolveTokens(tokens?: Partial<DesignTokens>): DesignTokens {
  if (!tokens) return defaultTokens;
  return {
    colors: { ...defaultTokens.colors, ...tokens.colors },
    typography: { ...defaultTokens.typography, ...tokens.typography },
    spacing: { ...defaultTokens.spacing, ...tokens.spacing },
    radius: tokens.radius ?? defaultTokens.radius,
  };
}
