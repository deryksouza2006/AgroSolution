# CitizenTech Mobile — Monitoramento agrícola

Aplicativo mobile CitizenTech, com nome provisório **Monitoramento agrícola**. A base inclui autenticação JWT, restauração de sessão, navegação protegida, perfil, temas e informações do aplicativo. Estão implementados o CRUD real de propriedades rurais, o CRUD/transferência/arquivamento de talhões, o Diário Agrícola, o perfil agronômico por talhão, o CRUD/transferência de sensores com consulta de saúde, as leituras reais dos sensores, o dashboard da Home, a análise determinística de risco hídrico com gerenciamento administrativo de alertas e a orientação contextual por IA vinculada às análises concluídas.

## Tecnologias

- Node.js 22 e npm, com `package-lock.json` versionado.
- Expo SDK 58 (`~58.0.25`), React Native 0.88.1, React 19.3 e TypeScript 6.
- React Navigation: native stack e bottom tabs, sem Expo Router.
- TanStack Query e Axios.
- Expo SecureStore, Constants, StatusBar, SystemUI e Font (dependência nativa dos ícones).
- Safe Area Context, Screens e Vector Icons.

O SDK 58 e as versões de React e React Native foram mantidos; na etapa 8, somente o patch do Expo foi atualizado para 58.0.25, conforme a checagem de compatibilidade. A base acrescentou somente duas dependências necessárias: `expo-system-ui`, para o acompanhamento do tema do sistema também em builds Android, e `expo-font`, peer dependency obrigatória dos ícones. Não há Firebase, armazenamento de JWT em AsyncStorage nem geração de dados simulados.

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

O Axios possui uma única instância, timeout padrão de 15 segundos e JSON como formato padrão. Somente o POST de orientação usa timeout de 180 segundos. Seu interceptor lê o JWT do SecureStore e o envia como Bearer nas chamadas protegidas. Login e cadastro são públicos. Não há interceptor de repetição de requisições nem registro de tokens, senhas ou respostas sensíveis.

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
- Tabs: Início, Propriedades, Monitoramento, Sensores, Alertas e Perfil.
- Início: dashboard real com saudação, última atualização, contagens e resumos de talhões, alertas, sensores, atividades, leituras e processamentos.
- Propriedades: listagem paginada real, atualização por gesto, detalhe, cadastro, edição e exclusão com confirmação. O FarmsStack contém FarmList, FarmDetails, FarmCreate e FarmEdit; cadastro e edição compartilham o formulário.
- Monitoramento: listagem real paginada de todos os talhões, detalhes e formulário compartilhado para cadastro e edição. O CropAreasStack contém CropAreaList, CropAreaDetails, CropAreaCreate e CropAreaEdit.
- No detalhe de uma propriedade, **Ver talhões** abre uma lista filtrada; seu cadastro já traz a propriedade selecionada. A edição permite transferir o talhão para outra propriedade do usuário, escolhida no seletor paginado de propriedades reais com o cache existente.
- Alertas: lista geral real paginada, detalhe, reconhecimento e resolução administrativa confirmada. Também acessível pelo Monitoramento, pelo talhão e pelos cards da Home.
- Perfil: nome, e-mail, papel, seletor de tema claro/escuro/sistema, Sobre o App e logout com confirmação.
- Sobre o App: versão de `Constants.expoConfig`, referência de código limitada a 10 caracteres e tecnologias atuais/planejadas.
- Contas `TECHNICIAN` e `ADMIN`: informação de interface ainda indisponível e opção de sair. A navegação de produtor não é montada para esses perfis.

O tema acompanha a StatusBar e a navegação. A preferência é salva em `citizentech_theme_preference`. Componentes compartilhados têm labels visíveis, mensagens textuais, áreas de toque de pelo menos 48 pontos para ações e suporte ao tamanho de fonte do dispositivo. Os formulários usam SafeAreaView e KeyboardAvoidingView.

## Propriedades rurais — endpoints integrados

Todas as operações usam o Axios e o JWT da sessão existente:

| Operação | Endpoint | Sucesso |
| --- | --- | --- |
| Cadastrar | `POST /api/farms` | 201, propriedade criada |
| Listar | `GET /api/farms?page=0&size=20` | 200, página de propriedades |
| Detalhar | `GET /api/farms/{id}` | 200, propriedade |
| Editar | `PUT /api/farms/{id}` | 200, propriedade atualizada |
| Excluir | `DELETE /api/farms/{id}` | 204, sem corpo |

POST e PUT enviam exclusivamente `name`, `city`, `state`, `totalArea` e `areaUnit` (`HECTARE` ou `SQUARE_METER`). A área aceita vírgula ou ponto com até duas casas, sem separadores de milhar, arredondamento de entradas inválidas ou perda de precisão na conversão. A listagem busca somente a página selecionada; salvar/excluir invalida as listas e atualiza/remove o detalhe. Não há exclusão otimista nem repetição automática de mutations. Alterações não salvas pedem confirmação antes de voltar; falhas da API preservam o formulário. Respostas 404 indicam recurso indisponível, e 409 na exclusão explica o impedimento por talhões vinculados.

## Talhões / áreas de cultivo — endpoints integrados

| Operação | Endpoint |
| --- | --- |
| Cadastrar | `POST /api/crop-areas` |
| Listar todos | `GET /api/crop-areas?page=0&size=20` |
| Listar por propriedade | `GET /api/farms/{farmId}/crop-areas?page=0&size=20` |
| Detalhar | `GET /api/crop-areas/{id}` |
| Editar / transferir | `PUT /api/crop-areas/{id}` |
| Excluir | `DELETE /api/crop-areas/{id}` (204, sem corpo) |
| Arquivar / reativar | `PATCH /api/crop-areas/{id}/archive` |

POST e PUT enviam somente `farmId`, `name`, `cropType`, `areaSize`, `areaUnit`, `latitude`, `longitude` e `description`; coordenadas e descrição vazias são enviadas como `null`. Não são enviados status ou campos de proprietário. A área precisa ser positiva com até duas casas; coordenadas aceitam até seis, nos intervalos geográficos, sempre juntas ou ambas vazias. Vírgula ou ponto são aceitos, sem arredondar entradas inválidas. Status `NORMAL`, `ATTENTION` e `CRITICAL` são definidos exclusivamente pelo backend.

As listas geral e filtrada carregam uma página por vez, mantêm arquivados visíveis e oferecem pull-to-refresh, retry e feedback de erro/vazio. Cards exibem cultivo, propriedade, área e badge com texto. Os detalhes incluem todos os campos e datas no fuso do dispositivo. O formulário preserva valores quando a API falha e confirma o descarte de alterações. Erro 409 ao salvar ou reativar cuja mensagem indica capacidade/área excedida recebe orientação específica; mensagens desconhecidas ficam como conflito genérico. A API é a autoridade para essa regra, inclusive após troca de propriedade ou unidade.

Arquivar requer confirmação explícita e envia apenas `{ "archived": true }`; reativar envia `{ "archived": false }`. A resposta pode trazer o talhão atualizado; sem corpo, o detalhe é consultado novamente. Exclusão exige confirmação própria e não utiliza atualização otimista. Em DELETE 409, as mensagens exatas `Não é possível excluir área de cultivo com sensores vinculados` e `Cultivo com histórico deve ser arquivado` distinguem sensores de histórico. A primeira orienta excluir sensores antes; a segunda oferece arquivamento com **nova confirmação explícita**. Mensagens desconhecidas recebem erro genérico. Nenhum conflito arquiva automaticamente o cultivo, e o mobile segue a mensagem escolhida pelo backend, inclusive quando histórico é verificado antes de sensores.

Todas as mutations invalidam as listas gerais/filtradas e as propriedades relacionadas; edição/transferência contempla origem e destino. Detalhes são atualizados ou removidos após sucesso. Mutations não têm retry automático e respostas de uma sessão encerrada não repovoam o cache. Respostas 401/403 usam o fluxo de autenticação existente; 404 exibem recurso indisponível e falhas de rede/5xx preservam dados disponíveis.

## Diário Agrícola — etapa 4

Nos detalhes do talhão, **Diário agrícola** abre a lista paginada, detalhes, cadastro, edição e exclusão confirmada. Cadastro/edição compartilham o formulário. Os tipos são Irrigação, Fertilização, Plantio e Colheita. Quantidade e unidade são opcionais, sempre juntas; quantidade positiva com até três casas, descrição até 2000 e unidade até 30 caracteres.

- `POST /api/crop-areas/{cropAreaId}/activities`
- `GET /api/crop-areas/{cropAreaId}/activities`
- `GET /api/crop-areas/{cropAreaId}/activities/{activityId}`
- `PUT /api/crop-areas/{cropAreaId}/activities/{activityId}`
- `DELETE /api/crop-areas/{cropAreaId}/activities/{activityId}`

A lista usa a Page Spring (`number`, não `page`), páginas de 20 itens (limite da API: 100), filtros opcionais `type`, `from`, `to` e ordenação `performedAt,desc`. O período cobre dias completos no fuso do dispositivo, convertidos para Instant UTC. O formulário separa data `DD/MM/AAAA` e horário `HH:mm` ou `HH:mm:ss`, valida o calendário e rejeita datas futuras e horários locais inexistentes por mudança de horário de verão. Horários repetidos seguem a primeira ocorrência definida pelo JavaScript; editar sem mudar a data/hora preserva o Instant original. Datas exibidas usam o fuso do dispositivo.

Talhões arquivados permitem consulta, com aviso de somente leitura e orientação para reativar nos detalhes. O 409 `Cultivo arquivado: reative antes de alterar atividades` também atualiza esse estado se o arquivamento ocorrer enquanto o diário estiver aberto. Queries incluem talhão, página e filtros; mutations não têm retry e invalidam listas/detalhes relacionados, preservando os valores do formulário após erro. Foram acrescentados testes puros para quantidade/unidade, calendário, datas futuras, períodos e conversão UTC em diferentes fusos e transições de horário de verão. A experiência com teclado, navegação e API real ainda requer teste em dispositivo.

## Perfil agronômico — etapa 5

Nos detalhes do talhão, **Perfil agronômico** consulta `GET /api/crop-areas/{cropAreaId}/agronomic-profile` e mostra somente a revisão mais recente. GET 404 é um estado vazio com **Criar perfil**. O formulário compartilhado para criação/edição envia `PUT /api/crop-areas/{cropAreaId}/agronomic-profile`; cada salvamento cria uma revisão, exige confirmação explícita e preserva os valores preenchidos quando a API falha. O número exibido vem da resposta do servidor. Não há histórico de revisões nem exclusão, pois esses endpoints não existem.

Percentuais são obrigatórios, de 0 a 100, com capacidade de campo maior que o ponto de murcha. Profundidades são opcionais e positivas; textura e fonte são obrigatórias. Os números aceitam vírgula ou ponto e são normalizados antes do envio, sem perda silenciosa de precisão. `demo` é sempre enviado como boolean, inclusive `false`; `true` exibe **Dados demonstrativos**. O PUT atualiza/invalida a query da revisão mais recente, sem retry automático. A consulta tem pull-to-refresh e botão de atualização; o formulário confirma o descarte de alterações. O mobile não bloqueia o perfil por arquivamento do talhão: segue a resposta da API. Teclado, acessibilidade, confirmações e o fluxo com API real ainda precisam de teste em dispositivo.

## Sensores — etapa 6

A aba **Sensores** oferece lista geral paginada, detalhes e formulário compartilhado de cadastro/edição. **Ver sensores**, nos detalhes do talhão, abre a lista filtrada e preenche o talhão no cadastro. Propriedades e talhões de destino são selecionados em listas reais paginadas; a edição permite transferência e alteração do status administrativo. Nenhuma restrição adicional é imposta a talhões arquivados.

- `POST /api/sensors`
- `GET /api/sensors?page=0&size=20`
- `GET /api/crop-areas/{cropAreaId}/sensors?page=0&size=20`
- `GET /api/sensors/{id}`
- `PUT /api/sensors/{id}`
- `DELETE /api/sensors/{id}`
- `GET /api/sensors/{id}/health`

O código do dispositivo é normalizado em maiúsculas, obrigatório no cadastro e pode ser omitido no PUT para preservar o atual. O POST nunca envia status. A data de instalação usa `DD/MM/AAAA` no formulário e `YYYY-MM-DD` no payload, sem conversão de fuso; datas futuras são rejeitadas. Campos vazios opcionais seguem o contrato. Conflitos 409 são classificados pelas duas mensagens exatas documentadas: código duplicado e exclusão impedida por leituras vinculadas; demais conflitos permanecem genéricos. Exclusão exige confirmação e não remove leituras nem outros recursos em cascata.

A consulta `/health` ocorre somente no detalhe do sensor em foco, sem chamadas por card. Status administrativo, comunicação, saúde calculada, última leitura, bateria, calibração e manutenção são apresentados separadamente. A **política de saúde é demonstrativa**, sem diagnóstico real de hardware ou recálculo local; ausência de leituras preserva os estados retornados pela API. Datas com horário usam o fuso do dispositivo. Listas/detalhes/saúde e propriedades/talhões de origem e destino são atualizados ou invalidados após mutations, sem repetição automática. Formulários preservam valores após erro, impedem envio duplicado e confirmam descarte de alterações. Testes puros cobrem validação, data futura/local, código, traduções, conflitos e interpretação da saúde. Fluxos com API real, teclado, leitores de tela, fontes ampliadas e navegação ainda exigem teste em Android/iOS.

## Leituras dos sensores — etapa 7

A stack de Sensores oferece **Todas as leituras**; os detalhes do sensor incluem **Ver leituras** e **Registrar leitura**. Nos detalhes do talhão, **Leituras do talhão** abre a mesma listagem filtrada e a leitura mais recente é consultada separadamente (404 vira estado vazio). Os três contextos usam uma tela paginada, páginas de 20 e ordenação por `measuredAt` decrescente, com refresh, retry e preservação dos dados disponíveis em falhas de rede. Detalhes mostram medições, unidades, origem e datas no fuso do dispositivo. Leituras `SIMULATED` vindas da API são identificadas como **Dados simulados**; o aplicativo não gera simulações. O status de análise aparece somente como **Processamento técnico da leitura**, sem resultado agronômico ou de IA.

- `POST /api/sensor-readings`
- `GET /api/sensor-readings?page=0&size=20`
- `GET /api/sensor-readings/{id}`
- `DELETE /api/sensor-readings/{id}`
- `GET /api/sensors/{sensorId}/readings?page=0&size=20`
- `GET /api/crop-areas/{cropAreaId}/readings?page=0&size=20`
- `GET /api/crop-areas/{cropAreaId}/readings/latest`

O formulário manual seleciona sensores reais ativos em páginas, verifica o talhão não arquivado e exige a medição principal do tipo. Estações meteorológicas aceitam temperatura, umidade do ar, umidade do solo ou chuva; bateria é opcional e não substitui uma medição ambiental. Decimais aceitam vírgula ou ponto com até três casas, sem arredondamento de entradas inválidas. Data/horário locais são convertidos para UTC pelos utilitários do diário; ambos vazios omitem `measuredAt`, usando o horário atual da API. O limite futuro é de cinco minutos. Chuva (inclusive 0 mm) exige início do intervalo estritamente anterior à medição. O payload contém apenas os campos contratados e `source: MANUAL`.

Leituras são imutáveis, sem edição ou PUT. Exclusão requer confirmação e é impedida para `ANALYZED`, inclusive se o processamento mudar enquanto a tela estiver aberta. Os três conflitos documentados (talhão arquivado, sensor inativo e leitura já processada) têm orientação específica; mensagens desconhecidas permanecem genéricas. Cadastro/exclusão invalidam listas, última leitura e saúde do sensor, sem retry automático ou exclusão otimista. O formulário evita envio duplicado, preserva valores após erro e confirma descarte de alterações. Testes puros cobrem limites, tipos, chuva/intervalo, datas, normalização, traduções e 404 da última leitura. O TypeScript permite imports explícitos `.ts` para compartilhar os utilitários existentes também nos testes do Node, sem novas dependências.

## Dashboard da Home — etapa 8

A Home consulta somente `GET /api/dashboard`, usando Axios/JWT e TanStack Query existentes. Exibe totais de propriedades/talhões, leituras recentes e alertas abertos pelos metadados `totalElements`; sensores com problemas são contados na resposta limitada a 20. As seções não vazias mostram situação dos talhões, alertas, problemas nos sensores, atividades, leituras e processamentos pendentes/com falha. Riscos e métricas vêm exclusivamente do backend, sem recálculo ou diagnóstico profissional. Valores ausentes são identificados, e dados simulados/demonstrativos recebem avisos explícitos.

O dashboard é somente leitura, com pull-to-refresh, botão de atualização e nova consulta ao retornar à Home pela política normal de cache, sem polling ou recriação da navegação. Itens inválidos e campos nulos são normalizados individualmente; falhas de atualização preservam os dados carregados. O conteúdo é virtualizado e os atalhos com identificadores válidos abrem detalhes de talhão/sensor/leitura, diário e análises/alertas. A solicitação de orientação fica nos detalhes, sem geração de dados simulados. Testes puros cobrem traduções, métricas opcionais, origem dos dados, contagens e respostas parciais. API real, navegação, refresh, fontes ampliadas e acessibilidade ainda exigem teste em Android/iOS.

## Risco hídrico e alertas — etapa 9

O detalhe do talhão oferece **Analisar risco hídrico**, **Histórico de análises** e **Alertas do talhão**. O POST é enviado sem payload, sem retry automático; o JSON retornado com HTTP 202 fornece o único `id` usado para abrir o detalhe e consultar o processamento. Histórico e alertas usam páginas Spring (`number`), com 20 itens por página, refresh e preservação dos últimos dados em falhas de rede.

- `POST /api/crop-areas/{cropAreaId}/risk-jobs`
- `GET /api/risk-jobs/{jobId}`
- `GET /api/crop-areas/{cropAreaId}/risk-jobs?page=0&size=20`
- `GET /api/alerts?page=0&size=20`
- `GET /api/alerts/{jobId}`
- `GET /api/crop-areas/{cropAreaId}/alerts?page=0&size=20`
- `PATCH /api/alerts/{jobId}/acknowledge` (sem payload)
- `PATCH /api/alerts/{jobId}/resolve` (sem payload)

O detalhe consulta automaticamente somente estados `PENDING`, `QUEUED` e `PROCESSING`, com intervalo de 1,5 segundo após a conclusão da requisição anterior e limite de 60 segundos. Requisições em andamento são canceladas ao sair da tela, entrar em segundo plano ou atingir o limite; voltar ao app não renova esse prazo. Estados terminais e erros interrompem a consulta automática. **Consultar novamente** faz somente GET no mesmo job, sem criar outra análise e sem renovar a janela automática após o limite.

O risco vem exclusivamente de `result.riskLevel`; campos ausentes exibem **Sem dados**, e `INSUFFICIENT_DATA` permanece diferente de `NORMAL`. Resultados mostram disponibilidade hídrica/bruta, VPD, tendência, qualidade, regras, limitações e chuva quando disponíveis. Snapshots têm contrato próprio (`soilMoisture`, `airTemperature`, `airHumidity`, `simulated`); **Regras demonstrativas** nos contextos de job/resultado/alerta nunca marca uma leitura real como simulada. A apresentação não é uma prescrição ou diagnóstico agronômico.

Somente alertas `OPEN` permitem reconhecimento; `OPEN` ou `ACKNOWLEDGED` permitem resolução, sempre com confirmação explícita. PATCH não tem corpo de resposta: a interface consulta o estado novamente e invalida jobs, alertas, talhão e dashboard. Não há atualização otimista nem alteração local da classificação/cor do risco. Testes puros cobrem estados, polling, prazo, traduções, nulls, demo/simulado e transições. Polling/cancelamento, navegação, confirmações, fontes ampliadas e API real ainda precisam de teste em dispositivo.

## Orientação contextual por IA — etapa 10

Os detalhes da análise e do alerta oferecem **Entender análise/alerta** quando `job.result` existe. O risco é calculado em **Java**: a IA fornece apenas explicação contextual com **RAG**, preservando a classificação de `result.riskLevel`, métricas, alertas e avisos demonstrativos/simulados. Cada orientação pertence ao job original; uma nova condição exige outra análise.

- `POST /api/risk-jobs/{jobId}/guidance`: sem body, HTTP 200 com o RiskJob inteiro; orientação em `guidance`. Timeout exclusivo de 180 segundos, sem retry automático.
- `GET /api/risk-jobs/{jobId}`: **Consultar atualização** consulta o mesmo job, sem repetir o POST. Um 409 também consulta o job; 401/403 seguem a autenticação existente.

Somente `fallback=false` confirma orientação persistida: ela é exibida diretamente, sem regeneração forçada, e invalida caches de jobs, alertas e dashboard. `fallback=true` aparece como **Contingência**, com motivo traduzido, conteúdo e tentativa manual; permanece em memória da sessão enquanto a tela/cache local existir, mesmo se um GET retornar `guidance=null`. Conteúdo sem `fallback` é identificado como legado, sem afirmar sucesso. Timeout, rede e 5xx preservam o resultado determinístico e exigem consulta antes de outra solicitação explícita.

Resumo, sinais, recomendação, ações, avisos e fontes são texto simples. Somente links HTTP(S) válidos podem abrir por ação do usuário; fontes vazias não geram referências inventadas. Data da geração usa o fuso do dispositivo; modelo e versão do prompt ficam em uma área técnica recolhível. Testes puros cobrem classificação de fallback, decisões, motivos, URLs, preservação do risco e contingência local. Gemini/RAG reais, persistência/reuso, indisponibilidade do provedor, timeout, navegação, leitor de tela e abertura de fontes ainda exigem validação com backend real em Android/iOS.

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
│   ├── cropAreas/      # Cards e status de talhões
│   ├── farms/          # Cards e seletor paginado de propriedades
│   ├── feedback/       # LoadingState, ErrorState e EmptyState
│   └── navigation/     # AppHeader e BrandMark
├── contexts/           # AuthContext e ThemeContext
├── hooks/
│   ├── auth/           # useAuth, mutation e confirmação de logout
│   ├── farms/          # CRUD de propriedades e query keys
│   └── cropAreas/      # CRUD, arquivamento, query keys e invalidação
├── navigation/         # RootNavigator, AuthStack, ProducerStack e ProducerTabs
├── screens/
│   ├── auth/
│   ├── home/
│   ├── farms/
│   ├── cropAreas/
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
node --experimental-strip-types --test tests/*.test.mjs
```

Não há script de lint configurado no projeto. Os testes utilitários usam Node.js 22, o TypeScript e o Axios já disponíveis, sem instalar um framework adicional. A validação completa de SecureStore, teclado, acessibilidade, navegação e autenticação depende de execução em Android/iOS e de uma API real implementando o contrato acima.

As verificações cobrem funções puras de autenticação e dos módulos agrícolas, incluindo validação numérica, coordenadas, datas, traduções, conflitos e normalização do dashboard. Na etapa 8, somente o patch do Expo foi atualizado para 58.0.25; nenhuma biblioteca nova foi adicionada. Expo Doctor, prebuild e build nativo não fazem parte das verificações.

## Módulos planejados

Ainda **não implementados**: device-key, entrada de IoT (`/device-readings`), análise legada, interface de técnico, mapas, gráficos e simulação. Spring Boot, PostgreSQL, RabbitMQ, Spring AI, Gemini e PGVector pertencem ao backend; a orientação com Gemini/RAG é consumida somente pela API, sem conexão direta do aplicativo com esses serviços.

Documentação consultada: [Expo SDK 58](https://docs.expo.dev/versions/v58.0.0/), [SecureStore](https://docs.expo.dev/versions/v58.0.0/sdk/securestore/), [temas](https://docs.expo.dev/develop/user-interface/color-themes/) e [autenticação com React Navigation](https://reactnavigation.org/docs/auth-flow/).
