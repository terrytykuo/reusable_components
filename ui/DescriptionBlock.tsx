import { View, Text, Pressable, StyleSheet, NativeSyntheticEvent, TextLayoutEventData } from 'react-native';
import { useState, useCallback } from 'react';
import { DesignTokens, resolveTokens } from '../types/tokens';

interface Props {
  text: string;
  /** 收合時最多顯示幾行，預設 6 */
  maxLines?: number;
  /** 展開按鈕文字，預設 'Show more' / 'Show less' */
  showMoreLabel?: string;
  showLessLabel?: string;
  tokens?: Partial<DesignTokens>;
}

/**
 * DescriptionBlock
 * 可展開/收合的長文字區塊。超過 maxLines 行時顯示「Show more」按鈕，
 * 點擊後展開全文，再點收合。
 */
export function DescriptionBlock({
  text,
  maxLines = 6,
  showMoreLabel = 'Show more',
  showLessLabel = 'Show less',
  tokens,
}: Props) {
  const t = resolveTokens(tokens);
  const s = makeStyles(t);
  const [expanded, setExpanded] = useState(false);
  const [needsTruncation, setNeedsTruncation] = useState(false);
  const [measured, setMeasured] = useState(false);

  const onMeasureLayout = useCallback(
    (e: NativeSyntheticEvent<TextLayoutEventData>) => {
      if (!measured) {
        setNeedsTruncation(e.nativeEvent.lines.length > maxLines);
        setMeasured(true);
      }
    },
    [measured, maxLines],
  );

  return (
    <View style={s.container}>
      {!measured && (
        <Text
          style={[s.text, { position: 'absolute', opacity: 0 }]}
          onTextLayout={onMeasureLayout}
        >
          {text}
        </Text>
      )}
      <Text style={s.text} numberOfLines={expanded ? undefined : maxLines}>
        {text}
      </Text>
      {needsTruncation && (
        <Pressable onPress={() => setExpanded((prev) => !prev)} hitSlop={8}>
          <Text style={s.toggle}>
            {expanded ? showLessLabel : showMoreLabel}
          </Text>
        </Pressable>
      )}
    </View>
  );
}

function makeStyles(t: DesignTokens) {
  return StyleSheet.create({
    container: { gap: 6 },
    text: {
      fontFamily: t.typography['font-body'],
      fontSize: t.typography.scale[2], // 16
      color: t.colors.text,
      lineHeight: 24,
    },
    toggle: {
      fontFamily: t.typography['font-body'],
      fontSize: t.typography.scale[1], // 14
      color: t.colors.primary,
      marginTop: 2,
    },
  });
}
