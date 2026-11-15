# Auditoria técnica — etapa 12

Data de conclusão: 14/11/2026 22:27 -03. Aplicativo CitizenTech / Agro Conecta. Execução sobre a API real de desenvolvimento, conta de teste indicada no pedido, identificada neste relatório somente como usuário #5.

## Resumo executivo

Os quatro cenários principais produziram os riscos esperados e permanecem salvos. A propriedade **Cenários de Validação GS** (#9) contém os cinco talhões solicitados. Foram preservados 9 sensores, 13 leituras, 4 atividades, 6 revisões de perfis e 4 RiskJobs. Alertas #10, #11 e #12 ficaram ACKNOWLEDGED, OPEN e RESOLVED.

A auditoria encontrou e corrigiu um defeito mobile comprovado: quantidade de atividade aceitava 12 ou 13 dígitos inteiros, enquanto a API permite 11. A entrega tem limitações explícitas: INSPECTION e MAINTENANCE não existem no enum do diário; o provedor de guidance estava indisponível; o fallback obtido não foi persistido pela API. O conteúdo foi preservado abaixo, mas não estará disponível por GET em uma nova sessão do aplicativo. A interface e os comportamentos nativos continuam pendentes de conferência manual.

| Grupo | Aprovados | Falhos | Não executados |
| --- | --- | --- | --- |
| Testes automatizados do repositório (Node) | 105 | 0 | 0 |
| Testes temporários de transporte real Axios (Node) | 2 | 0 | 0 |
| Total de testes automatizados | 107 | 0 | 0 |
| Cenários reais de integração e asserções sobre estados persistidos | 416 | 1 | 12 |
| Verificações locais: TypeScript e compatibilidade Expo | 2 | 0 | 0 |
| Lint | 0 | 0 | 1 |

Critério de contagem: cada linha da matriz detalhada corresponde a um cenário/checagem, inclusive cada GET de polling e cada asserção sobre uma resposta real. São 377 chamadas HTTP contabilizadas e 40 asserções de estado, além de 12 casos não executados. A falha contabilizada corresponde à exigência de preservar o fallback para consulta futura no app; não é uma falha do cálculo determinístico ou da suíte Node. Rejeições 400/401/403/404/409/405 contam como aprovadas quando eram esperadas. Testes locais não são somados à contagem de cenários HTTP.

## Ambiente, método e integridade

- Linux, Node 22.23.5 já instalado, npm, Python 3/urllib para o roteiro HTTP. O Node padrão 18.19.1 rejeitou `--experimental-strip-types`; a suíte foi então executada com Node 22, sem instalar ferramenta. Essa tentativa de comando não representa teste reprovado.
- Expo instalado **58.0.25**, declaração `~58.0.25`; React Native 0.88.1, React 19.3.0, TypeScript ~6.0.3. Manifesto e package-lock preservados por comparação SHA-256 com o início desta execução.
- API em `http://192.168.1.18:8080`, mesma origem do `.env`; `/actuator/health` retornou 200/UP. `.env` não foi alterado. JWT obtido pelo login e mantido somente em memória num processo temporário, sem imprimir resposta de autenticação ou credenciais.
- Conta inicialmente vazia: propriedades, talhões, sensores, leituras e alertas com totalElements=0. Inventários finais comparam conjuntos exatos de IDs.
- PostgreSQL/pgvector e RabbitMQ estavam em containers já existentes. O processamento real concluiu os quatro jobs. Consultas SQL exclusivamente SELECT comprovaram as revisões e a propriedade dos IDs usados nos testes de isolamento; nenhuma escrita direta foi realizada no banco.
- Somente recursos com nome/descrição **DESCARTÁVEL**, ou leituras vinculadas a sensor assim nomeado, receberam DELETE. Os testes de conflito destrutivo também usaram descartáveis; nenhum permanente recebeu tentativa de DELETE.
- Nenhum mock substituiu a API nos testes E2E. O teste de falha de rede usou conexão real recusada em localhost:9, sem servidor fictício; o de timeout usou a API real com timeout reduzido apenas no teste.
- Sem automação visual/ADB/reconhecimento de tela/cliques, alteração da API Java, instalação de dependências, build nativo, prebuild, EAS ou commit. O HEAD permaneceu `9065366`.

Documentação consultada: [Expo SDK 58](https://docs.expo.dev/versions/v58.0.0/), [índice e correções Expo](https://docs.expo.dev/llms.txt), [SecureStore SDK 58](https://docs.expo.dev/versions/v58.0.0/sdk/securestore/) e [Expo Router](https://docs.expo.dev/router/introduction.md). A inspeção de SecureStore não equivale à execução nativa.

## Matriz das funcionalidades e alcance da evidência

| Funcionalidade | Validação realizada | Resultado / limite |
| --- | --- | --- |
| Autenticação | Login válido/inválido, auth/me, mesmo JWT em nova consulta, rotas sem token, papel técnico proibido | 200/401/403 conforme esperado; SecureStore e logout por inspeção, sem execução nativa. |
| Propriedades/talhões | Cadastro, edição, detalhes, páginas 0/1, capacidade excedida/redução, transferência de descartável | Aprovado; arquivar/reativar e exclusões de descartáveis confirmados. |
| Restrições de arquivado | Diário POST/PUT/DELETE e leitura POST bloqueados; RiskJob rejeitado; consultas permitidas | 409 nas escritas protegidas; perfil continua editável conforme contrato. |
| Perfil agronômico | 404 antes da criação, CC/PMP, decimais, profundidades, demo, revisão atual e histórico em SELECT | Normal com duas revisões preservadas; GET só expõe a mais recente. Arquivado com mais duas revisões. |
| Diário | Irrigação, plantio, fertilização, colheita; quantidade/unidade, edição, filtros, períodos, futuro, exclusão | Aprovado para tipos existentes; inspeção/manutenção não disponíveis no contrato. |
| Data/hora | Utilitário real toActivityRequest em America/Sao_Paulo gerou payload enviado e persistido | Conversão local → UTC e decimal com vírgula confirmados em PUT real; testes cobrem fusos e DST. |
| Sensores | Quatro tipos, códigos normalizados, duplicidade, listagens/detalhes, edição/transferência e status | Aprovado; datas futuras 400; exclusão com leituras 409; sensor vazio 204/404. |
| Leituras | Cadastro por tipo, limites inclusivos/excedidos, chuva, futuro, listas, ordem/páginas, latest, PUT e DELETE | Aprovado; PUT 405 e valor intacto. Leitura ANALYZED não disponível para exclusão protegida. |
| Saúde | RECENT/STALE/OFFLINE/INVALID_TIMESTAMP, HEALTHY/POSSIBLE_FAULT/INSUFFICIENT_DATA, status e bateria | Estados reais observados em descartáveis; metadados de calibração/manutenção null, sem escrita pelo mobile. |
| Risco | Um POST por cenário, GET mesmo job, histórico paginado, snapshot/limiares/perfil/regras/qualidade/tendência/VPD/chuva | Quatro riscos esperados. PENDING e COMPLETED_WITHOUT_AI observados; demais estados não observados. |
| Alertas | Lista geral/por talhão, detalhe, reconhecer/resolver, datas/usuário e imutabilidade do resultado | OPEN, ACKNOWLEDGED e RESOLVED preservados; confirmação de resolução inspecionada. Reconhecimento tem ação direta. |
| IA/RAG | Um POST sem body no job #11; GET posterior; risco comparado antes/depois | 200 fallback PROVIDER_UNAVAILABLE, sources=[], guidance=null no GET. Fontes reais e orientação válida não obtidas. |
| Dashboard | Totais, conjuntos exatos de IDs, quatro resumos, atividades, alertas ativos e nova consulta manual | Aprovado com resposta completa; jobs problemáticos e sensorIssues vazios após limpeza. Refresh/atalhos por inspeção. |
| Segurança/erros | 400/401/403/404/409, dados alheios, timeout Axios real, rede recusada e parser do mobile | Nenhum dado alheio exposto nas respostas. Conteúdo de relatórios sem senha/JWT/segredo. |
| Navegação/cache | Services/hooks/query keys e callbacks de invalidação revisados; TypeScript | Rotas tipadas existentes com React Navigation; divergência de AGENTS.md quanto a Expo Router permanece. |
| Interface/nativo | Não executado visualmente | Teclado, layout, temas, acessibilidade, navegação efetiva, confirmações e SecureStore dependem do celular. |

## Dados permanentes e respectivos IDs

| Recurso | ID / vínculo | Estado ou dados |
| --- | --- | --- |
| Propriedade | 9 | Cenários de Validação GS; Campinas/SP; 120,5 ha; cinco talhões de 10,5 ha cada. |
| GS - Condição Normal | 8 | Propriedade 9; status de cadastro NORMAL; consultar RiskJob para classificação determinística. |
| GS - Condição de Atenção | 9 | Propriedade 9; status de cadastro NORMAL; consultar RiskJob para classificação determinística. |
| GS - Condição Crítica | 10 | Propriedade 9; status de cadastro NORMAL; consultar RiskJob para classificação determinística. |
| GS - Dados Insuficientes | 11 | Propriedade 9; status de cadastro NORMAL; consultar RiskJob para classificação determinística. |
| GS - Talhão Arquivado | 12 | Propriedade 9; status de cadastro ARCHIVED; consultar RiskJob para classificação determinística. |

O status cadastral do talhão não deve substituir `result.riskLevel` do RiskJob. O talhão #12 permanece ARCHIVED; os quatro cenários de análise estão ativos. A soma nominal dos cinco talhões é 52,5 ha, abaixo de 120,5 ha; a ocupação ativa é 42 ha após arquivamento.

| Perfil / revisão | ID | Talhão | Valores |
| --- | --- | --- | --- |
| normal_r1 | 5 | 8 | rev=1; CC=45.0%; PMP=15.0%; raiz=40.5 cm; sensor=20.25 cm; demo=True |
| normal_r2 | 6 | 8 | rev=2; CC=45.0%; PMP=15.0%; raiz=40.5 cm; sensor=20.25 cm; demo=True |
| attention_r1 | 7 | 9 | rev=1; CC=45.0%; PMP=15.0%; raiz=40.5 cm; sensor=20.25 cm; demo=True |
| critical_r1 | 8 | 10 | rev=1; CC=45.0%; PMP=15.0%; raiz=40.5 cm; sensor=20.25 cm; demo=True |
| archived_r1 | 9 | 12 | rev=1; CC=45.0%; PMP=15.0%; raiz=40.5 cm; sensor=20.25 cm; demo=True |
| archived_r2 | 10 | 12 | rev=2; CC=45.0%; PMP=15.0%; raiz=40.5 cm; sensor=20.25 cm; demo=True |

Textura: Franco-argiloso. Fonte: “Demonstração GS etapa 12; parâmetros informados manualmente para auditoria.”, com identificação das revisões adicionais. O talhão Insuficiente #11 permanece sem perfil e sem leituras. O SELECT final encontrou perfis #5–10 com revisões 1/2 no Normal, 1 na Atenção, 1 no Crítico e 1/2 no Arquivado. Não existe endpoint implementado de histórico de perfis no mobile.

| Sensor | ID | Talhão | Tipo | deviceCode | Estado |
| --- | --- | --- | --- | --- | --- |
| GS normal - Umidade do solo | 10 | 8 | SOIL_MOISTURE | GS12-20261115011749-NORMAL-SOIL | ACTIVE |
| GS normal - Temperatura | 11 | 8 | TEMPERATURE | GS12-20261115011749-NORMAL-TEMP | ACTIVE |
| GS normal - Umidade do ar | 12 | 8 | HUMIDITY | GS12-20261115011749-NORMAL-AIR | ACTIVE |
| GS normal - Estação meteorológica | 13 | 8 | WEATHER_STATION | GS12-20261115011749-NORMAL-WEATHER | ACTIVE |
| GS attention - Umidade do solo | 14 | 9 | SOIL_MOISTURE | GS12-20261115011749-ATTENTION-SOIL | ACTIVE |
| GS attention - Estação meteorológica | 15 | 9 | WEATHER_STATION | GS12-20261115011749-ATTENTION-WEATHER | ACTIVE |
| GS critical - Umidade do solo | 16 | 10 | SOIL_MOISTURE | GS12-20261115011749-CRITICAL-SOIL | ACTIVE |
| GS critical - Estação meteorológica | 17 | 10 | WEATHER_STATION | GS12-20261115011749-CRITICAL-WEATHER | ACTIVE |
| GS archived - Umidade do solo | 18 | 12 | SOIL_MOISTURE | GS12-20261115011749-ARCHIVED-SOIL | ACTIVE |

| Atividade | ID | Talhão | Tipo | Quantidade | UTC persistido |
| --- | --- | --- | --- | --- | --- |
| GS - Irrigação demonstrativa conferida; volume manual. Conversão local UTC validada pelo utilitário real do mobile. | 8 | 8 | IRRIGATION | 12.5 mm | 2026-11-14T21:24:48.398Z |
| GS - Plantio demonstrativo de milho. | 9 | 8 | PLANTING | 60000 sementes/ha | 2026-11-05T01:17:50.287177Z |
| GS - Fertilização demonstrativa de cobertura. | 10 | 9 | FERTILIZATION | 120.75 kg/ha | 2026-11-13T01:17:50.325739Z |
| GS - Registro demonstrativo de colheita do ciclo anterior. | 11 | 9 | HARVEST | 6.25 t/ha | 2026-10-16T01:17:50.363002Z |

Exemplo efetivamente persistido: `14/11/2026 18:24:48.398` em America/Sao_Paulo → `2026-11-14T21:24:48.398Z`; quantidade `12,5` → JSON `12.5`.

| Leitura | ID | Sensor / talhão | Solo % | Temperatura °C | Ar % | Bateria % | Chuva mm | measuredAt UTC | Intervalo de chuva UTC |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| normal_previous | 11 | 10 / 8 | 35.0 | None | None | 93 | None | 2026-11-14T23:18:38.485848Z | None |
| normal_current | 12 | 10 / 8 | 34.5 | None | None | 92 | None | 2026-11-15T01:13:38.644194Z | None |
| normal_temperature | 13 | 11 / 8 | None | 26.8 | None | 92 | None | 2026-11-15T01:13:38.718283Z | None |
| normal_air | 14 | 12 / 8 | None | None | 63 | 92 | None | 2026-11-15T01:13:38.791324Z | None |
| normal_rain_7d | 15 | 13 / 8 | None | None | None | 93 | 8 | 2026-11-13T01:18:38.887524Z | 2026-11-13T00:18:38.887468Z |
| normal_rain_24h | 16 | 13 / 8 | None | 26.8 | 63 | 92 | 2.5 | 2026-11-15T01:12:39.017936Z | 2026-11-15T00:18:39.017893Z |
| attention_previous | 17 | 14 / 9 | 24.6 | None | None | 94 | None | 2026-11-14T23:18:39.146105Z | None |
| attention_current | 18 | 14 / 9 | 24 | None | None | 92 | None | 2026-11-15T01:13:39.214120Z | None |
| attention_weather | 19 | 15 / 9 | None | 26.8 | 63 | 92 | 0 | 2026-11-15T01:12:39.252119Z | 2026-11-15T00:18:39.252054Z |
| critical_previous | 20 | 16 / 10 | 19.6 | None | None | 94 | None | 2026-11-14T23:18:39.289556Z | None |
| critical_current | 21 | 16 / 10 | 19.5 | None | None | 92 | None | 2026-11-15T01:13:39.329557Z | None |
| critical_weather | 22 | 17 / 10 | None | 26.8 | 63 | 92 | 0 | 2026-11-15T01:12:39.382305Z | 2026-11-15T00:18:39.382270Z |
| archived_historical | 23 | 18 / 12 | 30 | None | None | 92 | None | 2026-11-15T00:18:39.433189Z | None |

Todas as leituras permanentes são MANUAL. Os dados foram informados para demonstração; não são registros instrumentais de campo. `simulated=false` no snapshot não elimina `demo=true` do perfil/regras. `None` nas tabelas significa ausência real do campo, sem conversão para zero. O endpoint latest retorna a última leitura de qualquer sensor do talhão: no Normal, #14 (umidade do ar), enquanto o solo mais recente é #12.

## Indicadores, snapshots e estados finais

Disponibilidade bruta = `100 × (umidade do solo − PMP)/(CC − PMP)`. A disponibilidade exibida é limitada a 0–100% pela API. Com CC=45 e PMP=15: Normal `100×(34,5−15)/30=65%`; Atenção `100×(24−15)/30=30%`; Crítico `100×(19,5−15)/30=15%`.

VPD = `0,6108 × exp(17,27 × T/(T+237,3)) × (1−UR/100)`. Para 26,8 °C e 63%: **1,3037762493 kPa**, abaixo do gatilho demonstrativo de 2 kPa. Tendência = `(umidade atual − anterior)/(diferença de tempo em horas)`; os instantes reais têm pequenos deslocamentos entre chamadas, preservados nas leituras.

| Cenário | Job ID | Status final | Risco | Disponibilidade | VPD | Variação pp/h | Qualidade / tendência | Alerta |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| normal | 9 | COMPLETED_WITHOUT_AI | NORMAL | 65.0 | 1.3037762493396732 | -0.26086357873851607 | COMPLETE / DRYING_SLOWLY | None |
| attention | 10 | COMPLETED_WITHOUT_AI | ATTENTION | 30.0 | 1.3037762493396732 | -0.3130403925445951 | COMPLETE / DRYING_SLOWLY | ACKNOWLEDGED |
| critical | 11 | COMPLETED_WITHOUT_AI | CRITICAL | 15.0 | 1.3037762493396732 | -0.052173610580204095 | COMPLETE / DRYING_SLOWLY | OPEN |
| insufficient | 12 | COMPLETED_WITHOUT_AI | INSUFFICIENT_DATA | None | None | None | INSUFFICIENT / INSUFFICIENT_DATA | RESOLVED |

Regras capturadas: `rulesVersion=demo-v1`, crítico ≤20%, atenção >20% e ≤40%, VPD alto ≥2 kPa, secagem rápida ≤−3 pontos percentuais/hora, dados recentes até 24 h. Todas as tendências disponíveis ficaram DRYING_SLOWLY, sem secagem rápida. Normal, Atenção e Crítico tiveram dataQuality=COMPLETE e limitations=[] para os indicadores determinísticos; isso não certifica cobertura de chuva nem origem de campo.

Chuva Normal: **2,5 mm em 24 h** e **10,5 mm em 7 dias**. Atenção/Crítico: 0 mm nos intervalos fornecidos. Todas essas janelas têm `complete=false`, com “Cobertura parcial da janela”; os totais não significam cobertura contínua. Insuficiente retorna chuva null com “Sem medições de chuva”.

| Alerta (ID do job) | Estado final | acknowledgedAt / By | resolvedAt / By | Risco original |
| --- | --- | --- | --- | --- |
| 10 | ACKNOWLEDGED | 2026-11-15T01:21:16.997510Z / 5 | None / None | ATTENTION |
| 11 | OPEN | None / None | None / None | CRITICAL |
| 12 | RESOLVED | 2026-11-15T01:21:17.057677Z / 5 | 2026-11-15T01:21:17.080789Z / 5 | INSUFFICIENT_DATA |

O ID de alerta neste contrato é o próprio ID do RiskJob, sem identificador separado. O resultado foi comparado integralmente antes/depois de reconhecer e resolver; não mudou. No Normal não há alerta e GET /api/alerts/9 retornou 404. O dashboard lista apenas OPEN e ACKNOWLEDGED; RESOLVED continua disponível na lista geral de alertas.

Snapshots sanitizados completos dos quatro RiskJobs finais, incluindo perfil, limiares, leituras, regras, datas e alertas:

### normal

```json
{
  "measurements": [
    {
      "id": 14,
      "sensorId": 12,
      "measuredAt": "2026-11-15T01:13:38.791324Z",
      "soilMoisture": null,
      "airTemperature": null,
      "airHumidity": 63.0,
      "simulated": false
    },
    {
      "id": 13,
      "sensorId": 11,
      "measuredAt": "2026-11-15T01:13:38.718283Z",
      "soilMoisture": null,
      "airTemperature": 26.8,
      "airHumidity": null,
      "simulated": false
    },
    {
      "id": 12,
      "sensorId": 10,
      "measuredAt": "2026-11-15T01:13:38.644194Z",
      "soilMoisture": 34.5,
      "airTemperature": null,
      "airHumidity": null,
      "simulated": false
    },
    {
      "id": 16,
      "sensorId": 13,
      "measuredAt": "2026-11-15T01:12:39.017936Z",
      "soilMoisture": null,
      "airTemperature": 26.8,
      "airHumidity": 63.0,
      "simulated": false
    },
    {
      "id": 11,
      "sensorId": 10,
      "measuredAt": "2026-11-14T23:18:38.485848Z",
      "soilMoisture": 35.0,
      "airTemperature": null,
      "airHumidity": null,
      "simulated": false
    },
    {
      "id": 15,
      "sensorId": 13,
      "measuredAt": "2026-11-13T01:18:38.887524Z",
      "soilMoisture": null,
      "airTemperature": null,
      "airHumidity": null,
      "simulated": false
    }
  ],
  "acknowledgedAt": null,
  "acknowledgedBy": null,
  "alert": null,
  "alertStatus": null,
  "attempts": 1,
  "completedAt": "2026-11-15T01:21:00.923675Z",
  "createdAt": "2026-11-15T01:20:56.115924Z",
  "cropAreaId": 8,
  "cropType": "Milho",
  "demo": true,
  "errorMessage": null,
  "fieldCapacity": 45.0,
  "guidance": null,
  "id": 9,
  "latestRainAt": "2026-11-15T01:12:39.017936Z",
  "ownerId": 5,
  "profileId": 6,
  "rainfall": {
    "last7Days": {
      "millimeters": 10.5,
      "complete": false,
      "limitation": "Cobertura parcial da janela"
    },
    "last24Hours": {
      "millimeters": 2.5,
      "complete": false,
      "limitation": "Cobertura parcial da janela"
    }
  },
  "recoveryCount": 0,
  "resolvedAt": null,
  "resolvedBy": null,
  "result": {
    "riskLevel": "NORMAL",
    "waterAvailabilityPercent": 65.0,
    "rawAvailabilityPercent": 65.0,
    "vpdKpa": 1.3037762493396732,
    "moistureChangePerHour": -0.26086357873851607,
    "rulesTriggered": [],
    "limitations": [],
    "rulesVersion": "demo-v1",
    "demo": true,
    "dataQuality": "COMPLETE",
    "moistureTrend": "DRYING_SLOWLY"
  },
  "rulesVersion": "demo-v1",
  "secondsSinceRain": 497,
  "startedAt": "2026-11-15T01:21:00.921386Z",
  "status": "COMPLETED_WITHOUT_AI",
  "thresholds": {
    "criticalAvailability": 20.0,
    "attentionAvailability": 40.0,
    "highVpd": 2.0,
    "rapidDryingPerHour": -3.0,
    "staleAfter": "PT24H",
    "version": "demo-v1"
  },
  "wiltingPoint": 15.0
}
```

### attention

```json
{
  "measurements": [
    {
      "id": 18,
      "sensorId": 14,
      "measuredAt": "2026-11-15T01:13:39.214120Z",
      "soilMoisture": 24.0,
      "airTemperature": null,
      "airHumidity": null,
      "simulated": false
    },
    {
      "id": 19,
      "sensorId": 15,
      "measuredAt": "2026-11-15T01:12:39.252119Z",
      "soilMoisture": null,
      "airTemperature": 26.8,
      "airHumidity": 63.0,
      "simulated": false
    },
    {
      "id": 17,
      "sensorId": 14,
      "measuredAt": "2026-11-14T23:18:39.146105Z",
      "soilMoisture": 24.6,
      "airTemperature": null,
      "airHumidity": null,
      "simulated": false
    }
  ],
  "acknowledgedAt": "2026-11-15T01:21:16.997510Z",
  "acknowledgedBy": 5,
  "alert": {
    "type": "LOW_SOIL_WATER",
    "title": "Disponibilidade hídrica baixa",
    "justification": "Disponibilidade hídrica baixa. Regras acionadas: LOW_WATER_AVAILABILITY",
    "level": "ATTENTION",
    "rules": [
      "LOW_WATER_AVAILABILITY"
    ],
    "demo": true,
    "status": "ACKNOWLEDGED",
    "createdAt": "2026-11-15T01:21:05.958062Z",
    "acknowledgedAt": "2026-11-15T01:21:16.997510Z",
    "acknowledgedBy": 5,
    "resolvedAt": null,
    "resolvedBy": null
  },
  "alertStatus": "ACKNOWLEDGED",
  "attempts": 1,
  "completedAt": "2026-11-15T01:21:05.958062Z",
  "createdAt": "2026-11-15T01:21:02.448683Z",
  "cropAreaId": 9,
  "cropType": "Milho",
  "demo": true,
  "errorMessage": null,
  "fieldCapacity": 45.0,
  "guidance": null,
  "id": 10,
  "latestRainAt": null,
  "ownerId": 5,
  "profileId": 7,
  "rainfall": {
    "last7Days": {
      "millimeters": 0.0,
      "complete": false,
      "limitation": "Cobertura parcial da janela"
    },
    "last24Hours": {
      "millimeters": 0.0,
      "complete": false,
      "limitation": "Cobertura parcial da janela"
    }
  },
  "recoveryCount": 0,
  "resolvedAt": null,
  "resolvedBy": null,
  "result": {
    "riskLevel": "ATTENTION",
    "waterAvailabilityPercent": 30.0,
    "rawAvailabilityPercent": 30.0,
    "vpdKpa": 1.3037762493396732,
    "moistureChangePerHour": -0.3130403925445951,
    "rulesTriggered": [
      "LOW_WATER_AVAILABILITY"
    ],
    "limitations": [],
    "rulesVersion": "demo-v1",
    "demo": true,
    "dataQuality": "COMPLETE",
    "moistureTrend": "DRYING_SLOWLY"
  },
  "rulesVersion": "demo-v1",
  "secondsSinceRain": null,
  "startedAt": "2026-11-15T01:21:05.957842Z",
  "status": "COMPLETED_WITHOUT_AI",
  "thresholds": {
    "criticalAvailability": 20.0,
    "attentionAvailability": 40.0,
    "highVpd": 2.0,
    "rapidDryingPerHour": -3.0,
    "staleAfter": "PT24H",
    "version": "demo-v1"
  },
  "wiltingPoint": 15.0
}
```

### critical

```json
{
  "measurements": [
    {
      "id": 21,
      "sensorId": 16,
      "measuredAt": "2026-11-15T01:13:39.329557Z",
      "soilMoisture": 19.5,
      "airTemperature": null,
      "airHumidity": null,
      "simulated": false
    },
    {
      "id": 22,
      "sensorId": 17,
      "measuredAt": "2026-11-15T01:12:39.382305Z",
      "soilMoisture": null,
      "airTemperature": 26.8,
      "airHumidity": 63.0,
      "simulated": false
    },
    {
      "id": 20,
      "sensorId": 16,
      "measuredAt": "2026-11-14T23:18:39.289556Z",
      "soilMoisture": 19.6,
      "airTemperature": null,
      "airHumidity": null,
      "simulated": false
    }
  ],
  "acknowledgedAt": null,
  "acknowledgedBy": null,
  "alert": {
    "type": "LOW_SOIL_WATER",
    "title": "Disponibilidade hídrica baixa",
    "justification": "Disponibilidade hídrica baixa. Regras acionadas: LOW_WATER_AVAILABILITY",
    "level": "CRITICAL",
    "rules": [
      "LOW_WATER_AVAILABILITY"
    ],
    "demo": true,
    "status": "OPEN",
    "createdAt": "2026-11-15T01:21:10.988581Z",
    "acknowledgedAt": null,
    "acknowledgedBy": null,
    "resolvedAt": null,
    "resolvedBy": null
  },
  "alertStatus": "OPEN",
  "attempts": 1,
  "completedAt": "2026-11-15T01:21:10.988581Z",
  "createdAt": "2026-11-15T01:21:07.249555Z",
  "cropAreaId": 10,
  "cropType": "Milho",
  "demo": true,
  "errorMessage": null,
  "fieldCapacity": 45.0,
  "guidance": null,
  "id": 11,
  "latestRainAt": null,
  "ownerId": 5,
  "profileId": 8,
  "rainfall": {
    "last7Days": {
      "millimeters": 0.0,
      "complete": false,
      "limitation": "Cobertura parcial da janela"
    },
    "last24Hours": {
      "millimeters": 0.0,
      "complete": false,
      "limitation": "Cobertura parcial da janela"
    }
  },
  "recoveryCount": 0,
  "resolvedAt": null,
  "resolvedBy": null,
  "result": {
    "riskLevel": "CRITICAL",
    "waterAvailabilityPercent": 15.0,
    "rawAvailabilityPercent": 15.0,
    "vpdKpa": 1.3037762493396732,
    "moistureChangePerHour": -0.052173610580204095,
    "rulesTriggered": [
      "LOW_WATER_AVAILABILITY"
    ],
    "limitations": [],
    "rulesVersion": "demo-v1",
    "demo": true,
    "dataQuality": "COMPLETE",
    "moistureTrend": "DRYING_SLOWLY"
  },
  "rulesVersion": "demo-v1",
  "secondsSinceRain": null,
  "startedAt": "2026-11-15T01:21:10.988329Z",
  "status": "COMPLETED_WITHOUT_AI",
  "thresholds": {
    "criticalAvailability": 20.0,
    "attentionAvailability": 40.0,
    "highVpd": 2.0,
    "rapidDryingPerHour": -3.0,
    "staleAfter": "PT24H",
    "version": "demo-v1"
  },
  "wiltingPoint": 15.0
}
```

### insufficient

```json
{
  "measurements": [],
  "acknowledgedAt": "2026-11-15T01:21:17.057677Z",
  "acknowledgedBy": 5,
  "alert": {
    "type": "MISSING_REQUIRED_SENSOR",
    "title": "Verifique os dados do cultivo",
    "justification": "Verifique os dados do cultivo. Regras acionadas: MISSING_REQUIRED_SENSOR, INVALID_AGRONOMIC_PROFILE",
    "level": "INSUFFICIENT_DATA",
    "rules": [
      "MISSING_REQUIRED_SENSOR",
      "INVALID_AGRONOMIC_PROFILE"
    ],
    "demo": true,
    "status": "RESOLVED",
    "createdAt": "2026-11-15T01:21:16.008236Z",
    "acknowledgedAt": "2026-11-15T01:21:17.057677Z",
    "acknowledgedBy": 5,
    "resolvedAt": "2026-11-15T01:21:17.080789Z",
    "resolvedBy": 5
  },
  "alertStatus": "RESOLVED",
  "attempts": 1,
  "completedAt": "2026-11-15T01:21:16.008236Z",
  "createdAt": "2026-11-15T01:21:12.040733Z",
  "cropAreaId": 11,
  "cropType": "Milho",
  "demo": true,
  "errorMessage": null,
  "fieldCapacity": null,
  "guidance": null,
  "id": 12,
  "latestRainAt": null,
  "ownerId": 5,
  "profileId": null,
  "rainfall": {
    "last7Days": {
      "millimeters": null,
      "complete": false,
      "limitation": "Sem medições de chuva"
    },
    "last24Hours": {
      "millimeters": null,
      "complete": false,
      "limitation": "Sem medições de chuva"
    }
  },
  "recoveryCount": 0,
  "resolvedAt": "2026-11-15T01:21:17.080789Z",
  "resolvedBy": 5,
  "result": {
    "riskLevel": "INSUFFICIENT_DATA",
    "waterAvailabilityPercent": null,
    "rawAvailabilityPercent": null,
    "vpdKpa": null,
    "moistureChangePerHour": null,
    "rulesTriggered": [
      "MISSING_REQUIRED_SENSOR",
      "INVALID_AGRONOMIC_PROFILE"
    ],
    "limitations": [
      "Umidade do solo recente ausente",
      "Perfil agronômico ausente",
      "Temperatura e umidade do ar simultâneas ausentes"
    ],
    "rulesVersion": "demo-v1",
    "demo": true,
    "dataQuality": "INSUFFICIENT",
    "moistureTrend": "INSUFFICIENT_DATA"
  },
  "rulesVersion": "demo-v1",
  "secondsSinceRain": null,
  "startedAt": "2026-11-15T01:21:16.008116Z",
  "status": "COMPLETED_WITHOUT_AI",
  "thresholds": {
    "criticalAvailability": 20.0,
    "attentionAvailability": 40.0,
    "highVpd": 2.0,
    "rapidDryingPerHour": -3.0,
    "staleAfter": "PT24H",
    "version": "demo-v1"
  },
  "wiltingPoint": null
}
```

## Guidance: tentativa única e preservação do conteúdo recebido

`POST /api/risk-jobs/11/guidance`, sem body, HTTP 200, 0.012 s. Apenas uma tentativa principal. O mesmo job foi consultado em seguida; resultado CRITICAL permaneceu idêntico. Não houve nova tentativa ou chamada automática para tentar obter sucesso.

```json
{
  "sources": [],
  "reason": "PROVIDER_UNAVAILABLE",
  "warnings": [
    "A orientação não substitui avaliação agronômica"
  ],
  "recommendation": "Verifique os dados e o sensor com assistência técnica antes de decidir o manejo.",
  "recommendedActions": [
    "Conferir as medições e o perfil agronômico"
  ],
  "signals": [
    "LOW_WATER_AVAILABILITY"
  ],
  "summary": "Orientação automática indisponível; consulte o resultado determinístico.",
  "fallback": true,
  "riskLevel": "CRITICAL",
  "generatedAt": "2026-11-15T01:21:17.225566448Z"
}
```

O fallback é um retorno válido de contingência, com fontes vazias, aviso profissional e sinais determinísticos, mas **não uma orientação gerada com sucesso**. O GET posterior trouxe guidance=null e status COMPLETED_WITHOUT_AI. O contrato Java só devolve esse fallback na resposta, sem gravá-lo. Sua preservação neste relatório não torna o fallback consultável posteriormente pelo app. Isso fica registrado como uma exigência não atendida pela API atual, sem alterar o backend ou criar persistência artificial no mobile.

O mobile tem timeout geral de 15 s e timeout exclusivo de guidance de 180 s; mutation retry=false; a ação é explícita. Orientação válida (`fallback=false`) é reutilizada; resposta incerta exige GET do mesmo job. O fallback local fica no QueryClient, sobrevivendo a GET guidance=null na sessão atual, porém não a logout/reinício. Conteúdo é renderizado como texto. As URLs só podem ser abertas se `safeSourceUrl` aceitar HTTP(S), host válido e ausência de credenciais/caracteres de controle. Não houve fonte real a abrir nesta execução. `guidance.riskLevel` não substitui `result.riskLevel`; os badges de demonstração do resultado permanecem separados.

## Saúde dos sensores

| Estado | Evidência real | Interpretação |
| --- | --- | --- |
| RECENT / HEALTHY | Permanentes #10–18 após leituras; bateria mais recente 92% | Comunicação <24 h; sem heurística de falha acionada. |
| STALE / STALE | DESCARTÁVEL #20, leitura de 25 h; bateria 25% | Idade ≥24 h e <48 h. |
| OFFLINE / OFFLINE | DESCARTÁVEL #21, leitura de 49 h; bateria 25% | Idade ≥48 h. |
| OFFLINE / INSUFFICIENT_DATA | Todos os sensores recém-criados antes da primeira leitura | Sem timestamp/idade/bateria; ausência de leituras não é diagnóstico físico. |
| RECENT / POSSIBLE_FAULT | DESCARTÁVEL #22, seis temperaturas iguais em aproximadamente 60 min | Heurística flat: seis amostras, abrangência ≥50 min. |
| RECENT / POSSIBLE_FAULT | DESCARTÁVEL #23, salto de 0 para 26 °C em aproximadamente 2 min | Heurística jump: diferença >20 °C em até 5 min. |
| Status administrativo independente | DESCARTÁVEL #25 em INACTIVE/FAULT/MAINTENANCE, mantendo RECENT/HEALTHY | Status administrativo não substitui comunicação ou saúde calculada. Escrita de leitura é bloqueada com 409. |
| INVALID_TIMESTAMP | DESCARTÁVEL #25 com leitura 1 min no futuro aceita dentro da tolerância de 5 min | Comunicação marca timestamp inválido; cálculo de saúde ignora futuro e usa a amostra recente anterior. |

Política retornada: `DEMO: stale=24h; offline=48h; flat=6/50min; jump=5min`. Esses limites demonstrativos não diagnosticam hardware. A bateria é a da leitura mais recente; zero é preservado. calibratedAt e maintenanceNote vieram null. O produtor/mobile não possui fluxo de escrita desses metadados; a tentativa na rota técnica com produtor retornou 403. Os sensores permanentes não foram artificialmente degradados.

## Dashboard, cache, autenticação e navegação — auditoria do código

| Área / arquivos | Constatação | Alcance |
| --- | --- | --- |
| services/*Service.ts | Endpoints, payloads permitidos, IDs positivos, signal nos GET e erros comparados ao contrato real. PATCH de alerta devolve 200 com job; o service pode ignorar o body e faz GET autoritativo. | HTTP real e inspeção; sem execução das telas. |
| hooks/*/*Keys.ts | Chaves incluem recurso, escopo, IDs, paginação e filtros; não incluem JWT. Cache é limpo no logout. | Inspeção de todas as famílias de hooks. |
| useCreate/Update/DeleteFarm; useCropAreaCache | Propriedades invalidam listas/dashboard; renomeação invalida talhões/sensores/leituras. Talhão invalida propriedades de origem/destino e listas relacionadas. | Guarda isSessionCurrent antes/depois de awaits. |
| useSensorCache; useReadingCache | Sensor invalida detalhes/saúde/listas/talhões/propriedades/leituras/dashboard; leituras invalidam detalhes/listas/latest/saúde/dashboard. | Transferências contemplam origem/destino; nomes embarcados são atualizados. |
| useActivityCache; useSaveAgronomicProfile | Atividade invalida diário/talhão/dashboard; perfil atualiza/invalida latest. Histórico de análises conserva snapshot e não deve ser recalculado após editar perfil. | Dashboard atual não expõe perfil; não há necessidade demonstrada de invalidar seus snapshots históricos. |
| useRiskJobCache; useRiskJob; useGuidance | Criação, término e alerta invalidam análises/alertas/dashboard/talhão; guidance só publica orientação confirmada, preservando resultado determinístico. | Callbacks de mutations protegem a sessão; sem retry automático. |
| useRiskJob | Janela de polling de 60 s; GET signal; enabled exige foco/app ativo; timeout e cleanup cancelam queries. Refetch manual consulta o mesmo ID. | Política pura coberta pela suíte; cancelamento efetivo de native AppState/blur inspecionado. |
| AuthContext.tsx; tokenStorage.ts | Restauração lê token seguro e valida auth/me; falha de rede preserva JWT e bloqueia telas; 401/403 removem sessão. Logout cancela queries, limpa QueryClient e serializa remoção do token. | Inspeção. Nenhuma chamada de logout foi executada no aparelho; API não tem revogação/refresh de token neste fluxo. |
| AuthContext.tsx; useAuthMutation | Geração de sessão evita publicar respostas antigas; controller de autenticação aborta; credenciais da mutation descartadas por gcTime=0. | Armazenamento no sistema operacional exige validação nativa manual. |
| HomeScreen.tsx; DashboardFeed | Atualizar e pull-to-refresh chamam o mesmo refetch; foco impede atualização fora da tela; dados prévios continuam visíveis em falha. Atalhos validam IDs e usam stacks tipadas. | GET real, testes de normalização/IDs e inspeção; gesto e destino no celular pendentes. |
| RootNavigator.tsx; navigation/* | Telas protegidas por sessão e papel; pilhas/abas tipadas. Cadastro/detalhes/listas/atalhos coerentes com parâmetros declarados. | Implementação existente usa React Navigation, sem src/app ou expo-router; desvio de AGENTS.md registrado, sem migração nem dependências. |
| AlertDetailsScreen; telas Details | Exclusões/arquivamento/reativação e resolução declaram Alert.alert com confirmação. Reconhecer alerta é ação direta, sem diálogo. | Confirmações inspecionadas; comportamento visual não aprovado por HTTP. |
| errors.ts; erros específicos | Mensagens legíveis para validação, 404, 409 e rede; rejeita diagnósticos/stack/SQL/token; não despeja respostas de login. | Testes locais de parser e transporte real. |

Dashboard final confirmado: 1 propriedade, 5 talhões (inclui arquivado), 13 leituras, 4 atividades recentes, resumos dos quatro talhões ativos, 2 alertas ativos (#10/#11), actionableJobs=[] e sensorIssues=[]. O alerta #12 resolvido continua na lista geral. Uma resposta parcial real e jobs FAILED não foram forçados; os testes existentes cobrem a normalização de campos ausentes.

## Segurança e isolamento

O usuário da auditoria é #5. IDs alheios conhecidos (propriedade #7, talhão #6, sensor #5, leitura #4, atividade #4 no talhão #6 e job/alerta #3) pertencem ao usuário #4, conforme SELECTs limitados a IDs/owner. Todos retornaram 404 para esta conta, inclusive sublistas, perfil e saúde. Cadastros que referenciavam propriedade/talhão/sensor alheios foram rejeitados com 404. Não foi necessário autenticar outra conta nem alterar recursos alheios. A chamada técnica foi feita com ID inexistente e recebeu 403 antes de acessar recurso.

Falhas de rede e timeout foram exercitadas com Axios real e o parser do mobile: timeout de 1 ms no health da API produziu ECONNABORTED/ETIMEDOUT; conexão a localhost:9 produziu ECONNREFUSED. Ambas viraram mensagem amigável, sem diagnóstico interno. Esses testes não comprovam comportamento da pilha de rede nativa de Android/iOS nem o decurso real de 180 s do guidance.

## Recursos DESCARTÁVEL excluídos

| Tipo | IDs excluídos | Confirmação |
| --- | --- | --- |
| activities | 12, 13 | DELETE 204 seguido de GET 404 para cada ID |
| readings | 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37 | DELETE 204 seguido de GET 404 para cada ID |
| sensors | 19, 20, 21, 22, 23, 24, 25 | DELETE 204 seguido de GET 404 para cada ID |
| crops | 13, 14 | DELETE 204 seguido de GET 404 para cada ID |
| farms | 10 | DELETE 204 seguido de GET 404 para cada ID |

Total: 1 propriedade, 2 talhões, 7 sensores, 14 leituras e 2 atividades. Nenhum desses recursos permaneceu. As leituras descartáveis foram identificadas pelos sensores “DESCARTÁVEL”; a API não possui campo nome/descrição na leitura. Os permanentes #9 (propriedade), #8–12 (talhões), #10–18 (sensores), #11–23 (leituras) e #8–11 (atividades) foram reconfirmados por GET/listagem após toda a limpeza.

## Correção realizada e verificações locais

Defeito reproduzido: `parseActivityQuantity("100000000000")` retornava número válido e permitia o envio, enquanto POST real do diário rejeitou quantity=100000000000 com 400. O valor de fronteira 99999999999.999 foi aceito com 201 numa atividade DESCARTÁVEL e depois excluído com 204/404. A validação Java usa `@Digits(integer=11,fraction=3)`.

Correção mínima: limitar a 11 dígitos inteiros em activityValidation.ts e explicitar o limite na mensagem. O novo teste verifica fronteira válida, vírgula/ponto, zeros à esquerda, 12/13 dígitos inválidos e bloqueio de toActivityRequest. Não houve mudança de tipos do diário nem tentativa de criar suporte fictício a inspeção/manutenção.

| Comando / verificação | Resultado |
| --- | --- |
| node --experimental-strip-types --test --test-reporter=spec tests/*.test.mjs (Node 22) | 105 passaram, 0 falharam, 0 ignorados; 104 existentes + 1 regressão. |
| node --experimental-strip-types --test --test-reporter=spec /tmp/citizentech-audit12/transport.test.mjs | 2 passaram, 0 falharam; teste temporário, sem dependências novas. |
| npx --no-install tsc --noEmit | Exit 0 antes e depois da correção. |
| CI=1 npx --no-install expo install --check | Exit 0; Dependencies are up to date; SDK 58.0.25. |
| Lint | Não executado: nenhuma configuração ESLint/dependência/script funcional existente; sem tentativa de instalar. |
| git diff --check | Exit 0. |
| Manifesto/lock e alterações anteriores | Hashes comparados com baseline; apenas os três arquivos da entrega foram criados/alterados por esta execução. |

Aviso não impeditivo do Node: MODULE_TYPELESS_PACKAGE_JSON ao importar utilitários TS na suíte. package.json não foi alterado para suprimir o aviso. O roteiro inicialmente supôs 204 no PATCH de alerta e que latest seria a leitura do solo; os critérios foram corrigidos ao conferir o contrato real (200 com job e latest de qualquer tipo). Essas expectativas do roteiro não foram apresentadas como defeitos do aplicativo, e as mutations de alerta não foram repetidas.

## Pendências reais e conferência manual

- **não executado: Preservar atividade INSPECTION** — Enum real contém apenas IRRIGATION, FERTILIZATION, PLANTING e HARVEST; não criar tipo falso.
- **não executado: Preservar atividade MAINTENANCE** — Enum real contém apenas IRRIGATION, FERTILIZATION, PLANTING e HARVEST; não criar tipo falso.
- **não executado: Estado RiskJob QUEUED** — Estado não observado nas quatro análises; sem induzir falha ou criar jobs extras.
- **não executado: Estado RiskJob PROCESSING** — Estado não observado nas quatro análises; sem induzir falha ou criar jobs extras.
- **não executado: Estado RiskJob COMPLETED** — Estado não observado nas quatro análises; sem induzir falha ou criar jobs extras.
- **não executado: Estado RiskJob FAILED** — Estado não observado nas quatro análises; sem induzir falha ou criar jobs extras.
- **não executado: Reutilização de guidance válida persistida** — Única tentativa retornou fallback; não repetir Gemini para forçar sucesso.
- **falho: Fallback preservado pela API para consulta futura** — GET posterior retornou guidance=null: fallback não persiste no backend. Conteúdo preservado no relatório; pendência de consulta no app, sem novo POST.
- **não executado: Exclusão protegida de leitura ANALYZED** — Nenhuma leitura descartável ANALYZED disponível; permanentes não recebem DELETE. Inspeção confirma guarda 409.
- **não executado: Timeout real do guidance** — Tentativa única retornou fallback rapidamente. Timeout dedicado e retry=false inspecionados/testados em funções puras.
- **não executado: Dashboard com jobs FAILED reais** — Nenhum FAILED observado; não alterar infraestrutura ou criar análises extras para forçar falha.
- **não executado: Dashboard parcial real** — API retornou todas as seções; normalização de payload parcial coberta por testes locais.
- **não executado: Calibração e nota de manutenção preenchidas** — Contrato do mobile somente consulta esses metadados; todos retornaram null, sem endpoint implementado de escrita.

Outras pendências por inspeção: migração para Expo Router exigiria mudança arquitetural/dependências e não foi realizada nesta auditoria; falta configuração funcional de lint; reconhecimento de alerta usa ação direta (somente resolução pede confirmação). Não houve defeito comprovado que justificasse alterar esses fluxos dentro do escopo mínimo autorizado.

Conferência manual necessária: Android/iOS, entrada/saída/restauração real via SecureStore, troca de conta e ausência de dados da sessão anterior, teclado e formulários, voltar nas pilhas/atalhos, fonte ampliada, leitor de tela, tema claro/escuro, botões e diálogos, pull-to-refresh e interrupção efetiva do polling ao sair/background. Sem evidência visual coletada e sem aprovação visual implícita.

## Roteiro curto para conferir no celular

1. Abra o projeto normalmente em ambiente compatível e entre na conta de teste indicada no pedido. Atualize a tela Início; confira 1 propriedade, 5 talhões e os resumos de risco.
2. Em Propriedades, abra **Cenários de Validação GS** (#9) e “Ver talhões”. Confirme os cinco nomes GS; #12 deve aparecer Arquivado.
3. No Normal (#8), consulte perfil atual revisão 2 (#6), diário com irrigação/plantio, sensores #10–13, solo #12=34,5%, temperatura #13=26,8 °C e ar #14=63%. A revisão 1 está preservada no banco, mas não há tela de histórico de perfil.
4. Abra o histórico de análises dos talhões: Normal job #9=65%; Atenção job #10=30%; Crítico job #11=15%; Insuficiente job #12 sem indicadores. Use “Consultar atualização” para o mesmo ID, evitando solicitar novas análises.
5. Em Alertas, confira #10 Reconhecido, #11 Aberto e #12 Resolvido. O dashboard só destaca #10/#11. Não reconheça/resolva outro alerta se quiser manter os estados demonstrativos.
6. O guidance de #11 retornou contingência e não foi salvo pela API. Consulte o conteúdo no relatório; abrir o job em uma nova sessão exibirá guidance ausente. Nenhuma nova chamada ao Gemini é necessária para conferir os dados já preservados.
7. Confira diário da Atenção com fertilização/colheita e consulte os sensores. As datas são relativas à execução; a saúde pode mudar naturalmente após 24/48 h, enquanto os snapshots dos jobs permanecem históricos.

## Lista exata de arquivos desta entrega

- `src/utils/activityValidation.ts` — limite de quantidade e mensagem.
- `tests/activity-utils.test.mjs` — regressão da quantidade.
- `docs/auditoria-etapa-12.md` — este relatório e evidências sanitizadas.

Alterações que já existiam antes desta execução, preservadas sem edição por esta auditoria:

- `M .env.example`
- `M README.md`
- `M src/components/cropAreas/CropAreaStatusBadge.tsx`
- `M src/hooks/activities/useActivityCache.ts`
- `M src/hooks/cropAreas/useCropAreaCache.ts`
- `M src/hooks/farms/useCreateFarm.ts`
- `M src/hooks/farms/useDeleteFarm.ts`
- `M src/hooks/farms/useUpdateFarm.ts`
- `M src/hooks/readings/useReadingCache.ts`
- `M src/hooks/sensors/useSensorCache.ts`
- `M src/screens/readings/ReadingFormScreen.tsx`
- `M src/screens/settings/AboutScreen.tsx`
- `M src/services/api.ts`
- `M src/utils/activityFormatting.ts`
- `M src/utils/cropAreaFormatting.ts`
- `M src/utils/numberFormatting.ts`
- `M src/utils/readingFormatting.ts`
- `M src/utils/readingValidation.ts`
- `M src/utils/sensorFormatting.ts`
- `M tests/agronomic-profile-utils.test.mjs`
- `M tests/auth-utils.test.mjs`
- `M tests/reading-utils.test.mjs`
- `?? docs/`
- `?? tests/audit-regressions.test.mjs`

A entrada `?? docs/` anterior correspondia ao relatório da etapa 11, que foi preservado. O relatório da etapa 12 foi acrescentado. Scripts e resultados temporários fora do repositório não contêm credenciais/JWT. Nenhum arquivo da API Java foi editado.

## Matriz detalhada dos cenários reais

Cada asserção usa dados de respostas reais; “estado HTTP persistido” indica comparação de valores obtidos por GET/POST/PUT, e a comprovação das duas revisões usa SELECT somente leitura. HTTP “—” indica ausência de nova chamada nessa linha. As expectativas sem payload completo são identificadas pelo nome concreto do cenário.

| # | Cenário / esperado funcional | Método e endpoint | HTTP esperado | HTTP observado | Resultado | Evidência adicional |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | Login válido | POST /api/auth/login | 200 | 200 | aprovado | Critério do cenário confirmado. |
| 2 | Senha incorreta | POST /api/auth/login | 401 | 401 | aprovado | Credenciais inválidas |
| 3 | Sem autenticação | GET /api/dashboard | 401 | 401 | aprovado | Token ausente ou inválido |
| 4 | Identidade autenticada e papel | GET /api/auth/me | 200 | 200 | aprovado | Critério do cenário confirmado. |
| 5 | Inventário inicial farms | GET /api/farms?page=0&size=100 | 200 | 200 | aprovado | Critério do cenário confirmado. |
| 6 | Inventário inicial crops | GET /api/crop-areas?page=0&size=100 | 200 | 200 | aprovado | Critério do cenário confirmado. |
| 7 | Inventário inicial sensors | GET /api/sensors?page=0&size=100 | 200 | 200 | aprovado | Critério do cenário confirmado. |
| 8 | Inventário inicial readings | GET /api/sensor-readings?page=0&size=100 | 200 | 200 | aprovado | Critério do cenário confirmado. |
| 9 | Inventário inicial alerts | GET /api/alerts?page=0&size=100 | 200 | 200 | aprovado | Critério do cenário confirmado. |
| 10 | Conta limpa inicialmente | assert estado HTTP persistido | asserção / não executado | — | aprovado | Critério do cenário confirmado. |
| 11 | Cadastrar propriedade permanente | POST /api/farms | 201 | 201 | aprovado | Critério do cenário confirmado. |
| 12 | Editar propriedade permanente | PUT /api/farms/9 | 200 | 200 | aprovado | Critério do cenário confirmado. |
| 13 | Detalhe propriedade | GET /api/farms/9 | 200 | 200 | aprovado | Critério do cenário confirmado. |
| 14 | Validação propriedade | POST /api/farms | 400 | 400 | aprovado | Dados inválidos |
| 15 | Cadastrar talhão normal | POST /api/crop-areas | 201 | 201 | aprovado | Critério do cenário confirmado. |
| 16 | Detalhe talhão normal | GET /api/crop-areas/8 | 200 | 200 | aprovado | Critério do cenário confirmado. |
| 17 | Cadastrar talhão attention | POST /api/crop-areas | 201 | 201 | aprovado | Critério do cenário confirmado. |
| 18 | Detalhe talhão attention | GET /api/crop-areas/9 | 200 | 200 | aprovado | Critério do cenário confirmado. |
| 19 | Cadastrar talhão critical | POST /api/crop-areas | 201 | 201 | aprovado | Critério do cenário confirmado. |
| 20 | Detalhe talhão critical | GET /api/crop-areas/10 | 200 | 200 | aprovado | Critério do cenário confirmado. |
| 21 | Cadastrar talhão insufficient | POST /api/crop-areas | 201 | 201 | aprovado | Critério do cenário confirmado. |
| 22 | Detalhe talhão insufficient | GET /api/crop-areas/11 | 200 | 200 | aprovado | Critério do cenário confirmado. |
| 23 | Cadastrar talhão archived | POST /api/crop-areas | 201 | 201 | aprovado | Critério do cenário confirmado. |
| 24 | Detalhe talhão archived | GET /api/crop-areas/12 | 200 | 200 | aprovado | Critério do cenário confirmado. |
| 25 | Editar talhão Normal | PUT /api/crop-areas/8 | 200 | 200 | aprovado | Critério do cenário confirmado. |
| 26 | Capacidade total excedida | POST /api/crop-areas | 409 | 409 | aprovado | A soma das áreas de cultivo ultrapassa a área total da propriedade |
| 27 | Diminuir propriedade abaixo da área ocupada | PUT /api/farms/9 | 409 | 409 | aprovado | A soma das áreas de cultivo ultrapassa a área total da propriedade |
| 28 | Coordenadas incompletas | POST /api/crop-areas | 400 | 400 | aprovado | Dados inválidos |
| 29 | Precisão de área inválida | POST /api/crop-areas | 400 | 400 | aprovado | Dados inválidos |
| 30 | Perfil ausente normal | GET /api/crop-areas/8/agronomic-profile | 404 | 404 | aprovado | Perfil ou cultivo não encontrado |
| 31 | Criar perfil normal | PUT /api/crop-areas/8/agronomic-profile | 200 | 200 | aprovado | Critério do cenário confirmado. |
| 32 | Segunda revisão Normal | PUT /api/crop-areas/8/agronomic-profile | 200 | 200 | aprovado | Critério do cenário confirmado. |
| 33 | Consultar revisão mais recente normal | GET /api/crop-areas/8/agronomic-profile | 200 | 200 | aprovado | Critério do cenário confirmado. |
| 34 | Perfil ausente attention | GET /api/crop-areas/9/agronomic-profile | 404 | 404 | aprovado | Perfil ou cultivo não encontrado |
| 35 | Criar perfil attention | PUT /api/crop-areas/9/agronomic-profile | 200 | 200 | aprovado | Critério do cenário confirmado. |
| 36 | Consultar revisão mais recente attention | GET /api/crop-areas/9/agronomic-profile | 200 | 200 | aprovado | Critério do cenário confirmado. |
| 37 | Perfil ausente critical | GET /api/crop-areas/10/agronomic-profile | 404 | 404 | aprovado | Perfil ou cultivo não encontrado |
| 38 | Criar perfil critical | PUT /api/crop-areas/10/agronomic-profile | 200 | 200 | aprovado | Critério do cenário confirmado. |
| 39 | Consultar revisão mais recente critical | GET /api/crop-areas/10/agronomic-profile | 200 | 200 | aprovado | Critério do cenário confirmado. |
| 40 | Perfil CC menor que PMP | PUT /api/crop-areas/8/agronomic-profile | 400 | 400 | aprovado | Dados inválidos |
| 41 | Perfil percentual fora do limite | PUT /api/crop-areas/8/agronomic-profile | 400 | 400 | aprovado | Dados inválidos |
| 42 | Perfil profundidade negativa | PUT /api/crop-areas/8/agronomic-profile | 400 | 400 | aprovado | Dados inválidos |
| 43 | Insuficiente permanece sem perfil | GET /api/crop-areas/11/agronomic-profile | 404 | 404 | aprovado | Perfil ou cultivo não encontrado |
| 44 | Cadastrar sensor normal_soil | POST /api/sensors | 201 | 201 | aprovado | Critério do cenário confirmado. |
| 45 | Detalhe sensor normal_soil | GET /api/sensors/10 | 200 | 200 | aprovado | Critério do cenário confirmado. |
| 46 | Saúde sem leituras normal_soil | GET /api/sensors/10/health | 200 | 200 | aprovado | Critério do cenário confirmado. |
| 47 | Cadastrar sensor normal_temp | POST /api/sensors | 201 | 201 | aprovado | Critério do cenário confirmado. |
| 48 | Detalhe sensor normal_temp | GET /api/sensors/11 | 200 | 200 | aprovado | Critério do cenário confirmado. |
| 49 | Saúde sem leituras normal_temp | GET /api/sensors/11/health | 200 | 200 | aprovado | Critério do cenário confirmado. |
| 50 | Cadastrar sensor normal_air | POST /api/sensors | 201 | 201 | aprovado | Critério do cenário confirmado. |
| 51 | Detalhe sensor normal_air | GET /api/sensors/12 | 200 | 200 | aprovado | Critério do cenário confirmado. |
| 52 | Saúde sem leituras normal_air | GET /api/sensors/12/health | 200 | 200 | aprovado | Critério do cenário confirmado. |
| 53 | Cadastrar sensor normal_weather | POST /api/sensors | 201 | 201 | aprovado | Critério do cenário confirmado. |
| 54 | Detalhe sensor normal_weather | GET /api/sensors/13 | 200 | 200 | aprovado | Critério do cenário confirmado. |
| 55 | Saúde sem leituras normal_weather | GET /api/sensors/13/health | 200 | 200 | aprovado | Critério do cenário confirmado. |
| 56 | Cadastrar sensor attention_soil | POST /api/sensors | 201 | 201 | aprovado | Critério do cenário confirmado. |
| 57 | Detalhe sensor attention_soil | GET /api/sensors/14 | 200 | 200 | aprovado | Critério do cenário confirmado. |
| 58 | Saúde sem leituras attention_soil | GET /api/sensors/14/health | 200 | 200 | aprovado | Critério do cenário confirmado. |
| 59 | Cadastrar sensor attention_weather | POST /api/sensors | 201 | 201 | aprovado | Critério do cenário confirmado. |
| 60 | Detalhe sensor attention_weather | GET /api/sensors/15 | 200 | 200 | aprovado | Critério do cenário confirmado. |
| 61 | Saúde sem leituras attention_weather | GET /api/sensors/15/health | 200 | 200 | aprovado | Critério do cenário confirmado. |
| 62 | Cadastrar sensor critical_soil | POST /api/sensors | 201 | 201 | aprovado | Critério do cenário confirmado. |
| 63 | Detalhe sensor critical_soil | GET /api/sensors/16 | 200 | 200 | aprovado | Critério do cenário confirmado. |
| 64 | Saúde sem leituras critical_soil | GET /api/sensors/16/health | 200 | 200 | aprovado | Critério do cenário confirmado. |
| 65 | Cadastrar sensor critical_weather | POST /api/sensors | 201 | 201 | aprovado | Critério do cenário confirmado. |
| 66 | Detalhe sensor critical_weather | GET /api/sensors/17 | 200 | 200 | aprovado | Critério do cenário confirmado. |
| 67 | Saúde sem leituras critical_weather | GET /api/sensors/17/health | 200 | 200 | aprovado | Critério do cenário confirmado. |
| 68 | Cadastrar sensor archived_soil | POST /api/sensors | 201 | 201 | aprovado | Critério do cenário confirmado. |
| 69 | Detalhe sensor archived_soil | GET /api/sensors/18 | 200 | 200 | aprovado | Critério do cenário confirmado. |
| 70 | Saúde sem leituras archived_soil | GET /api/sensors/18/health | 200 | 200 | aprovado | Critério do cenário confirmado. |
| 71 | Código duplicado | POST /api/sensors | 409 | 409 | aprovado | Código de dispositivo já cadastrado |
| 72 | Instalação futura | POST /api/sensors | 400 | 400 | aprovado | Dados inválidos |
| 73 | Criar atividade irrigation | POST /api/crop-areas/8/activities | 201 | 201 | aprovado | Critério do cenário confirmado. |
| 74 | Detalhe atividade irrigation | GET /api/crop-areas/8/activities/8 | 200 | 200 | aprovado | Critério do cenário confirmado. |
| 75 | Criar atividade planting | POST /api/crop-areas/8/activities | 201 | 201 | aprovado | Critério do cenário confirmado. |
| 76 | Detalhe atividade planting | GET /api/crop-areas/8/activities/9 | 200 | 200 | aprovado | Critério do cenário confirmado. |
| 77 | Criar atividade fertilization | POST /api/crop-areas/9/activities | 201 | 201 | aprovado | Critério do cenário confirmado. |
| 78 | Detalhe atividade fertilization | GET /api/crop-areas/9/activities/10 | 200 | 200 | aprovado | Critério do cenário confirmado. |
| 79 | Criar atividade harvest | POST /api/crop-areas/9/activities | 201 | 201 | aprovado | Critério do cenário confirmado. |
| 80 | Detalhe atividade harvest | GET /api/crop-areas/9/activities/11 | 200 | 200 | aprovado | Critério do cenário confirmado. |
| 81 | Editar irrigação | PUT /api/crop-areas/8/activities/8 | 200 | 200 | aprovado | Critério do cenário confirmado. |
| 82 | Contrato não suporta atividade INSPECTION | POST /api/crop-areas/9/activities | 400 | 400 | aprovado | JSON inválido ou campos não permitidos |
| 83 | Preservar atividade INSPECTION | — /api/crop-areas/9/activities | asserção / não executado | — | não executado | Enum real contém apenas IRRIGATION, FERTILIZATION, PLANTING e HARVEST; não criar tipo falso. |
| 84 | Contrato não suporta atividade MAINTENANCE | POST /api/crop-areas/9/activities | 400 | 400 | aprovado | JSON inválido ou campos não permitidos |
| 85 | Preservar atividade MAINTENANCE | — /api/crop-areas/9/activities | asserção / não executado | — | não executado | Enum real contém apenas IRRIGATION, FERTILIZATION, PLANTING e HARVEST; não criar tipo falso. |
| 86 | Atividade futura | POST /api/crop-areas/8/activities | 400 | 400 | aprovado | Dados inválidos |
| 87 | Quantidade sem unidade | POST /api/crop-areas/8/activities | 400 | 400 | aprovado | Dados inválidos |
| 88 | Diário período invertido | GET /api/crop-areas/8/activities?from=2026-11-15T00:17:50.481628Z&to=2026-11-14T22:17:50.481668Z | 400 | 400 | aprovado | Período inválido |
| 89 | Página zero propriedades | GET /api/farms?page=0&size=1 | 200 | 200 | aprovado | Critério do cenário confirmado. |
| 90 | Página um propriedades | GET /api/farms?page=1&size=1 | 200 | 200 | aprovado | Critério do cenário confirmado. |
| 91 | Paginação sem repetição propriedades | assert estado HTTP persistido | asserção / não executado | — | aprovado | Critério do cenário confirmado. |
| 92 | Página zero talhões | GET /api/crop-areas?page=0&size=1 | 200 | 200 | aprovado | Critério do cenário confirmado. |
| 93 | Página um talhões | GET /api/crop-areas?page=1&size=1 | 200 | 200 | aprovado | Critério do cenário confirmado. |
| 94 | Paginação sem repetição talhões | assert estado HTTP persistido | asserção / não executado | — | aprovado | Critério do cenário confirmado. |
| 95 | Página zero talhões por propriedade | GET /api/farms/9/crop-areas?page=0&size=1 | 200 | 200 | aprovado | Critério do cenário confirmado. |
| 96 | Página um talhões por propriedade | GET /api/farms/9/crop-areas?page=1&size=1 | 200 | 200 | aprovado | Critério do cenário confirmado. |
| 97 | Paginação sem repetição talhões por propriedade | assert estado HTTP persistido | asserção / não executado | — | aprovado | Critério do cenário confirmado. |
| 98 | Página zero sensores | GET /api/sensors?page=0&size=1 | 200 | 200 | aprovado | Critério do cenário confirmado. |
| 99 | Página um sensores | GET /api/sensors?page=1&size=1 | 200 | 200 | aprovado | Critério do cenário confirmado. |
| 100 | Paginação sem repetição sensores | assert estado HTTP persistido | asserção / não executado | — | aprovado | Critério do cenário confirmado. |
| 101 | Página zero sensores por talhão | GET /api/crop-areas/8/sensors?page=0&size=1 | 200 | 200 | aprovado | Critério do cenário confirmado. |
| 102 | Página um sensores por talhão | GET /api/crop-areas/8/sensors?page=1&size=1 | 200 | 200 | aprovado | Critério do cenário confirmado. |
| 103 | Paginação sem repetição sensores por talhão | assert estado HTTP persistido | asserção / não executado | — | aprovado | Critério do cenário confirmado. |
| 104 | Página zero diário | GET /api/crop-areas/8/activities?page=0&size=1 | 200 | 200 | aprovado | Critério do cenário confirmado. |
| 105 | Página um diário | GET /api/crop-areas/8/activities?page=1&size=1 | 200 | 200 | aprovado | Critério do cenário confirmado. |
| 106 | Paginação sem repetição diário | assert estado HTTP persistido | asserção / não executado | — | aprovado | Critério do cenário confirmado. |
| 107 | Filtro diário tipo e período | GET /api/crop-areas/8/activities?type=IRRIGATION&from=2026-11-14T01:17:50.838155Z&to=2026-11-15T01:17:50.838203Z&page=0&size=1 | 200 | 200 | aprovado | Critério do cenário confirmado. |
| 108 | Criar leitura normal_previous | POST /api/sensor-readings | 201 | 201 | aprovado | Critério do cenário confirmado. |
| 109 | Criar leitura normal_current | POST /api/sensor-readings | 201 | 201 | aprovado | Critério do cenário confirmado. |
| 110 | Criar leitura normal_temperature | POST /api/sensor-readings | 201 | 201 | aprovado | Critério do cenário confirmado. |
| 111 | Criar leitura normal_air | POST /api/sensor-readings | 201 | 201 | aprovado | Critério do cenário confirmado. |
| 112 | Criar leitura normal_rain_7d | POST /api/sensor-readings | 201 | 201 | aprovado | Critério do cenário confirmado. |
| 113 | Criar leitura normal_rain_24h | POST /api/sensor-readings | 201 | 201 | aprovado | Critério do cenário confirmado. |
| 114 | Criar leitura attention_previous | POST /api/sensor-readings | 201 | 201 | aprovado | Critério do cenário confirmado. |
| 115 | Criar leitura attention_current | POST /api/sensor-readings | 201 | 201 | aprovado | Critério do cenário confirmado. |
| 116 | Criar leitura attention_weather | POST /api/sensor-readings | 201 | 201 | aprovado | Critério do cenário confirmado. |
| 117 | Criar leitura critical_previous | POST /api/sensor-readings | 201 | 201 | aprovado | Critério do cenário confirmado. |
| 118 | Criar leitura critical_current | POST /api/sensor-readings | 201 | 201 | aprovado | Critério do cenário confirmado. |
| 119 | Criar leitura critical_weather | POST /api/sensor-readings | 201 | 201 | aprovado | Critério do cenário confirmado. |
| 120 | Criar leitura archived_historical | POST /api/sensor-readings | 201 | 201 | aprovado | Critério do cenário confirmado. |
| 121 | Compatibilidade rejeita normal_soil | POST /api/sensor-readings | 400 | 400 | aprovado | Informe a medição obrigatória para o tipo do sensor |
| 122 | Compatibilidade rejeita normal_temp | POST /api/sensor-readings | 400 | 400 | aprovado | Informe a medição obrigatória para o tipo do sensor |
| 123 | Compatibilidade rejeita normal_air | POST /api/sensor-readings | 400 | 400 | aprovado | Informe a medição obrigatória para o tipo do sensor |
| 124 | Limite leitura temperatureCelsius=-50.001 | POST /api/sensor-readings | 400 | 400 | aprovado | Dados inválidos |
| 125 | Limite leitura temperatureCelsius=70.001 | POST /api/sensor-readings | 400 | 400 | aprovado | Dados inválidos |
| 126 | Limite leitura airHumidityPercent=-0.001 | POST /api/sensor-readings | 400 | 400 | aprovado | Dados inválidos |
| 127 | Limite leitura airHumidityPercent=100.001 | POST /api/sensor-readings | 400 | 400 | aprovado | Dados inválidos |
| 128 | Limite leitura soilMoisturePercent=-0.001 | POST /api/sensor-readings | 400 | 400 | aprovado | Dados inválidos |
| 129 | Limite leitura soilMoisturePercent=100.001 | POST /api/sensor-readings | 400 | 400 | aprovado | Dados inválidos |
| 130 | Limite leitura batteryPercent=-0.001 | POST /api/sensor-readings | 400 | 400 | aprovado | Dados inválidos |
| 131 | Limite leitura batteryPercent=100.001 | POST /api/sensor-readings | 400 | 400 | aprovado | Dados inválidos |
| 132 | Limite leitura rainfallMillimeters=-0.001 | POST /api/sensor-readings | 400 | 400 | aprovado | Dados inválidos |
| 133 | Limite leitura rainfallMillimeters=1000000 | POST /api/sensor-readings | 400 | 400 | aprovado | Dados inválidos |
| 134 | Leitura futura acima de 5min | POST /api/sensor-readings | 400 | 400 | aprovado | Data da medição não pode exceder 5 minutos no futuro |
| 135 | Chuva sem intervalo | POST /api/sensor-readings | 400 | 400 | aprovado | Dados inválidos |
| 136 | Chuva intervalo invertido | POST /api/sensor-readings | 400 | 400 | aprovado | Dados inválidos |
| 137 | Leitura origem externa não permitida | POST /api/sensor-readings | 400 | 400 | aprovado | Dados inválidos |
| 138 | Leitura precisão maior que três casas | POST /api/sensor-readings | 400 | 400 | aprovado | Dados inválidos |
| 139 | Leituras página zero geral | GET /api/sensor-readings?page=0&size=1 | 200 | 200 | aprovado | Critério do cenário confirmado. |
| 140 | Leituras página um geral | GET /api/sensor-readings?page=1&size=1 | 200 | 200 | aprovado | Critério do cenário confirmado. |
| 141 | Leituras paginação e ordem geral | assert estado HTTP persistido | asserção / não executado | — | aprovado | Critério do cenário confirmado. |
| 142 | Leituras página zero sensor | GET /api/sensors/10/readings?page=0&size=1 | 200 | 200 | aprovado | Critério do cenário confirmado. |
| 143 | Leituras página um sensor | GET /api/sensors/10/readings?page=1&size=1 | 200 | 200 | aprovado | Critério do cenário confirmado. |
| 144 | Leituras paginação e ordem sensor | assert estado HTTP persistido | asserção / não executado | — | aprovado | Critério do cenário confirmado. |
| 145 | Leituras página zero talhão | GET /api/crop-areas/8/readings?page=0&size=1 | 200 | 200 | aprovado | Critério do cenário confirmado. |
| 146 | Leituras página um talhão | GET /api/crop-areas/8/readings?page=1&size=1 | 200 | 200 | aprovado | Critério do cenário confirmado. |
| 147 | Leituras paginação e ordem talhão | assert estado HTTP persistido | asserção / não executado | — | aprovado | Critério do cenário confirmado. |
| 148 | Sem última leitura Insuficiente | GET /api/crop-areas/11/readings/latest | 404 | 404 | aprovado | Leitura não encontrada |
| 149 | Saúde com leituras normal_soil | GET /api/sensors/10/health | 200 | 200 | aprovado | Critério do cenário confirmado. |
| 150 | Saúde com leituras normal_temp | GET /api/sensors/11/health | 200 | 200 | aprovado | Critério do cenário confirmado. |
| 151 | Saúde com leituras normal_air | GET /api/sensors/12/health | 200 | 200 | aprovado | Critério do cenário confirmado. |
| 152 | Saúde com leituras normal_weather | GET /api/sensors/13/health | 200 | 200 | aprovado | Critério do cenário confirmado. |
| 153 | Saúde com leituras attention_soil | GET /api/sensors/14/health | 200 | 200 | aprovado | Critério do cenário confirmado. |
| 154 | Saúde com leituras attention_weather | GET /api/sensors/15/health | 200 | 200 | aprovado | Critério do cenário confirmado. |
| 155 | Saúde com leituras critical_soil | GET /api/sensors/16/health | 200 | 200 | aprovado | Critério do cenário confirmado. |
| 156 | Saúde com leituras critical_weather | GET /api/sensors/17/health | 200 | 200 | aprovado | Critério do cenário confirmado. |
| 157 | Saúde com leituras archived_soil | GET /api/sensors/18/health | 200 | 200 | aprovado | Critério do cenário confirmado. |
| 158 | Última leitura Normal | GET /api/crop-areas/8/readings/latest | 200 | 200 | aprovado | Critério do cenário confirmado. |
| 159 | Cadastrar propriedade DESCARTÁVEL | POST /api/farms | 201 | 201 | aprovado | Critério do cenário confirmado. |
| 160 | Cadastrar talhão DESCARTÁVEL | POST /api/crop-areas | 201 | 201 | aprovado | Critério do cenário confirmado. |
| 161 | Transferir talhão DESCARTÁVEL para outra propriedade | PUT /api/crop-areas/13 | 200 | 200 | aprovado | Critério do cenário confirmado. |
| 162 | Conflito propriedade DESCARTÁVEL com talhão | DELETE /api/farms/10 | 409 | 409 | aprovado | Não é possível excluir propriedade com áreas de cultivo vinculadas |
| 163 | Criar sensor DESCARTÁVEL state | POST /api/sensors | 201 | 201 | aprovado | Critério do cenário confirmado. |
| 164 | Status administrativo INACTIVE | PUT /api/sensors/19 | 200 | 200 | aprovado | Critério do cenário confirmado. |
| 165 | Saúde independente INACTIVE | GET /api/sensors/19/health | 200 | 200 | aprovado | Critério do cenário confirmado. |
| 166 | Status administrativo FAULT | PUT /api/sensors/19 | 200 | 200 | aprovado | Critério do cenário confirmado. |
| 167 | Saúde independente FAULT | GET /api/sensors/19/health | 200 | 200 | aprovado | Critério do cenário confirmado. |
| 168 | Status administrativo MAINTENANCE | PUT /api/sensors/19 | 200 | 200 | aprovado | Critério do cenário confirmado. |
| 169 | Saúde independente MAINTENANCE | GET /api/sensors/19/health | 200 | 200 | aprovado | Critério do cenário confirmado. |
| 170 | Status administrativo ACTIVE | PUT /api/sensors/19 | 200 | 200 | aprovado | Critério do cenário confirmado. |
| 171 | Saúde independente ACTIVE | GET /api/sensors/19/health | 200 | 200 | aprovado | Critério do cenário confirmado. |
| 172 | Transferir sensor DESCARTÁVEL | PUT /api/sensors/19 | 200 | 200 | aprovado | Critério do cenário confirmado. |
| 173 | Restaurar destino sensor DESCARTÁVEL | PUT /api/sensors/19 | 200 | 200 | aprovado | Critério do cenário confirmado. |
| 174 | Conflito edição código duplicado | PUT /api/sensors/19 | 409 | 409 | aprovado | Código de dispositivo já cadastrado |
| 175 | Criar sensor DESCARTÁVEL stale | POST /api/sensors | 201 | 201 | aprovado | Critério do cenário confirmado. |
| 176 | Leitura DESCARTÁVEL stale | POST /api/sensor-readings | 201 | 201 | aprovado | Critério do cenário confirmado. |
| 177 | Saúde STALE | GET /api/sensors/20/health | 200 | 200 | aprovado | Critério do cenário confirmado. |
| 178 | Criar sensor DESCARTÁVEL offline | POST /api/sensors | 201 | 201 | aprovado | Critério do cenário confirmado. |
| 179 | Leitura DESCARTÁVEL offline | POST /api/sensor-readings | 201 | 201 | aprovado | Critério do cenário confirmado. |
| 180 | Saúde OFFLINE | GET /api/sensors/21/health | 200 | 200 | aprovado | Critério do cenário confirmado. |
| 181 | Criar sensor DESCARTÁVEL flat | POST /api/sensors | 201 | 201 | aprovado | Critério do cenário confirmado. |
| 182 | Leitura DESCARTÁVEL flat 2min | POST /api/sensor-readings | 201 | 201 | aprovado | Critério do cenário confirmado. |
| 183 | Leitura DESCARTÁVEL flat 14min | POST /api/sensor-readings | 201 | 201 | aprovado | Critério do cenário confirmado. |
| 184 | Leitura DESCARTÁVEL flat 26min | POST /api/sensor-readings | 201 | 201 | aprovado | Critério do cenário confirmado. |
| 185 | Leitura DESCARTÁVEL flat 38min | POST /api/sensor-readings | 201 | 201 | aprovado | Critério do cenário confirmado. |
| 186 | Leitura DESCARTÁVEL flat 50min | POST /api/sensor-readings | 201 | 201 | aprovado | Critério do cenário confirmado. |
| 187 | Leitura DESCARTÁVEL flat 62min | POST /api/sensor-readings | 201 | 201 | aprovado | Critério do cenário confirmado. |
| 188 | Saúde POSSIBLE_FAULT flat | GET /api/sensors/22/health | 200 | 200 | aprovado | Critério do cenário confirmado. |
| 189 | Criar sensor DESCARTÁVEL jump | POST /api/sensors | 201 | 201 | aprovado | Critério do cenário confirmado. |
| 190 | Leitura DESCARTÁVEL jump 4min | POST /api/sensor-readings | 201 | 201 | aprovado | Critério do cenário confirmado. |
| 191 | Leitura DESCARTÁVEL jump 2min | POST /api/sensor-readings | 201 | 201 | aprovado | Critério do cenário confirmado. |
| 192 | Saúde POSSIBLE_FAULT jump | GET /api/sensors/23/health | 200 | 200 | aprovado | Critério do cenário confirmado. |
| 193 | Criar sensor DESCARTÁVEL boundaries | POST /api/sensors | 201 | 201 | aprovado | Critério do cenário confirmado. |
| 194 | Leitura limites inclusivos DESCARTÁVEL min | POST /api/sensor-readings | 201 | 201 | aprovado | Critério do cenário confirmado. |
| 195 | Leitura limites inclusivos DESCARTÁVEL max | POST /api/sensor-readings | 201 | 201 | aprovado | Critério do cenário confirmado. |
| 196 | Imutabilidade leitura DESCARTÁVEL | PUT /api/sensor-readings/35 | 405 | 405 | aprovado | Method Not Allowed |
| 197 | Sem alteração após PUT | GET /api/sensor-readings/35 | 200 | 200 | aprovado | Critério do cenário confirmado. |
| 198 | Conflito sensor DESCARTÁVEL com leituras | DELETE /api/sensors/20 | 409 | 409 | aprovado | Não é possível excluir sensor com leituras vinculadas |
| 199 | Conflito talhão DESCARTÁVEL com sensores | DELETE /api/crop-areas/13 | 409 | 409 | aprovado | Não é possível excluir área de cultivo com sensores vinculados |
| 200 | Criar atividade DESCARTÁVEL | POST /api/crop-areas/13/activities | 201 | 201 | aprovado | Critério do cenário confirmado. |
| 201 | Arquivar talhão DESCARTÁVEL | PATCH /api/crop-areas/13/archive | 200 | 200 | aprovado | Critério do cenário confirmado. |
| 202 | Arquivado bloqueia diário cadastro | POST /api/crop-areas/13/activities | 409 | 409 | aprovado | Cultivo arquivado: reative antes de alterar atividades |
| 203 | Arquivado bloqueia diário edição | PUT /api/crop-areas/13/activities/12 | 409 | 409 | aprovado | Cultivo arquivado: reative antes de alterar atividades |
| 204 | Arquivado bloqueia diário exclusão | DELETE /api/crop-areas/13/activities/12 | 409 | 409 | aprovado | Cultivo arquivado: reative antes de alterar atividades |
| 205 | Arquivado permite consulta do diário | GET /api/crop-areas/13/activities | 200 | 200 | aprovado | Critério do cenário confirmado. |
| 206 | Reativar talhão DESCARTÁVEL | PATCH /api/crop-areas/13/archive | 200 | 200 | aprovado | Critério do cenário confirmado. |
| 207 | Excluir DESCARTÁVEL activities 12 | DELETE /api/crop-areas/13/activities/12 | 204 | 204 | aprovado | Critério do cenário confirmado. |
| 208 | Confirmar exclusão activities 12 | GET /api/crop-areas/13/activities/12 | 404 | 404 | aprovado | Registro não encontrado |
| 209 | API rejeita quantidade com 12 dígitos inteiros | POST /api/crop-areas/13/activities | 400 | 400 | aprovado | Dados inválidos |
| 210 | API aceita quantidade limite de 11 dígitos | POST /api/crop-areas/13/activities | 201 | 201 | aprovado | Critério do cenário confirmado. |
| 211 | Excluir DESCARTÁVEL activities 13 | DELETE /api/crop-areas/13/activities/13 | 204 | 204 | aprovado | Critério do cenário confirmado. |
| 212 | Confirmar exclusão activities 13 | GET /api/crop-areas/13/activities/13 | 404 | 404 | aprovado | Registro não encontrado |
| 213 | Excluir DESCARTÁVEL readings 24 | DELETE /api/sensor-readings/24 | 204 | 204 | aprovado | Critério do cenário confirmado. |
| 214 | Confirmar exclusão readings 24 | GET /api/sensor-readings/24 | 404 | 404 | aprovado | Leitura não encontrada |
| 215 | Excluir DESCARTÁVEL readings 25 | DELETE /api/sensor-readings/25 | 204 | 204 | aprovado | Critério do cenário confirmado. |
| 216 | Confirmar exclusão readings 25 | GET /api/sensor-readings/25 | 404 | 404 | aprovado | Leitura não encontrada |
| 217 | Excluir DESCARTÁVEL readings 26 | DELETE /api/sensor-readings/26 | 204 | 204 | aprovado | Critério do cenário confirmado. |
| 218 | Confirmar exclusão readings 26 | GET /api/sensor-readings/26 | 404 | 404 | aprovado | Leitura não encontrada |
| 219 | Excluir DESCARTÁVEL readings 27 | DELETE /api/sensor-readings/27 | 204 | 204 | aprovado | Critério do cenário confirmado. |
| 220 | Confirmar exclusão readings 27 | GET /api/sensor-readings/27 | 404 | 404 | aprovado | Leitura não encontrada |
| 221 | Excluir DESCARTÁVEL readings 28 | DELETE /api/sensor-readings/28 | 204 | 204 | aprovado | Critério do cenário confirmado. |
| 222 | Confirmar exclusão readings 28 | GET /api/sensor-readings/28 | 404 | 404 | aprovado | Leitura não encontrada |
| 223 | Excluir DESCARTÁVEL readings 29 | DELETE /api/sensor-readings/29 | 204 | 204 | aprovado | Critério do cenário confirmado. |
| 224 | Confirmar exclusão readings 29 | GET /api/sensor-readings/29 | 404 | 404 | aprovado | Leitura não encontrada |
| 225 | Excluir DESCARTÁVEL readings 30 | DELETE /api/sensor-readings/30 | 204 | 204 | aprovado | Critério do cenário confirmado. |
| 226 | Confirmar exclusão readings 30 | GET /api/sensor-readings/30 | 404 | 404 | aprovado | Leitura não encontrada |
| 227 | Excluir DESCARTÁVEL readings 31 | DELETE /api/sensor-readings/31 | 204 | 204 | aprovado | Critério do cenário confirmado. |
| 228 | Confirmar exclusão readings 31 | GET /api/sensor-readings/31 | 404 | 404 | aprovado | Leitura não encontrada |
| 229 | Excluir DESCARTÁVEL readings 32 | DELETE /api/sensor-readings/32 | 204 | 204 | aprovado | Critério do cenário confirmado. |
| 230 | Confirmar exclusão readings 32 | GET /api/sensor-readings/32 | 404 | 404 | aprovado | Leitura não encontrada |
| 231 | Excluir DESCARTÁVEL readings 33 | DELETE /api/sensor-readings/33 | 204 | 204 | aprovado | Critério do cenário confirmado. |
| 232 | Confirmar exclusão readings 33 | GET /api/sensor-readings/33 | 404 | 404 | aprovado | Leitura não encontrada |
| 233 | Excluir DESCARTÁVEL readings 34 | DELETE /api/sensor-readings/34 | 204 | 204 | aprovado | Critério do cenário confirmado. |
| 234 | Confirmar exclusão readings 34 | GET /api/sensor-readings/34 | 404 | 404 | aprovado | Leitura não encontrada |
| 235 | Excluir DESCARTÁVEL readings 35 | DELETE /api/sensor-readings/35 | 204 | 204 | aprovado | Critério do cenário confirmado. |
| 236 | Confirmar exclusão readings 35 | GET /api/sensor-readings/35 | 404 | 404 | aprovado | Leitura não encontrada |
| 237 | Excluir DESCARTÁVEL sensors 19 | DELETE /api/sensors/19 | 204 | 204 | aprovado | Critério do cenário confirmado. |
| 238 | Confirmar exclusão sensors 19 | GET /api/sensors/19 | 404 | 404 | aprovado | Sensor não encontrado |
| 239 | Excluir DESCARTÁVEL sensors 20 | DELETE /api/sensors/20 | 204 | 204 | aprovado | Critério do cenário confirmado. |
| 240 | Confirmar exclusão sensors 20 | GET /api/sensors/20 | 404 | 404 | aprovado | Sensor não encontrado |
| 241 | Excluir DESCARTÁVEL sensors 21 | DELETE /api/sensors/21 | 204 | 204 | aprovado | Critério do cenário confirmado. |
| 242 | Confirmar exclusão sensors 21 | GET /api/sensors/21 | 404 | 404 | aprovado | Sensor não encontrado |
| 243 | Excluir DESCARTÁVEL sensors 22 | DELETE /api/sensors/22 | 204 | 204 | aprovado | Critério do cenário confirmado. |
| 244 | Confirmar exclusão sensors 22 | GET /api/sensors/22 | 404 | 404 | aprovado | Sensor não encontrado |
| 245 | Excluir DESCARTÁVEL sensors 23 | DELETE /api/sensors/23 | 204 | 204 | aprovado | Critério do cenário confirmado. |
| 246 | Confirmar exclusão sensors 23 | GET /api/sensors/23 | 404 | 404 | aprovado | Sensor não encontrado |
| 247 | Excluir DESCARTÁVEL sensors 24 | DELETE /api/sensors/24 | 204 | 204 | aprovado | Critério do cenário confirmado. |
| 248 | Confirmar exclusão sensors 24 | GET /api/sensors/24 | 404 | 404 | aprovado | Sensor não encontrado |
| 249 | Excluir DESCARTÁVEL crops 13 | DELETE /api/crop-areas/13 | 204 | 204 | aprovado | Critério do cenário confirmado. |
| 250 | Confirmar exclusão crops 13 | GET /api/crop-areas/13 | 404 | 404 | aprovado | Área de cultivo não encontrada |
| 251 | Excluir DESCARTÁVEL farms 10 | DELETE /api/farms/10 | 204 | 204 | aprovado | Critério do cenário confirmado. |
| 252 | Confirmar exclusão farms 10 | GET /api/farms/10 | 404 | 404 | aprovado | Propriedade não encontrada |
| 253 | Criar perfil antes do arquivamento | PUT /api/crop-areas/12/agronomic-profile | 200 | 200 | aprovado | Critério do cenário confirmado. |
| 254 | Arquivar talhão permanente | PATCH /api/crop-areas/12/archive | 200 | 200 | aprovado | Critério do cenário confirmado. |
| 255 | Consultar perfil arquivado | GET /api/crop-areas/12/agronomic-profile | 200 | 200 | aprovado | Critério do cenário confirmado. |
| 256 | Contrato permite nova revisão em talhão arquivado | PUT /api/crop-areas/12/agronomic-profile | 200 | 200 | aprovado | Critério do cenário confirmado. |
| 257 | Arquivado rejeita análise principal | POST /api/crop-areas/12/risk-jobs | 409 | 409 | aprovado | Cultivo arquivado |
| 258 | Consultar talhão arquivado preservado | GET /api/crop-areas/12 | 200 | 200 | aprovado | Critério do cenário confirmado. |
| 259 | Consultar sensores em talhão arquivado | GET /api/crop-areas/12/sensors | 200 | 200 | aprovado | Critério do cenário confirmado. |
| 260 | Consultar leituras em talhão arquivado | GET /api/crop-areas/12/readings | 200 | 200 | aprovado | Critério do cenário confirmado. |
| 261 | Solicitar única análise normal | POST /api/crop-areas/8/risk-jobs | 202 | 202 | aprovado | Critério do cenário confirmado. |
| 262 | Polling normal mesmo ID #1 | GET /api/risk-jobs/9 | 200 | 200 | aprovado | Critério do cenário confirmado. |
| 263 | Polling normal mesmo ID #2 | GET /api/risk-jobs/9 | 200 | 200 | aprovado | Critério do cenário confirmado. |
| 264 | Polling normal mesmo ID #3 | GET /api/risk-jobs/9 | 200 | 200 | aprovado | Critério do cenário confirmado. |
| 265 | Polling normal mesmo ID #4 | GET /api/risk-jobs/9 | 200 | 200 | aprovado | Critério do cenário confirmado. |
| 266 | Resultado determinístico normal | assert estado HTTP persistido | asserção / não executado | — | aprovado | Esperado NORMAL; observado NORMAL |
| 267 | Snapshot perfil e limiares normal | assert estado HTTP persistido | asserção / não executado | — | aprovado | Critério do cenário confirmado. |
| 268 | Histórico paginado de análise normal | GET /api/crop-areas/8/risk-jobs?page=0&size=1 | 200 | 200 | aprovado | Critério do cenário confirmado. |
| 269 | Histórico segunda página vazia normal | GET /api/crop-areas/8/risk-jobs?page=1&size=1 | 200 | 200 | aprovado | Critério do cenário confirmado. |
| 270 | Disponibilidade calculada normal | assert estado HTTP persistido | asserção / não executado | — | aprovado | 100×(34.5−15)/(45−15) = 65.000000% |
| 271 | Qualidade tendência e VPD normal | assert estado HTTP persistido | asserção / não executado | — | aprovado | {'dataQuality': 'COMPLETE', 'moistureTrend': 'DRYING_SLOWLY', 'vpdKpa': 1.3037762493396732, 'moistureChangePerHour': -0.26086357873851607} |
| 272 | Snapshots de leituras coerentes normal | assert estado HTTP persistido | asserção / não executado | — | aprovado | Critério do cenário confirmado. |
| 273 | Solicitar única análise attention | POST /api/crop-areas/9/risk-jobs | 202 | 202 | aprovado | Critério do cenário confirmado. |
| 274 | Polling attention mesmo ID #1 | GET /api/risk-jobs/10 | 200 | 200 | aprovado | Critério do cenário confirmado. |
| 275 | Polling attention mesmo ID #2 | GET /api/risk-jobs/10 | 200 | 200 | aprovado | Critério do cenário confirmado. |
| 276 | Polling attention mesmo ID #3 | GET /api/risk-jobs/10 | 200 | 200 | aprovado | Critério do cenário confirmado. |
| 277 | Resultado determinístico attention | assert estado HTTP persistido | asserção / não executado | — | aprovado | Esperado ATTENTION; observado ATTENTION |
| 278 | Snapshot perfil e limiares attention | assert estado HTTP persistido | asserção / não executado | — | aprovado | Critério do cenário confirmado. |
| 279 | Histórico paginado de análise attention | GET /api/crop-areas/9/risk-jobs?page=0&size=1 | 200 | 200 | aprovado | Critério do cenário confirmado. |
| 280 | Histórico segunda página vazia attention | GET /api/crop-areas/9/risk-jobs?page=1&size=1 | 200 | 200 | aprovado | Critério do cenário confirmado. |
| 281 | Disponibilidade calculada attention | assert estado HTTP persistido | asserção / não executado | — | aprovado | 100×(24−15)/(45−15) = 30.000000% |
| 282 | Qualidade tendência e VPD attention | assert estado HTTP persistido | asserção / não executado | — | aprovado | {'dataQuality': 'COMPLETE', 'moistureTrend': 'DRYING_SLOWLY', 'vpdKpa': 1.3037762493396732, 'moistureChangePerHour': -0.3130403925445951} |
| 283 | Snapshots de leituras coerentes attention | assert estado HTTP persistido | asserção / não executado | — | aprovado | Critério do cenário confirmado. |
| 284 | Solicitar única análise critical | POST /api/crop-areas/10/risk-jobs | 202 | 202 | aprovado | Critério do cenário confirmado. |
| 285 | Polling critical mesmo ID #1 | GET /api/risk-jobs/11 | 200 | 200 | aprovado | Critério do cenário confirmado. |
| 286 | Polling critical mesmo ID #2 | GET /api/risk-jobs/11 | 200 | 200 | aprovado | Critério do cenário confirmado. |
| 287 | Polling critical mesmo ID #3 | GET /api/risk-jobs/11 | 200 | 200 | aprovado | Critério do cenário confirmado. |
| 288 | Resultado determinístico critical | assert estado HTTP persistido | asserção / não executado | — | aprovado | Esperado CRITICAL; observado CRITICAL |
| 289 | Snapshot perfil e limiares critical | assert estado HTTP persistido | asserção / não executado | — | aprovado | Critério do cenário confirmado. |
| 290 | Histórico paginado de análise critical | GET /api/crop-areas/10/risk-jobs?page=0&size=1 | 200 | 200 | aprovado | Critério do cenário confirmado. |
| 291 | Histórico segunda página vazia critical | GET /api/crop-areas/10/risk-jobs?page=1&size=1 | 200 | 200 | aprovado | Critério do cenário confirmado. |
| 292 | Disponibilidade calculada critical | assert estado HTTP persistido | asserção / não executado | — | aprovado | 100×(19.5−15)/(45−15) = 15.000000% |
| 293 | Qualidade tendência e VPD critical | assert estado HTTP persistido | asserção / não executado | — | aprovado | {'dataQuality': 'COMPLETE', 'moistureTrend': 'DRYING_SLOWLY', 'vpdKpa': 1.3037762493396732, 'moistureChangePerHour': -0.052173610580204095} |
| 294 | Snapshots de leituras coerentes critical | assert estado HTTP persistido | asserção / não executado | — | aprovado | Critério do cenário confirmado. |
| 295 | Solicitar única análise insufficient | POST /api/crop-areas/11/risk-jobs | 202 | 202 | aprovado | Critério do cenário confirmado. |
| 296 | Polling insufficient mesmo ID #1 | GET /api/risk-jobs/12 | 200 | 200 | aprovado | Critério do cenário confirmado. |
| 297 | Polling insufficient mesmo ID #2 | GET /api/risk-jobs/12 | 200 | 200 | aprovado | Critério do cenário confirmado. |
| 298 | Polling insufficient mesmo ID #3 | GET /api/risk-jobs/12 | 200 | 200 | aprovado | Critério do cenário confirmado. |
| 299 | Resultado determinístico insufficient | assert estado HTTP persistido | asserção / não executado | — | aprovado | Esperado INSUFFICIENT_DATA; observado INSUFFICIENT_DATA |
| 300 | Snapshot perfil e limiares insufficient | assert estado HTTP persistido | asserção / não executado | — | aprovado | Critério do cenário confirmado. |
| 301 | Histórico paginado de análise insufficient | GET /api/crop-areas/11/risk-jobs?page=0&size=1 | 200 | 200 | aprovado | Critério do cenário confirmado. |
| 302 | Histórico segunda página vazia insufficient | GET /api/crop-areas/11/risk-jobs?page=1&size=1 | 200 | 200 | aprovado | Critério do cenário confirmado. |
| 303 | Limitações explícitas de dados insuficientes | assert estado HTTP persistido | asserção / não executado | — | aprovado | Critério do cenário confirmado. |
| 304 | Chuva acumulada 24h e 7dias | assert estado HTTP persistido | asserção / não executado | — | aprovado | {'last7Days': {'millimeters': 10.5, 'complete': False, 'limitation': 'Cobertura parcial da janela'}, 'last24Hours': {'millimeters': 2.5, 'complete': False, 'limitation': 'Cobertura parcial da janela'}} |
| 305 | Estado de RiskJob observado PENDING | assert estado HTTP persistido | asserção / não executado | — | aprovado | Critério do cenário confirmado. |
| 306 | Estado RiskJob QUEUED | — GET /api/risk-jobs/{id} | asserção / não executado | — | não executado | Estado não observado nas quatro análises; sem induzir falha ou criar jobs extras. |
| 307 | Estado RiskJob PROCESSING | — GET /api/risk-jobs/{id} | asserção / não executado | — | não executado | Estado não observado nas quatro análises; sem induzir falha ou criar jobs extras. |
| 308 | Estado de RiskJob observado COMPLETED_WITHOUT_AI | assert estado HTTP persistido | asserção / não executado | — | aprovado | Critério do cenário confirmado. |
| 309 | Estado RiskJob COMPLETED | — GET /api/risk-jobs/{id} | asserção / não executado | — | não executado | Estado não observado nas quatro análises; sem induzir falha ou criar jobs extras. |
| 310 | Estado RiskJob FAILED | — GET /api/risk-jobs/{id} | asserção / não executado | — | não executado | Estado não observado nas quatro análises; sem induzir falha ou criar jobs extras. |
| 311 | Detalhe alerta attention | GET /api/alerts/10 | 200 | 200 | aprovado | Critério do cenário confirmado. |
| 312 | Lista por talhão de alerta attention | GET /api/crop-areas/9/alerts?page=0&size=1 | 200 | 200 | aprovado | Critério do cenário confirmado. |
| 313 | Detalhe alerta critical | GET /api/alerts/11 | 200 | 200 | aprovado | Critério do cenário confirmado. |
| 314 | Lista por talhão de alerta critical | GET /api/crop-areas/10/alerts?page=0&size=1 | 200 | 200 | aprovado | Critério do cenário confirmado. |
| 315 | Detalhe alerta insufficient | GET /api/alerts/12 | 200 | 200 | aprovado | Critério do cenário confirmado. |
| 316 | Lista por talhão de alerta insufficient | GET /api/crop-areas/11/alerts?page=0&size=1 | 200 | 200 | aprovado | Critério do cenário confirmado. |
| 317 | Reconhecer alerta Atenção | PATCH /api/alerts/10/acknowledge | 200 | 200 | aprovado | HTTP 200 com RiskJob conforme controller; transição auditada por GET. |
| 318 | Auditar reconhecimento | GET /api/alerts/10 | 200 | 200 | aprovado | Critério do cenário confirmado. |
| 319 | Reconhecer antes de resolver Insuficiente | PATCH /api/alerts/12/acknowledge | 200 | 200 | aprovado | HTTP 200 com RiskJob conforme controller; transição auditada por GET. |
| 320 | Resolver alerta Insuficiente | PATCH /api/alerts/12/resolve | 200 | 200 | aprovado | HTTP 200 com RiskJob conforme controller; transição auditada por GET. |
| 321 | Auditar resolução | GET /api/alerts/12 | 200 | 200 | aprovado | Critério do cenário confirmado. |
| 322 | Alerta Crítico permanece OPEN | GET /api/alerts/11 | 200 | 200 | aprovado | Critério do cenário confirmado. |
| 323 | Normal não gera alerta | GET /api/alerts/9 | 404 | 404 | aprovado | Registro não encontrado |
| 324 | Lista geral preserva três estados | GET /api/alerts?page=0&size=100 | 200 | 200 | aprovado | Critério do cenário confirmado. |
| 325 | Única tentativa de guidance sem body | POST /api/risk-jobs/11/guidance | 200 | 200 | aprovado | Critério do cenário confirmado. |
| 326 | GET mesmo job após guidance | GET /api/risk-jobs/11 | 200 | 200 | aprovado | Critério do cenário confirmado. |
| 327 | Guidance preserva resultado determinístico | assert estado HTTP persistido | asserção / não executado | — | aprovado | Critério do cenário confirmado. |
| 328 | Fallback seguro e explícito | assert estado HTTP persistido | asserção / não executado | — | aprovado | Critério do cenário confirmado. |
| 329 | Reutilização de guidance válida persistida | — /api/risk-jobs/11/guidance | asserção / não executado | — | não executado | Única tentativa retornou fallback; não repetir Gemini para forçar sucesso. |
| 330 | ID alheio não expõe propriedade | GET /api/farms/7 | 404 | 404 | aprovado | Propriedade não encontrada |
| 331 | ID inexistente propriedade | GET /api/farms/999999999 | 404 | 404 | aprovado | Propriedade não encontrada |
| 332 | ID alheio não expõe talhão | GET /api/crop-areas/6 | 404 | 404 | aprovado | Área de cultivo não encontrada |
| 333 | ID inexistente talhão | GET /api/crop-areas/999999999 | 404 | 404 | aprovado | Área de cultivo não encontrada |
| 334 | ID alheio não expõe perfil | GET /api/crop-areas/6/agronomic-profile | 404 | 404 | aprovado | Perfil ou cultivo não encontrado |
| 335 | ID inexistente perfil | GET /api/crop-areas/999999999/agronomic-profile | 404 | 404 | aprovado | Perfil ou cultivo não encontrado |
| 336 | ID alheio não expõe sensor | GET /api/sensors/5 | 404 | 404 | aprovado | Sensor não encontrado |
| 337 | ID inexistente sensor | GET /api/sensors/999999999 | 404 | 404 | aprovado | Sensor não encontrado |
| 338 | ID alheio não expõe saúde | GET /api/sensors/5/health | 404 | 404 | aprovado | Sensor não encontrado |
| 339 | ID inexistente saúde | GET /api/sensors/999999999/health | 404 | 404 | aprovado | Sensor não encontrado |
| 340 | ID alheio não expõe leitura | GET /api/sensor-readings/4 | 404 | 404 | aprovado | Leitura não encontrada |
| 341 | ID inexistente leitura | GET /api/sensor-readings/999999999 | 404 | 404 | aprovado | Leitura não encontrada |
| 342 | ID alheio não expõe atividade | GET /api/crop-areas/6/activities/4 | 404 | 404 | aprovado | Registro não encontrado |
| 343 | ID inexistente atividade | GET /api/crop-areas/999999999/activities/999999999 | 404 | 404 | aprovado | Registro não encontrado |
| 344 | ID alheio não expõe análise | GET /api/risk-jobs/3 | 404 | 404 | aprovado | Registro não encontrado |
| 345 | ID inexistente análise | GET /api/risk-jobs/999999999 | 404 | 404 | aprovado | Registro não encontrado |
| 346 | ID alheio não expõe alerta | GET /api/alerts/3 | 404 | 404 | aprovado | Registro não encontrado |
| 347 | ID inexistente alerta | GET /api/alerts/999999999 | 404 | 404 | aprovado | Registro não encontrado |
| 348 | Listagem alheia isolada /api/farms/7/crop-areas | GET /api/farms/7/crop-areas | 404 | 404 | aprovado | Propriedade não encontrada |
| 349 | Listagem alheia isolada /api/crop-areas/6/sensors | GET /api/crop-areas/6/sensors | 404 | 404 | aprovado | Área de cultivo não encontrada |
| 350 | Listagem alheia isolada /api/crop-areas/6/readings | GET /api/crop-areas/6/readings | 404 | 404 | aprovado | Área de cultivo não encontrada |
| 351 | Listagem alheia isolada /api/sensors/5/readings | GET /api/sensors/5/readings | 404 | 404 | aprovado | Sensor não encontrado |
| 352 | Listagem alheia isolada /api/crop-areas/6/activities | GET /api/crop-areas/6/activities | 404 | 404 | aprovado | Registro não encontrado |
| 353 | Listagem alheia isolada /api/crop-areas/6/risk-jobs | GET /api/crop-areas/6/risk-jobs | 404 | 404 | aprovado | Registro não encontrado |
| 354 | Listagem alheia isolada /api/crop-areas/6/alerts | GET /api/crop-areas/6/alerts | 404 | 404 | aprovado | Registro não encontrado |
| 355 | Cadastro vinculado a propriedade alheia rejeitado | POST /api/crop-areas | 404 | 404 | aprovado | Propriedade não encontrada |
| 356 | Cadastro vinculado a talhão alheio rejeitado | POST /api/sensors | 404 | 404 | aprovado | Área de cultivo não encontrada |
| 357 | Leitura vinculada a sensor alheio rejeitada | POST /api/sensor-readings | 404 | 404 | aprovado | Sensor não encontrado |
| 358 | Paginação negativa /api/farms | GET /api/farms?page=-1&size=20 | 400 | 400 | aprovado | Bad Request |
| 359 | Paginação negativa /api/crop-areas | GET /api/crop-areas?page=-1&size=20 | 400 | 400 | aprovado | Bad Request |
| 360 | Paginação negativa /api/sensors | GET /api/sensors?page=-1&size=20 | 400 | 400 | aprovado | Bad Request |
| 361 | Paginação negativa /api/sensor-readings | GET /api/sensor-readings?page=-1&size=20 | 400 | 400 | aprovado | Bad Request |
| 362 | Paginação negativa /api/alerts | GET /api/alerts?page=-1&size=20 | 400 | 400 | aprovado | Bad Request |
| 363 | Paginação negativa /api/crop-areas/8/activities | GET /api/crop-areas/8/activities?page=-1&size=20 | 400 | 400 | aprovado | Bad Request |
| 364 | Paginação negativa /api/crop-areas/8/risk-jobs | GET /api/crop-areas/8/risk-jobs?page=-1&size=20 | 400 | 400 | aprovado | Bad Request |
| 365 | Restauração HTTP com mesmo JWT | GET /api/auth/me | 200 | 200 | aprovado | Critério do cenário confirmado. |
| 366 | Sem token rejeita /api/auth/me | GET /api/auth/me | 401 | 401 | aprovado | Token ausente ou inválido |
| 367 | Sem token rejeita /api/farms/9 | GET /api/farms/9 | 401 | 401 | aprovado | Token ausente ou inválido |
| 368 | Sem token rejeita /api/crop-areas/8 | GET /api/crop-areas/8 | 401 | 401 | aprovado | Token ausente ou inválido |
| 369 | Sem token rejeita /api/risk-jobs/9 | GET /api/risk-jobs/9 | 401 | 401 | aprovado | Token ausente ou inválido |
| 370 | Dashboard final completo | GET /api/dashboard | 200 | 200 | aprovado | Critério do cenário confirmado. |
| 371 | Dashboard nomes e IDs isolados | assert estado HTTP persistido | asserção / não executado | — | aprovado | Critério do cenário confirmado. |
| 372 | Dashboard alertas ativos corretos | assert estado HTTP persistido | asserção / não executado | — | aprovado | Critério do cenário confirmado. |
| 373 | Dashboard resumos dos quatro cenários | assert estado HTTP persistido | asserção / não executado | — | aprovado | Critério do cenário confirmado. |
| 374 | Dashboard atividades recentes | assert estado HTTP persistido | asserção / não executado | — | aprovado | Critério do cenário confirmado. |
| 375 | Dashboard sem jobs pendentes ou falhos e sem problemas permanentes | assert estado HTTP persistido | asserção / não executado | — | aprovado | Critério do cenário confirmado. |
| 376 | Atualização manual HTTP do dashboard | GET /api/dashboard | 200 | 200 | aprovado | Critério do cenário confirmado. |
| 377 | Inventário final sem descartáveis farms | GET /api/farms?page=0&size=100 | 200 | 200 | aprovado | Critério do cenário confirmado. |
| 378 | Inventário final sem descartáveis crops | GET /api/crop-areas?page=0&size=100 | 200 | 200 | aprovado | Critério do cenário confirmado. |
| 379 | Inventário final sem descartáveis sensors | GET /api/sensors?page=0&size=100 | 200 | 200 | aprovado | Critério do cenário confirmado. |
| 380 | Inventário final sem descartáveis readings | GET /api/sensor-readings?page=0&size=100 | 200 | 200 | aprovado | Critério do cenário confirmado. |
| 381 | Atividade permanente final irrigation | GET /api/crop-areas/8/activities/8 | 200 | 200 | aprovado | Critério do cenário confirmado. |
| 382 | Atividade permanente final planting | GET /api/crop-areas/8/activities/9 | 200 | 200 | aprovado | Critério do cenário confirmado. |
| 383 | Atividade permanente final fertilization | GET /api/crop-areas/9/activities/10 | 200 | 200 | aprovado | Critério do cenário confirmado. |
| 384 | Atividade permanente final harvest | GET /api/crop-areas/9/activities/11 | 200 | 200 | aprovado | Critério do cenário confirmado. |
| 385 | RiskJob final normal | GET /api/risk-jobs/9 | 200 | 200 | aprovado | Critério do cenário confirmado. |
| 386 | RiskJob final attention | GET /api/risk-jobs/10 | 200 | 200 | aprovado | Critério do cenário confirmado. |
| 387 | RiskJob final critical | GET /api/risk-jobs/11 | 200 | 200 | aprovado | Critério do cenário confirmado. |
| 388 | RiskJob final insufficient | GET /api/risk-jobs/12 | 200 | 200 | aprovado | Critério do cenário confirmado. |
| 389 | Fallback preservado pela API para consulta futura | assert estado HTTP persistido | asserção / não executado | — | falho | GET posterior retornou guidance=null: fallback não persiste no backend. Conteúdo preservado no relatório; pendência de consulta no app, sem novo POST. |
| 390 | Exclusão protegida de leitura ANALYZED | — DELETE /api/sensor-readings/{id} | asserção / não executado | — | não executado | Nenhuma leitura descartável ANALYZED disponível; permanentes não recebem DELETE. Inspeção confirma guarda 409. |
| 391 | Timeout real do guidance | — POST /api/risk-jobs/{id}/guidance | asserção / não executado | — | não executado | Tentativa única retornou fallback rapidamente. Timeout dedicado e retry=false inspecionados/testados em funções puras. |
| 392 | Dashboard com jobs FAILED reais | — GET /api/dashboard | asserção / não executado | — | não executado | Nenhum FAILED observado; não alterar infraestrutura ou criar análises extras para forçar falha. |
| 393 | Dashboard parcial real | — GET /api/dashboard | asserção / não executado | — | não executado | API retornou todas as seções; normalização de payload parcial coberta por testes locais. |
| 394 | Calibração e nota de manutenção preenchidas | — GET /api/sensors/{id}/health | asserção / não executado | — | não executado | Contrato do mobile somente consulta esses metadados; todos retornaram null, sem endpoint implementado de escrita. |
| 395 | Produtor sem papel técnico recebe 403 | PATCH /api/technician/sensors/999999999/maintenance | 403 | 403 | aprovado | Acesso negado |
| 396 | Sessão HTTP continua válida após rejeição de papel | GET /api/auth/me | 200 | 200 | aprovado | Critério do cenário confirmado. |
| 397 | Criar talhão DESCARTÁVEL para restrições de leitura | POST /api/crop-areas | 201 | 201 | aprovado | Critério do cenário confirmado. |
| 398 | Criar sensor DESCARTÁVEL para restrições | POST /api/sensors | 201 | 201 | aprovado | Critério do cenário confirmado. |
| 399 | Leitura recente DESCARTÁVEL de controle | POST /api/sensor-readings | 201 | 201 | aprovado | Critério do cenário confirmado. |
| 400 | Alterar DESCARTÁVEL com histórico para INACTIVE | PUT /api/sensors/25 | 200 | 200 | aprovado | Critério do cenário confirmado. |
| 401 | Status INACTIVE não substitui comunicação RECENT | GET /api/sensors/25/health | 200 | 200 | aprovado | Critério do cenário confirmado. |
| 402 | Sensor INACTIVE bloqueia leitura | POST /api/sensor-readings | 409 | 409 | aprovado | Somente sensores ACTIVE podem registrar leituras |
| 403 | Alterar DESCARTÁVEL com histórico para FAULT | PUT /api/sensors/25 | 200 | 200 | aprovado | Critério do cenário confirmado. |
| 404 | Status FAULT não substitui comunicação RECENT | GET /api/sensors/25/health | 200 | 200 | aprovado | Critério do cenário confirmado. |
| 405 | Sensor FAULT bloqueia leitura | POST /api/sensor-readings | 409 | 409 | aprovado | Somente sensores ACTIVE podem registrar leituras |
| 406 | Alterar DESCARTÁVEL com histórico para MAINTENANCE | PUT /api/sensors/25 | 200 | 200 | aprovado | Critério do cenário confirmado. |
| 407 | Status MAINTENANCE não substitui comunicação RECENT | GET /api/sensors/25/health | 200 | 200 | aprovado | Critério do cenário confirmado. |
| 408 | Sensor MAINTENANCE bloqueia leitura | POST /api/sensor-readings | 409 | 409 | aprovado | Somente sensores ACTIVE podem registrar leituras |
| 409 | Ativar sensor DESCARTÁVEL | PUT /api/sensors/25 | 200 | 200 | aprovado | Critério do cenário confirmado. |
| 410 | Tolerância de leitura até 5min DESCARTÁVEL | POST /api/sensor-readings | 201 | 201 | aprovado | Critério do cenário confirmado. |
| 411 | Comunicação INVALID_TIMESTAMP de leitura futura tolerada | GET /api/sensors/25/health | 200 | 200 | aprovado | Critério do cenário confirmado. |
| 412 | Arquivar DESCARTÁVEL com sensor | PATCH /api/crop-areas/14/archive | 200 | 200 | aprovado | Critério do cenário confirmado. |
| 413 | Talhão arquivado bloqueia leitura | POST /api/sensor-readings | 409 | 409 | aprovado | Cultivo arquivado |
| 414 | Reativar DESCARTÁVEL de restrições | PATCH /api/crop-areas/14/archive | 200 | 200 | aprovado | Critério do cenário confirmado. |
| 415 | Excluir DESCARTÁVEL readings 36 | DELETE /api/sensor-readings/36 | 204 | 204 | aprovado | Critério do cenário confirmado. |
| 416 | Confirmar exclusão readings 36 | GET /api/sensor-readings/36 | 404 | 404 | aprovado | Leitura não encontrada |
| 417 | Excluir DESCARTÁVEL readings 37 | DELETE /api/sensor-readings/37 | 204 | 204 | aprovado | Critério do cenário confirmado. |
| 418 | Confirmar exclusão readings 37 | GET /api/sensor-readings/37 | 404 | 404 | aprovado | Leitura não encontrada |
| 419 | Excluir DESCARTÁVEL sensors 25 | DELETE /api/sensors/25 | 204 | 204 | aprovado | Critério do cenário confirmado. |
| 420 | Confirmar exclusão sensors 25 | GET /api/sensors/25 | 404 | 404 | aprovado | Sensor não encontrado |
| 421 | Excluir DESCARTÁVEL crops 14 | DELETE /api/crop-areas/14 | 204 | 204 | aprovado | Critério do cenário confirmado. |
| 422 | Confirmar exclusão crops 14 | GET /api/crop-areas/14 | 404 | 404 | aprovado | Área de cultivo não encontrada |
| 423 | Persistir payload real do mobile com data local em UTC | PUT /api/crop-areas/8/activities/8 | 200 | 200 | aprovado | Critério do cenário confirmado. |
| 424 | Duas revisões Normal preservadas por SELECT somente leitura | assert estado HTTP persistido | asserção / não executado | — | aprovado | agronomic_profiles: id=5,revision=1 e id=6,revision=2, crop_area_id=8, CC=45 e PMP=15; consulta direta sem escrita. |
| 425 | Conferência após limpeza final farms | GET /api/farms?page=0&size=100 | 200 | 200 | aprovado | Critério do cenário confirmado. |
| 426 | Conferência após limpeza final crops | GET /api/crop-areas?page=0&size=100 | 200 | 200 | aprovado | Critério do cenário confirmado. |
| 427 | Conferência após limpeza final sensors | GET /api/sensors?page=0&size=100 | 200 | 200 | aprovado | Critério do cenário confirmado. |
| 428 | Conferência após limpeza final readings | GET /api/sensor-readings?page=0&size=100 | 200 | 200 | aprovado | Critério do cenário confirmado. |
| 429 | Conferência final dashboard após limpeza | GET /api/dashboard | 200 | 200 | aprovado | Critério do cenário confirmado. |
