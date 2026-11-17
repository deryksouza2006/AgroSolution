# AgroConecta Mobile

Aplicativo mobile desenvolvido para a Global Solution 2026/2 da FIAP.

O AgroConecta auxilia pequenos produtores no acompanhamento de propriedades, talhões, atividades agrícolas, sensores e condições hídricas do cultivo. O aplicativo consome a API do projeto e apresenta os dados de forma organizada, incluindo alertas de risco e orientações geradas com apoio de inteligência artificial.

## Links

| Recurso | Link |
| --- | --- |
| Repositório mobile |  |
| Repositório da API | [GS-FINAL](https://github.com/deryksouza2006/GS-FINAL) |
| API publicada |  |
| Vídeo de apresentação |  |

## Integrantes

| Nome | RM |
| --- | --- |
|  |  |
|  |  |
|  |  |
|  |  |

## O projeto

O produtor cadastra suas propriedades e divide cada uma em talhões. Em cada talhão é possível manter um diário agrícola, registrar o perfil do solo, cadastrar sensores e acompanhar as leituras recebidas.

Com esses dados, a API calcula o risco hídrico e pode gerar alertas. Quando uma análise possui dados suficientes, o usuário também pode solicitar uma orientação contextual. O resultado é exibido no aplicativo com recomendação, ações sugeridas, avisos e fontes utilizadas.

## Funcionalidades principais

- Cadastro e login com autenticação JWT.
- Recuperação segura da sessão do usuário.
- Cadastro, edição e exclusão de propriedades.
- Cadastro, transferência, arquivamento e reativação de talhões.
- Diário agrícola por talhão.
- Perfil agronômico com informações do solo e do cultivo.
- Cadastro e acompanhamento de sensores.
- Registro manual e histórico de leituras.
- Consulta da saúde dos sensores.
- Dashboard com resumo dos dados do produtor.
- Análises de risco hídrico.
- Alertas com reconhecimento e resolução.
- Orientação contextual gerada pela API.
- Temas claro, escuro e conforme o sistema.

## Fluxo principal

1. O usuário entra no aplicativo ou cria uma conta.
2. Cadastra uma propriedade e seus talhões.
3. Preenche o perfil agronômico e o diário agrícola.
4. Cadastra sensores e registra leituras.
5. Solicita a análise hídrica do talhão.
6. A API calcula o risco e cria um alerta quando necessário.
7. O usuário pode solicitar uma orientação e consultar as fontes apresentadas.

## Integração com a API

O mobile não executa regras agronômicas nem acessa diretamente o Gemini. As regras de negócio ficam centralizadas na API Java.

O aplicativo é responsável por:

- autenticar o usuário;
- enviar e consultar dados pela API;
- apresentar estados de carregamento, erro e conteúdo vazio;
- manter o cache das consultas sincronizado;
- apresentar o risco calculado pelo backend;
- exibir alertas e orientações já processadas pela API.

O código da API, as configurações de deploy e a documentação da inteligência artificial estão disponíveis no repositório [GS-FINAL](https://github.com/deryksouza2006/GS-FINAL).

## Inteligência artificial

O AgroConecta separa o cálculo de risco da geração de texto. Essa decisão evita que o modelo de IA defina sozinho se um cultivo está em situação normal, de atenção ou crítica.

### Cálculo do risco

O risco hídrico é calculado por regras determinísticas na API Java. O cálculo considera os dados disponíveis no momento da análise, como leituras de umidade do solo, temperatura, umidade do ar, chuva e informações do perfil agronômico.

O resultado é armazenado em um `RiskJob`, junto com as medições e os parâmetros utilizados. Esse resultado também pode gerar um alerta. A classificação calculada pelo Java é a classificação oficial do sistema e não pode ser substituída pelo modelo generativo.

### Orientação gerada

Depois que o cálculo termina, o usuário pode solicitar uma orientação. A API utiliza o modelo `gemini-3.5-flash-lite` para produzir uma resposta estruturada com:

- resumo da situação;
- sinais observados nas medições;
- recomendação;
- ações sugeridas;
- avisos sobre dados ausentes ou demonstrativos;
- fontes utilizadas;
- nível de risco já definido pelo Java.

O modelo recebe o risco como um dado fixo. Mesmo que a resposta gerada apresente outra classificação, o backend mantém o valor persistido pelo cálculo determinístico.

### RAG e PGVector

A orientação utiliza RAG para acrescentar contexto agronômico antes da chamada ao Gemini. O projeto possui um pequeno corpus local com conteúdos baseados em referências da Embrapa e da FAO.

Os textos são convertidos em vetores pelo modelo `gemini-embedding-001`, com 768 dimensões, e armazenados no PostgreSQL com PGVector. Quando uma orientação é solicitada, a API:

1. monta uma consulta a partir do resultado e das medições do talhão;
2. gera o embedding da consulta;
3. procura no PGVector os trechos mais próximos;
4. seleciona apenas fontes válidas e identificadas;
5. envia os trechos recuperados ao Gemini junto com os dados da análise;
6. valida a resposta antes de salvá-la.

Esse processo não realiza pesquisa aberta na internet e não treina um modelo próprio. O RAG serve para fornecer referências específicas e reduzir respostas sem relação com o contexto do projeto.

### Persistência e tratamento de falhas

Uma orientação válida é salva no mesmo `RiskJob`. Novas consultas devolvem o conteúdo persistido sem gerar outra resposta desnecessariamente.

Quando o Gemini está indisponível, ocorre timeout, a resposta não respeita a estrutura esperada ou não existem fontes suficientes, a API registra uma contingência identificada. O risco, as medições e o alerta continuam preservados. Outra tentativa de geração depende de uma ação explícita do usuário.

### Segurança e limites

- A chave do Gemini permanece somente no ambiente do backend.
- O aplicativo mobile nunca recebe nem armazena essa chave.
- Cada produtor acessa apenas os próprios dados e análises.
- O backend valida a estrutura, as fontes e o risco antes de persistir a orientação.
- Informações recuperadas pelo RAG são tratadas como dados de contexto, não como comandos.
- A recomendação não substitui a avaliação de um engenheiro agrônomo.
- Leituras manuais ou simuladas não equivalem a medições de hardware calibrado em campo.

Os detalhes da implementação, dos testes e das fontes estão documentados no repositório da [API AgroConecta](https://github.com/deryksouza2006/GS-FINAL).

## Tecnologias

- Node.js 22
- Expo SDK 58 (`~58.0.25`)
- React Native 0.88.1
- React 19.3
- TypeScript 6
- React Navigation
- TanStack Query
- Axios
- Expo SecureStore
- Expo Vector Icons

## Organização do projeto

```text
src/
├── components/    componentes reutilizáveis
├── contexts/      autenticação e tema
├── hooks/         consultas, mutations e cache
├── navigation/    stacks, tabs e proteção de rotas
├── screens/       telas organizadas por funcionalidade
├── services/      comunicação com a API
├── theme/         cores, fontes e espaçamentos
├── types/         contratos TypeScript
└── utils/         validações e formatações

```

O fluxo de acesso aos dados segue esta sequência:

```text
Tela -> Hook -> TanStack Query -> Service -> Axios -> API
```

## Configuração e execução

### Pré-requisitos

- Node.js 22
- npm
- Expo Go compatível com SDK 58 ou uma development build
- API AgroConecta disponível

### Instalação

```bash
npm install
```

Crie o arquivo `.env` com base no `.env.example`:

```env
EXPO_PUBLIC_API_URL=http://IP_DA_API:8080
EXPO_PUBLIC_COMMIT_HASH=
```

`EXPO_PUBLIC_API_URL` deve conter a origem da API sem `/api` no final.

Não coloque chaves, senhas ou tokens em variáveis `EXPO_PUBLIC_*`, pois elas ficam disponíveis no aplicativo.

### Iniciar o projeto

```bash
npx expo start
```

No celular físico, o aparelho e o computador devem estar na mesma rede. Para acessar uma API local pelo emulador Android, utilize `http://10.0.2.2:8080`.

## Verificações

```bash
npx tsc --noEmit
npx expo install --check
```

## Limitações

- Não há integração com ESP32 físico nesta versão.
- Não são utilizados MQTT nem dados de satélite.
- As leituras são registradas manualmente ou produzidas pela simulação controlada do backend.
- A saúde dos sensores utiliza critérios demonstrativos.
- Os parâmetros agronômicos não substituem avaliação profissional.
- A solução não aciona sistemas de irrigação automaticamente.
- A orientação depende da disponibilidade da API e do provedor de IA.

## ODS relacionados

- **ODS 2 — Fome zero e agricultura sustentável:** apoio ao acompanhamento do cultivo por pequenos produtores.
- **ODS 9 — Indústria, inovação e infraestrutura:** integração entre aplicativo, API, banco de dados, mensageria e IA.
- **ODS 13 — Ação contra a mudança global do clima:** apoio à interpretação de condições hídricas do cultivo.
