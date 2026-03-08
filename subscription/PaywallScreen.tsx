import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useEffect } from 'react';
import { DesignTokens, resolveTokens } from '../types/tokens';

export interface PaywallPlan {
  id: string;
  label: string;
  price: string;
  /** 顯示在右側的優惠標籤，例如 'Save 46%'；不傳則不顯示 */
  savingsBadge?: string;
  /** true 時以 primary 色強調此方案 */
  highlighted?: boolean;
}

interface Props {
  title?: string;
  subtitle?: string;
  /** 載入方案中（顯示 spinner） */
  loading?: boolean;
  plans: PaywallPlan[];
  onSelectPlan: (planId: string) => Promise<void>;
  onRestorePurchases: () => Promise<void>;
  /** 頁面底部的品牌承諾或說明文字 */
  footerNote?: string;
  /** 錯誤訊息；傳入非空字串即顯示 */
  error?: string;
  tokens?: Partial<DesignTokens>;
}

/**
 * PaywallScreen
 * 訂閱方案選擇頁面。顯示方案列表、購買、恢復購買，以及底部說明文字。
 * 不依賴任何特定的付費 SDK，方案資料與 onSelectPlan 邏輯由外部傳入。
 * 搭配 RevenueCat 使用時，在 app 端 fetch offerings 後轉換為 PaywallPlan[]。
 */
export function PaywallScreen({
  title = 'Upgrade',
  subtitle,
  loading = false,
  plans,
  onSelectPlan,
  onRestorePurchases,
  footerNote,
  error,
  tokens,
}: Props) {
  const t = resolveTokens(tokens);
  const s = makeStyles(t);
  const [purchasing, setPurchasing] = useState(false);
  const [localError, setLocalError] = useState('');

  const displayError = error || localError;

  async function handleSelect(planId: string) {
    setPurchasing(true);
    setLocalError('');
    try {
      await onSelectPlan(planId);
    } catch {
      setLocalError('Purchase failed. Please try again.');
    } finally {
      setPurchasing(false);
    }
  }

  async function handleRestore() {
    setPurchasing(true);
    setLocalError('');
    try {
      await onRestorePurchases();
    } catch {
      setLocalError('Failed to restore purchases.');
    } finally {
      setPurchasing(false);
    }
  }

  return (
    <SafeAreaView style={s.safeArea}>
      <ScrollView contentContainerStyle={s.content}>
        <Text style={s.title}>{title}</Text>
        {subtitle && <Text style={s.subtitle}>{subtitle}</Text>}

        {loading && <ActivityIndicator color={t.colors.primary} style={{ marginTop: 32 }} />}
        {displayError ? <Text style={s.error}>{displayError}</Text> : null}

        {!loading && plans.length === 0 && !displayError && (
          <Text style={s.emptyText}>Plans unavailable. Please try again later.</Text>
        )}

        {!loading &&
          plans.map((plan) => (
            <Pressable
              key={plan.id}
              style={[s.planButton, plan.highlighted && s.planButtonHighlighted]}
              onPress={() => handleSelect(plan.id)}
              disabled={purchasing}
            >
              <Text style={[s.planLabel, plan.highlighted && s.planLabelHighlighted]}>
                {plan.label}
              </Text>
              <View style={s.planRight}>
                {plan.savingsBadge && (
                  <View style={s.badge}>
                    <Text style={s.badgeText}>{plan.savingsBadge}</Text>
                  </View>
                )}
                <Text style={[s.planPrice, plan.highlighted && s.planPriceHighlighted]}>
                  {plan.price}
                </Text>
              </View>
            </Pressable>
          ))}

        <Pressable onPress={handleRestore} disabled={purchasing} style={s.restoreButton}>
          <Text style={s.restoreText}>Restore purchases</Text>
        </Pressable>

        {footerNote && <Text style={s.footerNote}>{footerNote}</Text>}
      </ScrollView>
    </SafeAreaView>
  );
}

function makeStyles(t: DesignTokens) {
  return StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: t.colors.background },
    content: { padding: t.spacing.scale[3], gap: t.spacing.scale[3] }, // 16
    title: {
      fontFamily: t.typography['font-heading'],
      fontSize: t.typography.scale[6], // 28
      color: t.colors.text,
      textAlign: 'center',
      marginTop: t.spacing.scale[3],
    },
    subtitle: {
      fontFamily: t.typography['font-body'],
      fontSize: t.typography.scale[2], // 16
      color: t.colors.textSecondary,
      textAlign: 'center',
      marginBottom: t.spacing.scale[1],
    },
    planButton: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      borderWidth: 1.5,
      borderColor: t.colors.border,
      borderRadius: t.radius[2], // 20
      padding: t.spacing.scale[3], // 16
      backgroundColor: t.colors.surface,
    },
    planButtonHighlighted: {
      borderColor: t.colors.primary,
      backgroundColor: t.colors.primary + '0D', // ~5% opacity
    },
    planLabel: {
      fontFamily: t.typography['font-body'],
      fontSize: t.typography.scale[2], // 16
      color: t.colors.text,
    },
    planLabelHighlighted: { color: t.colors.primary },
    planRight: { flexDirection: 'row', alignItems: 'center', gap: t.spacing.scale[1] },
    badge: {
      backgroundColor: t.colors.primary,
      borderRadius: t.radius[0], // 8
      paddingHorizontal: t.spacing.scale[1], // 8
      paddingVertical: 2,
    },
    badgeText: {
      fontFamily: t.typography['font-body'],
      fontSize: 11,
      color: '#FFFFFF',
    },
    planPrice: {
      fontFamily: t.typography['font-body'],
      fontSize: t.typography.scale[2], // 16
      color: t.colors.text,
    },
    planPriceHighlighted: { color: t.colors.primary },
    restoreButton: { alignItems: 'center', paddingVertical: t.spacing.scale[1] },
    restoreText: {
      fontFamily: t.typography['font-body'],
      fontSize: t.typography.scale[1], // 14
      color: t.colors.textSecondary,
    },
    footerNote: {
      fontFamily: t.typography['font-body'],
      fontSize: 11,
      color: t.colors.textSecondary,
      textAlign: 'center',
      lineHeight: 18,
      marginTop: t.spacing.scale[1],
      paddingHorizontal: t.spacing.scale[1],
    },
    error: {
      fontFamily: t.typography['font-body'],
      fontSize: t.typography.scale[1],
      color: t.colors.danger,
      textAlign: 'center',
    },
    emptyText: {
      fontFamily: t.typography['font-body'],
      fontSize: t.typography.scale[2],
      color: t.colors.textSecondary,
      textAlign: 'center',
      marginTop: t.spacing.scale[4],
    },
  });
}
