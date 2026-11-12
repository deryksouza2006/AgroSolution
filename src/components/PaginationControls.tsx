import { Text, View } from 'react-native';
import { useTheme } from '../hooks/useTheme';
import { AppButton } from './AppButton';

interface Props {
  page: number;
  totalPages: number;
  disabled?: boolean;
  onPrevious: () => void;
  onNext: () => void;
  resourceLabel?: string;
}

export function PaginationControls({ page, totalPages, disabled = false, onPrevious, onNext, resourceLabel = 'propriedades' }: Props) {
  const { theme } = useTheme();
  const pages = Math.max(1, totalPages);
  return (
    <View style={{ gap: theme.spacing.md }}>
      <Text accessibilityLiveRegion="polite" style={[theme.typography.body, { textAlign: 'center', color: theme.colors.textSecondary }]}>Página {page + 1} de {pages}</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.md }}>
        <View style={{ flexGrow: 1, flexBasis: 120 }}><AppButton title="Anterior" variant="secondary" onPress={onPrevious} disabled={disabled || page <= 0} accessibilityHint={`Carrega a página anterior de ${resourceLabel}`} /></View>
        <View style={{ flexGrow: 1, flexBasis: 120 }}><AppButton title="Próxima" variant="secondary" onPress={onNext} disabled={disabled || page + 1 >= pages} accessibilityHint={`Carrega a próxima página de ${resourceLabel}`} /></View>
      </View>
    </View>
  );
}
