# CitizenTech Mobile — Monitoramento agrícola

Primeira etapa do aplicativo mobile CitizenTech, com nome provisório **Monitoramento agrícola**. Esta entrega estabelece a arquitetura, autenticação JWT, restauração de sessão, navegação protegida, perfil, temas e informações do aplicativo.

## Tecnologias

- Node.js 22 e npm, com `package-lock.json` versionado.
- Expo SDK 58 (`~58.0.24`), React Native 0.88.1, React 19.3 e TypeScript 6.
- React Navigation: native stack e bottom tabs, sem Expo Router.
- TanStack Query e Axios.
- Expo SecureStore, Constants, StatusBar, SystemUI e Font (dependência nativa dos ícones).
- Safe Area Context, Screens e Vector Icons.

As versões de Expo, React e React Native foram mantidas. Foram acrescentadas somente duas dependências necessárias: `expo-system-ui`, para o acompanhamento do tema do sistema também em builds Android, e `expo-font`, peer dependency obrigatória dos ícones. Não há Firebase, armazenamento de JWT em AsyncStorage nem dados simulados.

## Arquitetura

A organização por responsabilidade segue a arquitetura de referência do PetJourney Sprint 4, com domínio e versões próprios do CitizenTech:

```text
Screen → Hook → TanStack Query → Service → Axios → API

SafeAreaProvider
└── ThemeProvider
    └── QueryClientProvider
        └── AuthProvider
            └── RootNavigator
```

O `QueryClient` é criado fora dos componentes. Queries fazem no máximo uma nova tentativa; erros 401/403 não são repetidos. Mutations não repetem requisições automaticamente. O foco da janela não dispara refetch e o logout cancela queries e limpa o cache. Credenciais não são persistidas; a mutation de autenticação é descartada após o envio ou desmontagem.

O Axios possui uma única instância, timeout de 15 segundos e JSON como formato padrão. Seu interceptor lê o JWT do SecureStore e o envia como Bearer nas chamadas protegidas. Login e cadastro são públicos. Não há interceptor de repetição de requisições nem registro de tokens, senhas ou respostas sensíveis.

## Autenticação e proteção de rotas

- `POST /api/auth/register`: somente `name`, `email` e `password`; o mobile nunca envia `role`.
- `POST /api/auth/login`: `email` e `password`.
- `GET /api/auth/me`: retorna diretamente o usuário autenticado com `id`, `name`, `email` e `role`.
- Login e cadastro devem retornar `token`, `tokenType: "Bearer"`, `expiresAt` em ISO-8601 e `user`.

Após login/cadastro, o JWT é salvo na chave `citizentech_access_token` e a conta é validada por `/api/auth/me` antes de liberar qualquer tela protegida. Ao abrir o aplicativo, o token salvo passa pela mesma validação; a existência de um token, sozinha, não autentica o usuário. Apenas o JWT é persistido; `expiresAt` é nulo nas sessões restauradas, e a API é responsável por validar a validade do token.

Durante a restauração há uma tela de carregamento. Respostas 401/403 removem o token e limpam o cache. Erros de rede, 5xx e respostas inválidas preservam o JWT e exibem as ações **Tentar novamente** e **Sair**. Se o armazenamento seguro falhar, o aplicativo também permanece bloqueado e permite tentar novamente. O logout remove o token; falhas na remoção são comunicadas, sem liberar telas protegidas. Não há endpoint de refresh ou revogação no contrato recebido.

O `AuthContext` expõe `user`, `session`, `isLoading`, `isAuthenticated`, `hasSessionRestoreError`, `signIn`, `signUp`, `signOut` e `retrySessionRestore`. Operações concorrentes são bloqueadas, requisições são canceladas na desmontagem do provider e respostas antigas não atualizam o estado. Os formulários validam e-mail com trim, senha de 8 a 72 caracteres e confirmação no cadastro; permitem mostrar/ocultar senha e bloqueiam envios duplicados. O parser de erros prioriza `detail`, depois `message` e `fields`, com mensagens seguras para falhas de rede e sem exibir a resposta bruta ou stack trace.

## Telas disponíveis

- AuthStack: Login e Cadastro.
- ProducerStack: Tabs e Sobre o App.
- Tabs: Início, Propriedades, Monitoramento, Alertas e Perfil.
- Início: boas-vindas e explicação desta etapa.
- Propriedades, Monitoramento e Alertas: mensagens informativas, sem consultas ou dados fictícios.
- Perfil: nome, e-mail, papel, seletor de tema claro/escuro/sistema, Sobre o App e logout com confirmação.
- Sobre o App: versão de `Constants.expoConfig`, referência de código limitada a 10 caracteres e tecnologias atuais/planejadas.
- Contas `TECHNICIAN` e `ADMIN`: informação de interface ainda indisponível e opção de sair. A navegação de produtor não é montada para esses perfis.

O tema acompanha a StatusBar e a navegação. A preferência é salva em `citizentech_theme_preference`. Componentes compartilhados têm labels visíveis, mensagens textuais, áreas de toque de pelo menos 48 pontos para ações e suporte ao tamanho de fonte do dispositivo. Os formulários usam SafeAreaView e KeyboardAvoidingView.

## Variáveis de ambiente

```bash
cp .env.example .env
```

```dotenv
EXPO_PUBLIC_API_URL=http://10.0.2.2:8080
EXPO_PUBLIC_COMMIT_HASH=development
```

`EXPO_PUBLIC_API_URL` é a origem do backend, **sem `/api` no final**. Os services incluem `/api` em seus caminhos. Sem URL configurada, o aplicativo informa o ajuste necessário ao tentar autenticar. O hash é exibido com no máximo 10 caracteres, inclusive o valor padrão `development`.

As variáveis `EXPO_PUBLIC_*` são incluídas no aplicativo: não coloque nelas senhas nem segredos do backend. O arquivo `.env` é ignorado pelo Git. Após mudar essas variáveis, reinicie o Expo e recarregue o aplicativo.

## Execução no emulador

Com Node.js 22 ativo, instale as dependências respeitando o lockfile:

```bash
npm ci
npx expo start
```

Com o emulador Android aberto e Expo Go compatível com SDK 58, pressione `a` no terminal. A API local deve estar disponível na porta 8080, com `EXPO_PUBLIC_API_URL=http://10.0.2.2:8080`. No simulador iOS em macOS, use `http://localhost:8080` e pressione `i`.

O projeto mantém Continuous Native Generation: não é necessário criar ou editar `ios/` ou `android/` nesta etapa. Uma development build compatível também pode ser usada. Alterações em plugins e configurações nativas, incluindo SystemUI, exigem uma nova development build para surtir efeito; nenhuma build ou prebuild faz parte desta entrega.

## Execução no celular físico

1. Conecte o celular e o computador à mesma rede.
2. Configure `EXPO_PUBLIC_API_URL=http://IP_DO_COMPUTADOR:8080`, sem `/api` no final.
3. Disponibilize a API na interface de rede do computador, permitindo a porta 8080 no firewall.
4. Execute `npx expo start` e leia o QR code com Expo Go compatível com SDK 58, ou use uma development build compatível.

No celular, `localhost` aponta para o próprio aparelho e `10.0.2.2` é específico do emulador Android. O túnel do Metro não publica o backend automaticamente. Para uma API remota, configure sua URL HTTPS; a aceitação de HTTP em binários próprios depende da configuração nativa de rede.

## Estrutura de pastas

```text
App.tsx
src/
├── components/
│   ├── feedback/       # LoadingState, ErrorState e EmptyState
│   └── navigation/     # AppHeader e BrandMark
├── contexts/           # AuthContext e ThemeContext
├── hooks/
│   └── auth/           # useAuth, mutation e confirmação de logout
├── navigation/         # RootNavigator, AuthStack, ProducerStack e ProducerTabs
├── screens/
│   ├── auth/
│   ├── home/
│   ├── farms/
│   ├── monitoring/
│   ├── alerts/
│   ├── profile/
│   └── settings/
├── services/           # Axios, authService, tokenStorage e queryClient
├── theme/              # Tokens de cores, espaçamento, fontes, bordas e sombras
├── types/              # Contratos de autenticação, erros e navegação
└── utils/              # Parser de erros e validação de formulários
tests/                  # Validação de formulários e parser, sem serviços simulados
```

## Verificações

```bash
npx expo install --check
npx tsc --noEmit
npx expo-doctor
node --experimental-strip-types --test tests/auth-utils.test.mjs
```

Não há script de lint configurado no projeto. Os testes utilitários usam Node.js 22, o TypeScript e o Axios já disponíveis, sem instalar um framework adicional. A validação completa de SecureStore, teclado, acessibilidade, navegação e autenticação depende de execução em Android/iOS e de uma API real implementando o contrato acima.

Resultado da implementação: `expo install --check` e `tsc --noEmit` passaram; os cinco testes utilitários passaram. O Expo Doctor passou em 19/20 verificações e identificou a ausência da dependência direta `expo-font`, posteriormente instalada com `npx expo install expo-font`. Os três comandos finais foram executados uma única vez, conforme solicitado; portanto o Doctor não foi repetido após essa correção. Nenhum prebuild, build nativo ou commit foi executado.

## Módulos planejados

Ainda **não implementados**: propriedades, talhões, sensores, leituras, diário agrícola, dashboard real, alertas, RiskJob, IA, RAG, interface de técnico, mapas, gráficos e simulação. Spring Boot, PostgreSQL, RabbitMQ, Spring AI, Gemini e PGVector pertencem ao backend/planejamento; o aplicativo não se conecta diretamente a esses serviços.

Documentação consultada: [Expo SDK 58](https://docs.expo.dev/versions/v58.0.0/), [SecureStore](https://docs.expo.dev/versions/v58.0.0/sdk/securestore/), [temas](https://docs.expo.dev/develop/user-interface/color-themes/) e [autenticação com React Navigation](https://reactnavigation.org/docs/auth-flow/).
