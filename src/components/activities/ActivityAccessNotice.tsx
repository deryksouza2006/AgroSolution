import { Text, View } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import type { useActivityAccess } from '../../hooks/activities/useActivityAccess';
import { parseCropAreaError } from '../../utils/cropAreaErrors';
import { ErrorState } from '../feedback/ErrorState';

export function ActivityAccessNotice({ access }: { access: ReturnType<typeof useActivityAccess> }) {
  const { theme } = useTheme();
  return <View style={{ gap: theme.spacing.md }}>
    {access.archived && <View style={{ backgroundColor: theme.colors.primarySoft, padding: theme.spacing.lg, borderRadius: theme.borders.radius, gap: theme.spacing.sm }}>
      <Text accessibilityRole="header" style={[theme.typography.label, { color: theme.colors.text }]}>Diário em modo somente leitura</Text>
      <Text style={[theme.typography.body, { color: theme.colors.text }]}>Este talhão está arquivado. Para cadastrar, editar ou excluir atividades, volte aos detalhes do talhão e reative-o.</Text>
    </View>}
    {access.query.isError && <ErrorState title="Não foi possível validar o talhão" message={parseCropAreaError(access.query.error)} onRetry={() => { void access.query.refetch(); }} />}
    {!access.archived && access.query.isFetching && <Text accessibilityLiveRegion="polite" style={[theme.typography.body, { color: theme.colors.textSecondary }]}>Validando o talhão antes de permitir alterações…</Text>}
  </View>;
}
