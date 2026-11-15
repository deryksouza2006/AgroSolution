import Constants from 'expo-constants';
import { Text, View } from 'react-native';
import { ScreenContainer } from '../../components/ScreenContainer';
import { BrandMark } from '../../components/navigation/BrandMark';
import { useTheme } from '../../hooks/useTheme';

const commit = process.env.EXPO_PUBLIC_COMMIT_HASH?.trim().slice(0, 10) || 'Não informado';
const technologies = ['Expo SDK 58', 'React Native', 'TypeScript', 'Spring Boot', 'PostgreSQL', 'RabbitMQ', 'Spring AI', 'Gemini', 'RAG com PGVector'];

export function AboutScreen() {
  const { theme } = useTheme();
  return (
    <ScreenContainer bottomSafeArea>
      <BrandMark />
      <Text style={[theme.typography.body, { color: theme.colors.textSecondary }]}>Aplicativo AgroConecta.</Text>
      <View style={{ gap: theme.spacing.md }}>
        <Text selectable style={[theme.typography.body, { color: theme.colors.text }]}>Versão: {Constants.expoConfig?.version ?? 'Não informada'}</Text>
        <Text selectable style={[theme.typography.body, { color: theme.colors.text }]}>Referência do código: {commit}</Text>
      </View>
      <Text accessibilityRole="header" style={[theme.typography.title, { color: theme.colors.text }]}>Tecnologias do projeto</Text>
      <Text style={[theme.typography.body, { color: theme.colors.textSecondary }]}>A base mobile utiliza Expo, React Native e TypeScript. A arquitetura de backend e os módulos planejados contemplam as demais tecnologias abaixo; sua presença nesta lista não indica integração mobile já disponível.</Text>
      <View style={{ gap: theme.spacing.md, paddingBottom: theme.spacing.xl }}>
        {technologies.map(item => <Text key={item} style={[theme.typography.body, { color: theme.colors.text }]}>{item}</Text>)}
      </View>
    </ScreenContainer>
  );
}
