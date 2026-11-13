import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import type { RiskGuidance } from '../../types/riskJob';
import { formatGuidanceReason } from '../../utils/guidanceFormatting';
import { formatRiskDate, formatRiskRule } from '../../utils/riskJobFormatting';
import { DashboardCard } from '../dashboard/DashboardCard';
import { GuidanceSources } from './GuidanceSources';

export function GuidanceContent({ guidance }: { guidance: RiskGuidance }) {
  const { theme } = useTheme();
  const [technical, setTechnical] = useState(false);
  const fallback = guidance.fallback === true;
  const valid = guidance.fallback === false;
  const groups = [
    { label: 'Sinais observados', values: guidance.signals.map(formatRiskRule) },
    { label: 'Ações recomendadas', values: guidance.recommendedActions },
    { label: 'Avisos', values: guidance.warnings },
  ];
  return <DashboardCard title={fallback ? 'Contingência — orientação da IA indisponível' : valid ? 'Orientação contextual por IA' : 'Conteúdo legado — geração não confirmada'}>
    {!valid && <View accessibilityRole="alert" style={{ gap: theme.spacing.sm, padding: theme.spacing.md, borderWidth: theme.borders.width, borderRadius: theme.borders.radius, borderColor: theme.colors.warning }}>
      <Ionicons name="warning-outline" size={28} color={theme.colors.warning} accessible={false} />
      <Text style={[theme.typography.label, { color: theme.colors.text }]}>{fallback ? 'Contingência: este conteúdo não é uma orientação válida da IA.' : 'O conteúdo não informa fallback. Não é possível confirmar que a geração foi concluída com sucesso.'}</Text>
      {fallback && <Text style={[theme.typography.body, { color: theme.colors.text }]}>{formatGuidanceReason(guidance.reason)}</Text>}
    </View>}
    <View style={{ gap: theme.spacing.sm }}>
      <Text style={[theme.typography.label, { color: theme.colors.text }]}>Resumo</Text>
      <Text selectable style={[theme.typography.body, { color: theme.colors.text }]}>{guidance.summary ?? 'Sem dados'}</Text>
    </View>
    <View style={{ gap: theme.spacing.sm }}>
      <Text style={[theme.typography.label, { color: theme.colors.text }]}>Orientação geral</Text>
      <Text selectable style={[theme.typography.body, { color: theme.colors.text }]}>{guidance.recommendation ?? 'Sem dados'}</Text>
    </View>
    {groups.map(group => <View key={group.label} style={{ gap: theme.spacing.sm }}>
      <Text style={[theme.typography.label, { color: theme.colors.text }]}>{group.label}</Text>
      {!group.values.length && <Text style={[theme.typography.body, { color: theme.colors.textSecondary }]}>Não informados pela API.</Text>}
      {group.values.map((value, index) => <Text key={index} selectable style={[theme.typography.body, { color: theme.colors.text }]}>• {value}</Text>)}
    </View>)}
    <Text style={[theme.typography.body, { color: theme.colors.textSecondary }]}>{valid ? 'Data da geração' : 'Data informada'}: {formatRiskDate(guidance.generatedAt)}</Text>
    <GuidanceSources sources={guidance.sources} />
    <Pressable accessibilityRole="button" accessibilityLabel="Informações técnicas da orientação" accessibilityState={{ expanded: technical }} onPress={() => setTechnical(value => !value)}
      style={{ minHeight: 48, justifyContent: 'center', paddingVertical: theme.spacing.sm }}>
      <Text style={[theme.typography.caption, { color: theme.colors.primary }]}>{technical ? 'Ocultar informações técnicas' : 'Mostrar informações técnicas'}</Text>
    </Pressable>
    {technical && <View style={{ gap: theme.spacing.xs }}>
      <Text selectable style={[theme.typography.caption, { color: theme.colors.textSecondary }]}>Modelo: {guidance.model ?? 'Não informado'}</Text>
      <Text selectable style={[theme.typography.caption, { color: theme.colors.textSecondary }]}>Versão do prompt: {guidance.promptVersion ?? 'Não informada'}</Text>
    </View>}
  </DashboardCard>;
}
