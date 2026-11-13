import { useEffect, useRef, useState } from 'react';
import { Alert, Linking, Text, View } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import type { GuidanceSource } from '../../types/riskJob';
import { safeSourceUrl } from '../../utils/safeSourceUrl';
import { AppButton } from '../AppButton';

export function GuidanceSources({ sources }: { sources: GuidanceSource[] }) {
  const { theme } = useTheme();
  const [opening, setOpening] = useState<number | null>(null);
  const busy = useRef(false), mounted = useRef(false);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  const open = async (url: string, index: number) => {
    const safe = safeSourceUrl(url);
    if (!safe || busy.current) return;
    busy.current = true; setOpening(index);
    try { await Linking.openURL(safe); }
    catch { if (mounted.current) Alert.alert('Não foi possível abrir a fonte', 'Tente abrir este endereço novamente mais tarde.'); }
    finally { busy.current = false; if (mounted.current) setOpening(null); }
  };
  return <View style={{ gap: theme.spacing.lg }}>
    <Text accessibilityRole="header" style={[theme.typography.label, { color: theme.colors.text }]}>Fontes</Text>
    {!sources.length && <Text style={[theme.typography.body, { color: theme.colors.textSecondary }]}>Nenhuma fonte informada pela API.</Text>}
    {sources.map((source, index) => {
      const url = safeSourceUrl(source.url);
      return <View key={`${source.sourceId}-${index}`} style={{ gap: theme.spacing.sm, borderTopWidth: theme.borders.width, borderColor: theme.colors.border, paddingTop: theme.spacing.md }}>
        <Text selectable style={[theme.typography.label, { color: theme.colors.text }]}>{source.title ?? 'Título não informado'}</Text>
        <Text selectable style={[theme.typography.body, { color: theme.colors.text }]}>{source.institution ?? 'Instituição não informada'}</Text>
        <Text selectable style={[theme.typography.caption, { color: theme.colors.textSecondary }]}>{source.version ?? 'Versão não informada'}</Text>
        {source.url && <Text selectable style={[theme.typography.caption, { color: theme.colors.textSecondary }]}>{source.url}</Text>}
        {url ? <AppButton title="Abrir fonte" variant="secondary" disabled={opening !== null} loading={opening === index}
          accessibilityHint={`Abre ${url} no navegador externo`} onPress={() => { void open(url, index); }} />
          : source.url && <Text style={[theme.typography.caption, { color: theme.colors.textSecondary }]}>Link indisponível: somente endereços HTTP ou HTTPS válidos podem ser abertos.</Text>}
      </View>;
    })}
  </View>;
}
