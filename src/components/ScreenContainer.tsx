import type { PropsWithChildren } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../hooks/useTheme';

interface Props { keyboard?: boolean; fullSafeArea?: boolean; bottomSafeArea?: boolean }
export function ScreenContainer({ children, keyboard = false, fullSafeArea = false, bottomSafeArea = false }: PropsWithChildren<Props>) {
  const { theme } = useTheme();
  return (
    <SafeAreaView style={[styles.fill, { backgroundColor: theme.colors.background }]} edges={fullSafeArea ? ['top', 'bottom', 'left', 'right'] : bottomSafeArea ? ['bottom', 'left', 'right'] : ['left', 'right']}>
      <KeyboardAvoidingView style={styles.fill} enabled={keyboard} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag" contentContainerStyle={styles.scroll}>
          {children}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  fill: { flex: 1 },
  scroll: { flexGrow: 1, padding: 24, gap: 24, width: '100%', maxWidth: 640, alignSelf: 'center' },
});
