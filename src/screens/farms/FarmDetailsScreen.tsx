import { useEffect, useRef, useState } from 'react';
import { Alert, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AppButton } from '../../components/AppButton';
import { ScreenContainer } from '../../components/ScreenContainer';
import { ErrorState } from '../../components/feedback/ErrorState';
import { LoadingState } from '../../components/feedback/LoadingState';
import { useDeleteFarm } from '../../hooks/farms/useDeleteFarm';
import { useFarm } from '../../hooks/farms/useFarm';
import { useTheme } from '../../hooks/useTheme';
import type { FarmsStackParamList } from '../../types/navigation';
import { isFarmNotFound, parseFarmError } from '../../utils/farmErrors';
import { formatArea, formatAreaUnit } from '../../utils/numberFormatting';

export function FarmDetailsScreen({ navigation, route }: NativeStackScreenProps<FarmsStackParamList, 'FarmDetails'>) {
  const { theme } = useTheme();
  const deletion = useDeleteFarm();
  const query = useFarm(route.params.id, !deletion.isPending && !deletion.isSuccess);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const mounted = useRef(false);
  const deleting = useRef(false);
  const confirming = useRef(false);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);

  const removeFarm = async () => {
    if (deleting.current || !mounted.current) return;
    deleting.current = true;
    setDeleteError(null);
    try {
      await deletion.mutateAsync(route.params.id);
      if (mounted.current) navigation.popTo('FarmList');
    } catch (error: unknown) {
      if (mounted.current) setDeleteError(parseFarmError(error, true));
    } finally { deleting.current = false; }
  };

  const confirmDelete = () => {
    if (confirming.current || deleting.current || deletion.isPending || !query.data) return;
    confirming.current = true;
    Alert.alert('Excluir propriedade?', `Deseja excluir “${query.data.name}”? Esta ação não pode ser desfeita.`, [
      { text: 'Cancelar', style: 'cancel', onPress: () => { confirming.current = false; } },
      { text: 'Excluir', style: 'destructive', onPress: () => { confirming.current = false; void removeFarm(); } },
    ], { cancelable: true, onDismiss: () => { confirming.current = false; } });
  };

  if (query.isPending && !query.data) return <ScreenContainer><LoadingState message="Carregando propriedade…" /></ScreenContainer>;
  if (!query.data || isFarmNotFound(query.error)) return <ScreenContainer><ErrorState message={parseFarmError(query.error)} onRetry={() => { void query.refetch(); }} /></ScreenContainer>;
  const farm = query.data;
  return (
    <ScreenContainer>
      {query.isError && <ErrorState title="Não foi possível atualizar a propriedade" message={parseFarmError(query.error)} onRetry={() => { void query.refetch(); }} />}
      <View style={{ backgroundColor: theme.colors.surface, padding: theme.spacing.xl, borderRadius: theme.borders.large, gap: theme.spacing.lg }}>
        <Text accessibilityRole="header" style={[theme.typography.hero, { color: theme.colors.text }]}>{farm.name}</Text>
        {[
          { label: 'Cidade', value: farm.city }, { label: 'Estado', value: farm.state },
          { label: 'Área total', value: formatArea(farm.totalArea) }, { label: 'Unidade', value: formatAreaUnit(farm.areaUnit) },
        ].map(item => <View key={item.label} style={{ gap: theme.spacing.xs }}>
          <Text style={[theme.typography.caption, { color: theme.colors.textSecondary }]}>{item.label}</Text>
          <Text selectable style={[theme.typography.body, { color: theme.colors.text }]}>{item.value}</Text>
        </View>)}
      </View>
      {deleteError && <ErrorState title="Não foi possível excluir a propriedade" message={deleteError} />}
      <AppButton title="Ver talhões" variant="secondary" disabled={deletion.isPending || deletion.isSuccess}
        onPress={() => navigation.navigate('CropAreas', { screen: 'CropAreaList', params: { farmId: farm.id, farmName: farm.name } })} />
      <AppButton title="Editar" variant="secondary" disabled={deletion.isPending || deletion.isSuccess} onPress={() => navigation.navigate('FarmEdit', { id: farm.id })} />
      <AppButton title={deletion.isPending ? 'Excluindo…' : 'Excluir'} variant="danger" loading={deletion.isPending} disabled={deletion.isSuccess} onPress={confirmDelete} />
    </ScreenContainer>
  );
}
