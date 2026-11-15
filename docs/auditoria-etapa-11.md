# Auditoria de qualidade — etapa 11

Data: 13/11/2026, fuso America/Sao_Paulo. Escopo: código mobile, funções puras e integração HTTP com a API real de desenvolvimento.

**A interface não está aprovada.** A automação visual por ADB foi encerrada definitivamente a pedido do usuário. Navegação, teclado, layout, temas, acessibilidade, fontes, botões e SecureStore permanecem **pendentes de validação manual pelo usuário**. As tentativas visuais anteriores não compõem os resultados aprovados deste relatório.

## Resultados e critérios

| Grupo | Aprovados | Falhos no estado final | Não executados/pendentes |
| --- | ---: | ---: | ---: |
| Testes automatizados do mobile (Node) | 104 | 0 | 0 |
| Cenários de integração HTTP e condições reais | 161 | 0 | 4 |
| TypeScript e compatibilidade do Expo | 2 | 0 | 0 |
| Grupos de conferência visual manual | 0 | 0 | 20 |

Cada linha de integração representa um cenário, podendo reunir mais de uma chamada (ex.: duas páginas ou polling no mesmo ID). Retestes substituem o resultado final do mesmo cenário; o defeito inicial e sua correção permanecem descritos abaixo. HTTP 400/401/404/409 são aprovados quando a rejeição era o resultado esperado. Os casos não observados não foram aprovados por inferência nem por respostas simuladas.

## Ambiente e segurança

- API configurada e acessível; `/actuator/health` retornou UP. PostgreSQL e RabbitMQ estavam ativos/saudáveis; os dois RiskJobs criados pelo roteiro foram efetivamente processados.
- O Android SM-A346M tinha Expo Go 58.0.5 com instalador Play Store; a conectividade da API pelo celular foi verificada antes da interrupção. Isso não aprova a interface.
- O Metro anunciava inicialmente outra interface de rede. Foi iniciado com o hostname LAN correto apenas no ambiente do processo e depois encerrado. A origem `EXPO_PUBLIC_API_URL` não foi alterada.
- Login HTTP capturou JWT automaticamente em memória. Nenhuma resposta completa de login, credencial ou JWT integra os arquivos do projeto ou este relatório. A senha da conta não foi alterada.
- A auditoria começou com 2 propriedades, 1 talhão, 1 sensor e nenhuma leitura na conta. As mutações do roteiro HTTP ficaram restritas aos IDs criados nesta auditoria. Os recursos anteriores continuaram consultáveis.
- `.env` permanece ignorado pelo Git. Nele foi atualizada somente a referência do HEAD para Sobre o App; o endereço da API foi preservado. Nenhum Git é executado no runtime.
- Sem dependências novas, alteração na API Java, prebuild, build nativo, EAS Build, Firebase App Distribution ou commit. Scripts de auditoria e artefatos visuais temporários são removidos ao concluir.

## Cenário DEMO-GS preservado

Os nomes/descrições e o perfil `demo=true` identificam a demonstração. As medições foram informadas manualmente para auditoria, sem rotas de simulação; não são medições de campo nem recomendação profissional.

| Recurso | IDs preservados | Estado confirmado |
| --- | --- | --- |
| Fazenda DEMO-GS | 7 | Disponível, Campinas/SP, 100,5 hectares. O contrato de propriedade não possui campo de status. |
| Talhão DEMO-GS | 6 | NORMAL (reativado), Milho, 5,5 hectares, propriedade 7. |
| Perfil agronômico | 3 (revisão 1), 4 (revisão 2) | GET expõe somente a revisão atual 2; demo=true; capacidade 38, ponto de murcha 18. |
| Diário agrícola | 4, 5 | Irrigação e fertilização recentes; atividade 4 atualizada. |
| Sensor de umidade do solo | 5 | ACTIVE, código uppercase, comunicação RECENT e saúde HEALTHY. |
| Sensor de temperatura | 6 | ACTIVE, código uppercase, comunicação RECENT e saúde HEALTHY. |
| Sensor de umidade do ar | 7 | ACTIVE, código uppercase, comunicação RECENT e saúde HEALTHY. |
| Estação climática | 8 | ACTIVE, código uppercase, comunicação RECENT e saúde HEALTHY. |
| Leituras do solo | 4, 5 | MANUAL; histórico e leitura recente do sensor 5. |
| Leitura de temperatura | 6 | MANUAL, sensor 6. |
| Leitura de umidade do ar | 7 | MANUAL, sensor 7. |
| Leituras da estação | 8, 10 | MANUAL; chuva zero e intervalos válidos. A 10 valida a correção de data omitida. |
| RiskJob e alerta usados para transições | 2 | COMPLETED_WITHOUT_AI, resultado CRITICAL e alerta RESOLVED, sem mudar o risco. |
| RiskJob e alerta abertos preservados | 3 | COMPLETED_WITHOUT_AI, resultado CRITICAL e alerta OPEN; útil para Entender análise. |
| RiskJob e alerta adicionais encontrados | 4 | Mesmo talhão 6, COMPLETED_WITHOUT_AI, resultado CRITICAL e alerta OPEN; apenas consultado no inventário final. |

Os IDs das revisões 1 e 2 foram confirmados por SELECT somente leitura, restrito ao talhão 6. Isso não cria endpoint ou histórico na interface: a API continua expondo apenas a revisão mais recente. O roteiro HTTP criou somente os jobs 2 e 3; o 4 foi identificado adicionalmente e preservado sem alterações. O job anterior 1, do talhão anterior 4, também foi preservado.

O dashboard real contém propriedade 7, talhão 6, atividades e leituras DEMO-GS e os alertas abertos. Totais da conta na conferência final: 3 propriedades, 2 talhões, 6 leituras e 2 alertas abertos/reconhecidos. Esses totais incluem dados anteriores da conta. **A presença na API foi confirmada; a apresentação no app fica para conferência manual.**

## Descartáveis excluídos

Prefixo usado: `AUDIT-DELETE-20261113-011408`. Exclusões retornaram 204 e foram confirmadas por GET 404.

| Recurso | IDs excluídos |
| --- | --- |
| Propriedade vazia | 8 |
| Talhão vazio | 7 |
| Sensor sem leituras | 9 |
| Leitura removível | 9 |
| Atividades descartáveis | 6, 7 |

Os DELETEs de conflito retornaram 409 e preservaram seus vínculos: propriedade 7 com talhão; talhão descartável 7 com sensor antes de sua limpeza; talhão DEMO-GS 6 com histórico; sensor DEMO-GS 5 com leituras. Nenhum recurso DEMO-GS foi excluído.

## RiskJob e orientação

- POST sem payload retornou 202 com o ID de cada job. O roteiro consultou o mesmo ID a intervalos de 1,5 segundo e parou no estado terminal; cada análise levou aproximadamente 4,7 segundos. Nenhum job foi criado automaticamente para substituir outro.
- O risco CRITICAL foi lido de `result.riskLevel` da API, sem cálculo no mobile. Nos jobs testados, `result.demo=true` e os snapshots das leituras tinham `simulated=false`: regra/perfil demonstrativos e leitura simulada não foram confundidos.
- O alerta 2 foi reconhecido e resolvido por PATCH; o GET confirmou RESOLVED com o mesmo risco CRITICAL. Os alertas 3 e 4 permaneceram OPEN.
- Houve uma única tentativa explícita de orientação pelo roteiro: `POST /api/risk-jobs/3/guidance`, sem body, HTTP 200, aproximadamente 0,1 segundo. Retornou `fallback=true`, `reason=PROVIDER_UNAVAILABLE` e `sources=[]`.
- O resultado determinístico ficou idêntico antes e depois da solicitação. O GET posterior retornou `guidance=null`, confirmando que a contingência não é persistida. Nenhum POST de retry foi enviado.
- Nenhuma orientação válida persistida foi observada. Reuso de resposta fallback=false, conteúdo legado e timeout real seguem não executados com API real; as respectivas decisões/políticas estão cobertas por testes puros.
- O timeout dedicado de 180 segundos existe somente no POST de guidance; o Axios geral continua com 15 segundos e a mutation não repete automaticamente.

## Defeitos encontrados e correções

| Evidência | Correção | Verificação |
| --- | --- | --- |
| O utilitário aceitava chuva sem data/hora; o payload sem measuredAt foi rejeitado pela API com 400. | Quando há chuva e os campos estão vazios, enviar o mesmo instante atual usado na validação do intervalo. Outras leituras continuam omitindo a data vazia. | Payload produzido pelo utilitário real recebeu 201, leitura 10; teste de regressão passou. |
| A API rejeita chuva com mais de seis dígitos inteiros, mas a validação mobile aceitava valores maiores. | Limite de 999999,999 mm e mensagem de campo correspondente. | HTTP 400 no excesso e testes de limites/precisão. |
| Mutations agrícolas não invalidavam o dashboard; renomeações/transferências podiam manter nomes antigos em respostas relacionadas. | Invalidar dashboard e caches relacionados de talhões, sensores e leituras após sucesso, preservando guardas de sessão. | Auditoria dos callbacks e chaves; TypeScript passou. Comportamento visual do cache permanece manual. |
| Intl formatava área null como zero; Date(null) produzia 1970. | Retornar ausência explícita para áreas, unidades, datas, coordenadas e quantidades inválidas. | Testes puros com null/undefined, zero real, NaN e Infinity. |
| Lookup de rótulos podia devolver propriedades herdadas como objetos/funções em vez de texto. | Conferir chaves próprias em rótulos e cores de status. | Testes puros com valores desconhecidos e propriedades de protótipo. |
| A API retornou QUEUED_FOR_ANALYSIS, que aparecia apenas como estado não reconhecido. | Traduzir RECORDED, QUEUED_FOR_ANALYSIS e FAILED como estados técnicos, sem atribuir risco/IA. | Enum real consultado e teste de tradução. |
| .env.example estava vazio; hash ausente usava development; URL parcial podia passar pelo teste de prefixo. | Documentar variáveis, fallback Não informado e validar URL HTTP(S) completa com o utilitário existente. | Diff, checagem de URL e TypeScript; sem URL fixa no runtime. |
| Uma fixture antiga de senha coincidia com a conta de teste. | Usar string sintética gerada; retirar também coincidência de dígitos em fixture decimal sem alterar a regra testada. | Varredura sem ocorrências das credenciais fornecidas e suíte completa passou. |

A primeira execução do cenário de chuva falhou com 400. Após correção, o mesmo cenário foi repetido usando o utilitário do aplicativo e aprovado com 201. Não houve alteração na API para contornar a falha.

## Auditoria estática

| Item | Constatação no código; limite da evidência |
| --- | --- |
| Tipos e API | Pages de RiskJob/atividades usam number; demais páginas usam page. Responses reais e filtros paginados foram conferidos por HTTP. |
| Navegação | Rotas e parâmetros declarados nas stacks existentes foram revisados; TypeScript também passou com noUnusedLocals/noUnusedParameters. Navegação efetiva continua manual. |
| Logout e sessão | signOut cancela queries, limpa QueryClient e remove o JWT via fila serializada de SecureStore. Callbacks de cache validam isSessionCurrent antes e após awaits. Isso não aprova SecureStore ou troca de usuário no dispositivo. |
| Polling | useRiskJob limita a janela a 60 segundos, cancela GET em blur/background/unmount e só repete estados de espera; consulta manual usa GET no mesmo ID. O término dos jobs reais antes de 60 segundos não comprova visualmente o limite/cancelamento. |
| Mutations e formulários | retry=false, referências de envio/trabalho e flags de pending previnem reentrada; valores permanecem no estado após catch; descarte e exclusão têm confirmação declarada. Interações e confirmações efetivas são manuais. |
| Null, 404, 409 e rede | Normalização tolerante de dashboard/jobs, parser sanitizado, mensagens específicas e manutenção de dados já carregados; cenários HTTP reais e funções puras foram testados. Rede/5xx não foram induzidos. |
| Risco e IA | Guidance só é solicitada após result; orientação válida não força regeneração; fallback local fica separado do cache autoritativo e não invalida caches como sucesso; guidance.riskLevel não substitui result.riskLevel. |
| Conteúdo e fontes | Prosa em Text; sem WebView/HTML/execução de Markdown ou instruções do modelo. safeSourceUrl restringe abertura a HTTP(S), host válido e ausência de credenciais/controles; fontes vazias não são inventadas. |
| Acessibilidade declarada | Labels, papéis, texto dos status, minHeight de ações, suporte à fonte do dispositivo e temas estão declarados. Não equivalem a aprovação visual ou por leitor de tela. |
| Configuração e segredos | API URL vem do ambiente; sem origem de backend fixa em src; sem console de credenciais; .env ignorado; hash via variável Expo, sem Git no runtime. |

## Matriz detalhada de integração HTTP

| Cenário | Método e endpoint | Esperado | HTTP observado | Resultado | ID criado | Observação sanitizada |
| --- | --- | --- | --- | --- | --- | --- |
| Login válido via API | POST /api/auth/login | Sucesso 200 | 200 | aprovado | — | JWT recebido e mantido somente em memória; token não registrado. |
| Senha incorreta | POST /api/auth/login | Rejeição esperada 401 | 401 | aprovado | — | Credenciais inválidas rejeitadas; senha da conta não alterada. |
| Rota protegida sem JWT | GET /api/dashboard | Rejeição esperada 401 | 401 | aprovado | — | Token ausente ou inválido |
| Sessão autenticada | GET /api/auth/me | Sucesso 200 | 200 | aprovado | — | Usuário e papel validados, sem registrar dados pessoais. |
| Criar farm | POST /api/farms | Sucesso 201 | 201 | aprovado | 7 | HTTP 201 |
| Detalhe da propriedade | GET /api/farms/7 | Sucesso 200 | 200 | aprovado | — | HTTP 200 |
| Editar propriedade preservada | PUT /api/farms/7 | Sucesso 200 | 200 | aprovado | — | HTTP 200 |
| Validação de propriedade | POST /api/farms | Rejeição esperada 400 | 400 | aprovado | — | Dados inválidos |
| Criar crop | POST /api/crop-areas | Sucesso 201 | 201 | aprovado | 6 | HTTP 201 |
| Talhão por propriedade | GET /api/farms/7/crop-areas?page=0&size=1 | Sucesso 200 | 200 | aprovado | — | HTTP 200 |
| Editar talhão preservado | PUT /api/crop-areas/6 | Sucesso 200 | 200 | aprovado | — | HTTP 200 |
| Capacidade da propriedade excedida | POST /api/crop-areas | Rejeição esperada 409 | 409 | aprovado | — | A soma das áreas de cultivo ultrapassa a área total da propriedade |
| Coordenadas incompletas | POST /api/crop-areas | Rejeição esperada 400 | 400 | aprovado | — | Dados inválidos |
| Área com precisão inválida | POST /api/crop-areas | Rejeição esperada 400 | 400 | aprovado | — | Dados inválidos |
| Perfil ainda inexistente | GET /api/crop-areas/6/agronomic-profile | Rejeição esperada 404 | 404 | aprovado | — | Perfil ou cultivo não encontrado |
| Perfil revisão 1 | PUT /api/crop-areas/6/agronomic-profile | Sucesso 200 | 200 | aprovado | — | HTTP 200 |
| Perfil revisão 2 | PUT /api/crop-areas/6/agronomic-profile | Sucesso 200 | 200 | aprovado | — | HTTP 200 |
| Ordem inválida dos percentuais | PUT /api/crop-areas/6/agronomic-profile | Rejeição esperada 400 | 400 | aprovado | — | Dados inválidos |
| Percentual maior que cem | PUT /api/crop-areas/6/agronomic-profile | Rejeição esperada 400 | 400 | aprovado | — | Dados inválidos |
| Criar soil | POST /api/sensors | Sucesso 201 | 201 | aprovado | 5 | HTTP 201 |
| Saúde sem leituras soil | GET /api/sensors/5/health | Sucesso 200 | 200 | aprovado | — | HTTP 200 |
| Criar temperature | POST /api/sensors | Sucesso 201 | 201 | aprovado | 6 | HTTP 201 |
| Saúde sem leituras temperature | GET /api/sensors/6/health | Sucesso 200 | 200 | aprovado | — | HTTP 200 |
| Criar humidity | POST /api/sensors | Sucesso 201 | 201 | aprovado | 7 | HTTP 201 |
| Saúde sem leituras humidity | GET /api/sensors/7/health | Sucesso 200 | 200 | aprovado | — | HTTP 200 |
| Criar weather | POST /api/sensors | Sucesso 201 | 201 | aprovado | 8 | HTTP 201 |
| Saúde sem leituras weather | GET /api/sensors/8/health | Sucesso 200 | 200 | aprovado | — | HTTP 200 |
| Código duplicado | POST /api/sensors | Rejeição esperada 409 | 409 | aprovado | — | Código de dispositivo já cadastrado |
| Conflito: propriedade com talhão DEMO-GS | DELETE /api/farms/7 | Rejeição esperada 409 | 409 | aprovado | — | Não é possível excluir propriedade com áreas de cultivo vinculadas |
| Arquivar talhão | PATCH /api/crop-areas/6/archive | Sucesso 200 | 200 | aprovado | — | HTTP 200 |
| Consulta de diário arquivado | GET /api/crop-areas/6/activities?page=0&size=20 | Sucesso 200 | 200 | aprovado | — | HTTP 200 |
| Diário arquivado impede cadastro | POST /api/crop-areas/6/activities | Rejeição esperada 409 | 409 | aprovado | — | Cultivo arquivado: reative antes de alterar atividades |
| Perfil em talhão arquivado segue API | GET /api/crop-areas/6/agronomic-profile | Sucesso 200 | 200 | aprovado | — | HTTP 200 |
| Reativar talhão | PATCH /api/crop-areas/6/archive | Sucesso 200 | 200 | aprovado | — | HTTP 200 |
| Criar irrigation | POST /api/crop-areas/6/activities | Sucesso 201 | 201 | aprovado | 4 | HTTP 201 |
| Criar fertilization | POST /api/crop-areas/6/activities | Sucesso 201 | 201 | aprovado | 5 | HTTP 201 |
| Editar atividade preservada | PUT /api/crop-areas/6/activities/4 | Sucesso 200 | 200 | aprovado | — | HTTP 200 |
| Atividade futura | POST /api/crop-areas/6/activities | Rejeição esperada 400 | 400 | aprovado | — | Dados inválidos |
| Quantidade sem unidade | POST /api/crop-areas/6/activities | Rejeição esperada 400 | 400 | aprovado | — | Dados inválidos |
| Período invertido | GET /api/crop-areas/6/activities?from=2026-11-13T04:25:10.854212Z&to=2026-11-13T04:05:10.854273Z | Rejeição esperada 400 | 400 | aprovado | — | Período inválido |
| Criar soilOlder | POST /api/sensor-readings | Sucesso 201 | 201 | aprovado | 4 | HTTP 201 |
| Criar soilLatest | POST /api/sensor-readings | Sucesso 201 | 201 | aprovado | 5 | HTTP 201 |
| Criar temperatureReading | POST /api/sensor-readings | Sucesso 201 | 201 | aprovado | 6 | HTTP 201 |
| Criar humidityReading | POST /api/sensor-readings | Sucesso 201 | 201 | aprovado | 7 | HTTP 201 |
| Criar weatherReading | POST /api/sensor-readings | Sucesso 201 | 201 | aprovado | 8 | HTTP 201 |
| Saúde após leituras soil | GET /api/sensors/5/health | Sucesso 200 | 200 | aprovado | — | HTTP 200 |
| Saúde após leituras temperature | GET /api/sensors/6/health | Sucesso 200 | 200 | aprovado | — | HTTP 200 |
| Saúde após leituras humidity | GET /api/sensors/7/health | Sucesso 200 | 200 | aprovado | — | HTTP 200 |
| Saúde após leituras weather | GET /api/sensors/8/health | Sucesso 200 | 200 | aprovado | — | HTTP 200 |
| Leitura fora dos limites | POST /api/sensor-readings | Rejeição esperada 400 | 400 | aprovado | — | Dados inválidos |
| Leitura muito futura | POST /api/sensor-readings | Rejeição esperada 400 | 400 | aprovado | — | Data da medição não pode exceder 5 minutos no futuro |
| Chuva sem intervalo | POST /api/sensor-readings | Rejeição esperada 400 | 400 | aprovado | — | Dados inválidos |
| Diário paginado | GET /api/crop-areas/6/activities?page=0&size=1 | Sucesso 200 | 200 | aprovado | — | HTTP 200 |
| Diário tipo/período | GET /api/crop-areas/6/activities?type=IRRIGATION&from=2026-11-12T04:15:14.283843Z&to=2026-11-13T04:15:14.283951Z&page=0&size=20 | Sucesso 200 | 200 | aprovado | — | HTTP 200 |
| Última leitura | GET /api/crop-areas/6/readings/latest | Sucesso 200 | 200 | aprovado | — | HTTP 200 |
| Leituras do sensor | GET /api/sensors/5/readings?page=0&size=1 | Sucesso 200 | 200 | aprovado | — | HTTP 200 |
| Leituras do talhão | GET /api/crop-areas/6/readings?page=0&size=1 | Sucesso 200 | 200 | aprovado | — | HTTP 200 |
| Sensores do talhão | GET /api/crop-areas/6/sensors?page=0&size=1 | Sucesso 200 | 200 | aprovado | — | HTTP 200 |
| Criar tempFarm | POST /api/farms | Sucesso 201 | 201 | aprovado | 8 | HTTP 201 |
| Criar tempCrop | POST /api/crop-areas | Sucesso 201 | 201 | aprovado | 7 | HTTP 201 |
| Transferir talhão descartável | PUT /api/crop-areas/7 | Sucesso 200 | 200 | aprovado | — | HTTP 200 |
| Criar tempSensor | POST /api/sensors | Sucesso 201 | 201 | aprovado | 9 | HTTP 201 |
| Conflito sensores no talhão descartável | DELETE /api/crop-areas/7 | Rejeição esperada 409 | 409 | aprovado | — | Não é possível excluir área de cultivo com sensores vinculados |
| Editar tipo/status e transferir sensor descartável | PUT /api/sensors/9 | Sucesso 200 | 200 | aprovado | — | HTTP 200 |
| Reativar sensor descartável e devolver ao talhão | PUT /api/sensors/9 | Sucesso 200 | 200 | aprovado | — | HTTP 200 |
| Criar tempActivity | POST /api/crop-areas/6/activities | Sucesso 201 | 201 | aprovado | 6 | HTTP 201 |
| AUDIT-DELETE-20261113-011408 atividade | DELETE /api/crop-areas/6/activities/6 | Sucesso 204 | 204 | aprovado | — | HTTP 204 |
| Criar tempReading | POST /api/sensor-readings | Sucesso 201 | 201 | aprovado | 9 | HTTP 201 |
| Excluir leitura descartável | DELETE /api/sensor-readings/9 | Sucesso 204 | 204 | aprovado | — | Leitura descartável excluída. |
| AUDIT-DELETE-20261113-011408 sensor sem leituras | DELETE /api/sensors/9 | Sucesso 204 | 204 | aprovado | — | HTTP 204 |
| AUDIT-DELETE-20261113-011408 talhão vazio | DELETE /api/crop-areas/7 | Sucesso 204 | 204 | aprovado | — | HTTP 204 |
| AUDIT-DELETE-20261113-011408 propriedade vazia | DELETE /api/farms/8 | Sucesso 204 | 204 | aprovado | — | HTTP 204 |
| Conflito leituras no sensor DEMO-GS | DELETE /api/sensors/5 | Rejeição esperada 409 | 409 | aprovado | — | Não é possível excluir sensor com leituras vinculadas |
| Conflito histórico no talhão DEMO-GS | DELETE /api/crop-areas/6 | Rejeição esperada 409 | 409 | aprovado | — | Cultivo com histórico deve ser arquivado |
| Criar resolvedJob | POST /api/crop-areas/6/risk-jobs | Sucesso 202 | 202 | aprovado | 2 | HTTP 202 |
| RiskJob resolvedJob polling no mesmo id | POST /api/crop-areas/6/risk-jobs; GET /api/risk-jobs/2 | Sucesso 200 | 200 | aprovado | — | {"jobId": 2, "states": ["PENDING", "PENDING", "PENDING", "COMPLETED_WITHOUT_AI"], "durationSeconds": 4.72, "riskLevel": "CRITICAL", "hasResult": true, "alertStatus": "OPEN"} |
| Reconhecer alerta | PATCH /api/alerts/2/acknowledge | Sucesso 200 | 200 | aprovado | — | HTTP 200 |
| Resolver alerta | PATCH /api/alerts/2/resolve | Sucesso 200 | 200 | aprovado | — | HTTP 200 |
| Risco após resolver alerta | GET /api/alerts/2 | Sucesso 200 | 200 | aprovado | — | HTTP 200 |
| Resolução não altera classificação | GET /api/alerts/2 | Sucesso 200 | 200 | aprovado | — | Risco original CRITICAL; risco atual CRITICAL; alerta RESOLVED |
| Criar openJob | POST /api/crop-areas/6/risk-jobs | Sucesso 202 | 202 | aprovado | 3 | HTTP 202 |
| RiskJob openJob polling no mesmo id | POST /api/crop-areas/6/risk-jobs; GET /api/risk-jobs/3 | Sucesso 200 | 200 | aprovado | — | {"jobId": 3, "states": ["PENDING", "PENDING", "PENDING", "COMPLETED_WITHOUT_AI"], "durationSeconds": 4.77, "riskLevel": "CRITICAL", "hasResult": true, "alertStatus": "OPEN"} |
| Histórico de RiskJobs | GET /api/crop-areas/6/risk-jobs?page=0&size=1 | Sucesso 200 | 200 | aprovado | — | HTTP 200 |
| Alertas gerais | GET /api/alerts?page=0&size=1 | Sucesso 200 | 200 | aprovado | — | HTTP 200 |
| Alertas do talhão | GET /api/crop-areas/6/alerts?page=0&size=1 | Sucesso 200 | 200 | aprovado | — | HTTP 200 |
| Orientação solicitada uma única vez | POST /api/risk-jobs/3/guidance | Sucesso 200 | 200 | aprovado | — | {"durationSeconds": 0.1, "fallback": true, "reason": "PROVIDER_UNAVAILABLE", "sourceCount": 0, "riskPreserved": true} |
| Consulta após orientação sem novo POST | GET /api/risk-jobs/3 | Sucesso 200 | 200 | aprovado | — | {"jobId": 3, "fallback": true, "reason": "PROVIDER_UNAVAILABLE", "persistedOnGet": false, "sourceCount": 0} |
| Fallback não persistido | GET /api/risk-jobs/3 | Sucesso 200 | 200 | aprovado | — | Contingência no POST e guidance=null no GET; sem repetição de geração. |
| Dashboard final | GET /api/dashboard | Sucesso 200 | 200 | aprovado | — | HTTP 200 |
| Cenário DEMO-GS no dashboard API | GET /api/dashboard | Sucesso 200 | 200 | aprovado | — | {"farmVisible": true, "cropVisible": true, "summaryVisible": true, "activitiesVisible": true, "readingsVisible": true, "openAlertVisible": true, "totals": {"farms": 3, "cropAreas": 2, "recentReadings": 6, "alerts": 1}} |
| Paginação real Propriedades | GET /api/farms?page=0/1&size=1 | Sucesso 200 | 200 | aprovado | — | {"pages": [0, 1], "ids": [[4], [6]], "totalElements": 3} |
| Paginação real Talhões | GET /api/crop-areas?page=0/1&size=1 | Sucesso 200 | 200 | aprovado | — | {"pages": [0, 1], "ids": [[4], [6]], "totalElements": 2} |
| Paginação real Sensores | GET /api/sensors?page=0/1&size=1 | Sucesso 200 | 200 | aprovado | — | {"pages": [0, 1], "ids": [[4], [5]], "totalElements": 5} |
| Paginação real Leituras | GET /api/sensor-readings?page=0/1&size=1 | Sucesso 200 | 200 | aprovado | — | {"pages": [0, 1], "ids": [[8], [7]], "totalElements": 5} |
| Paginação real Diário | GET /api/crop-areas/6/activities?page=0/1&size=1 | Sucesso 200 | 200 | aprovado | — | {"pages": [0, 1], "ids": [[4], [5]], "totalElements": 2} |
| Paginação real RiskJobs | GET /api/crop-areas/6/risk-jobs?page=0/1&size=1 | Sucesso 200 | 200 | aprovado | — | {"pages": [0, 1], "ids": [[3], [2]], "totalElements": 2} |
| Paginação real Alertas | GET /api/alerts?page=0/1&size=1 | Sucesso 200 | 200 | aprovado | — | {"pages": [0, 1], "ids": [[3], [2]], "totalElements": 3} |
| Contrato de detalhes farm | GET /api/farms/7 | Sucesso 200 | 200 | aprovado | — | Campos contratados disponíveis; recurso id 7 |
| Contrato de detalhes crop | GET /api/crop-areas/6 | Sucesso 200 | 200 | aprovado | — | Campos contratados disponíveis; recurso id 6 |
| Contrato de detalhes irrigation | GET /api/crop-areas/6/activities/4 | Sucesso 200 | 200 | aprovado | — | Campos contratados disponíveis; recurso id 4 |
| Contrato de detalhes profile | GET /api/crop-areas/6/agronomic-profile | Sucesso 200 | 200 | aprovado | — | Campos contratados disponíveis; recurso id 4 |
| Perfil demo e revisão atual | GET /api/crop-areas/6/agronomic-profile | Sucesso 200 | 200 | aprovado | — | demo=True; revision=2 |
| Origem manual preservada soilOlder | GET /api/sensor-readings/4 | Sucesso 200 | 200 | aprovado | — | source=MANUAL; analysisStatus=QUEUED_FOR_ANALYSIS |
| Origem manual preservada soilLatest | GET /api/sensor-readings/5 | Sucesso 200 | 200 | aprovado | — | source=MANUAL; analysisStatus=QUEUED_FOR_ANALYSIS |
| Exclusão de leitura ANALYZED | DELETE /api/sensor-readings/5 | Não observado na API real | — | não executado | — | Leitura preservada não está ANALYZED; não enviar DELETE que poderia removê-la. |
| Origem manual preservada temperatureReading | GET /api/sensor-readings/6 | Sucesso 200 | 200 | aprovado | — | source=MANUAL; analysisStatus=QUEUED_FOR_ANALYSIS |
| Origem manual preservada humidityReading | GET /api/sensor-readings/7 | Sucesso 200 | 200 | aprovado | — | source=MANUAL; analysisStatus=QUEUED_FOR_ANALYSIS |
| Origem manual preservada weatherReading | GET /api/sensor-readings/8 | Sucesso 200 | 200 | aprovado | — | source=MANUAL; analysisStatus=QUEUED_FOR_ANALYSIS |
| Chuva sem data da medição | POST /api/sensor-readings | Sucesso 201 | 201 | aprovado | — | Correção: payload produzido pelo utilitário real do mobile envia measuredAt no caso de chuva; API aceitou o intervalo. |
| Chuva excedendo seis dígitos inteiros | POST /api/sensor-readings | Rejeição esperada 400 | 400 | aprovado | — | Dados inválidos |
| Criar archivedActivity | POST /api/crop-areas/6/activities | Sucesso 201 | 201 | aprovado | 7 | HTTP 201 |
| Arquivar para validar diário existente | PATCH /api/crop-areas/6/archive | Sucesso 200 | 200 | aprovado | — | HTTP 200 |
| Diário arquivado impede edição | PUT /api/crop-areas/6/activities/7 | Rejeição esperada 409 | 409 | aprovado | — | Cultivo arquivado: reative antes de alterar atividades |
| Diário arquivado impede exclusão descartável | DELETE /api/crop-areas/6/activities/7 | Rejeição esperada 409 | 409 | aprovado | — | Cultivo arquivado: reative antes de alterar atividades |
| Talhão arquivado impede leitura | POST /api/sensor-readings | Rejeição esperada 409 | 409 | aprovado | — | Cultivo arquivado |
| Reativar após validação do diário | PATCH /api/crop-areas/6/archive | Sucesso 200 | 200 | aprovado | — | HTTP 200 |
| AUDIT-DELETE atividade usada para modo arquivado | DELETE /api/crop-areas/6/activities/7 | Sucesso 204 | 204 | aprovado | — | HTTP 204 |
| Recurso inexistente /api/farms/9007199254740991 | GET /api/farms/9007199254740991 | Rejeição esperada 404 | 404 | aprovado | — | Propriedade não encontrada |
| Recurso inexistente /api/crop-areas/9007199254740991 | GET /api/crop-areas/9007199254740991 | Rejeição esperada 404 | 404 | aprovado | — | Área de cultivo não encontrada |
| Recurso inexistente /api/sensors/9007199254740991 | GET /api/sensors/9007199254740991 | Rejeição esperada 404 | 404 | aprovado | — | Sensor não encontrado |
| Recurso inexistente /api/sensor-readings/9007199254740991 | GET /api/sensor-readings/9007199254740991 | Rejeição esperada 404 | 404 | aprovado | — | Leitura não encontrada |
| Recurso inexistente /api/risk-jobs/9007199254740991 | GET /api/risk-jobs/9007199254740991 | Rejeição esperada 404 | 404 | aprovado | — | Registro não encontrado |
| Recurso inexistente /api/alerts/9007199254740991 | GET /api/alerts/9007199254740991 | Rejeição esperada 404 | 404 | aprovado | — | Registro não encontrado |
| Contrato de saúde com leitura soil | GET /api/sensors/5/health | Sucesso 200 | 200 | aprovado | — | {"administrativeStatus": "ACTIVE", "communicationStatus": "RECENT", "calculatedHealth": "HEALTHY", "lastMeasuredAt": "2026-11-13T04:13:10.912082Z", "policy": "DEMO: stale=24h; offline=48h; flat=6/50min; jump=5min"} |
| Contrato de saúde com leitura temperature | GET /api/sensors/6/health | Sucesso 200 | 200 | aprovado | — | {"administrativeStatus": "ACTIVE", "communicationStatus": "RECENT", "calculatedHealth": "HEALTHY", "lastMeasuredAt": "2026-11-13T04:13:10.912103Z", "policy": "DEMO: stale=24h; offline=48h; flat=6/50min; jump=5min"} |
| Contrato de saúde com leitura humidity | GET /api/sensors/7/health | Sucesso 200 | 200 | aprovado | — | {"administrativeStatus": "ACTIVE", "communicationStatus": "RECENT", "calculatedHealth": "HEALTHY", "lastMeasuredAt": "2026-11-13T04:13:10.912117Z", "policy": "DEMO: stale=24h; offline=48h; flat=6/50min; jump=5min"} |
| Contrato de saúde com leitura weather | GET /api/sensors/8/health | Sucesso 200 | 200 | aprovado | — | {"administrativeStatus": "ACTIVE", "communicationStatus": "RECENT", "calculatedHealth": "HEALTHY", "lastMeasuredAt": "2026-11-13T04:21:20.306Z", "policy": "DEMO: stale=24h; offline=48h; flat=6/50min; jump=5min"} |
| Resultado e aviso demo preservados resolvedJob | GET /api/risk-jobs/2 | Sucesso 200 | 200 | aprovado | — | {"status": "COMPLETED_WITHOUT_AI", "riskLevel": "CRITICAL", "demo": true, "alertStatus": "RESOLVED", "simulatedReadings": [false, false, false, false, false]} |
| Resultado e aviso demo preservados openJob | GET /api/risk-jobs/3 | Sucesso 200 | 200 | aprovado | — | {"status": "COMPLETED_WITHOUT_AI", "riskLevel": "CRITICAL", "demo": true, "alertStatus": "OPEN", "simulatedReadings": [false, false, false, false, false]} |
| Talhão final ativo | GET /api/crop-areas/6 | Sucesso 200 | 200 | aprovado | — | Status final: NORMAL |
| Sensor final ativo soil | GET /api/sensors/5 | Sucesso 200 | 200 | aprovado | — | Status final ACTIVE |
| Sensor final ativo temperature | GET /api/sensors/6 | Sucesso 200 | 200 | aprovado | — | Status final ACTIVE |
| Sensor final ativo humidity | GET /api/sensors/7 | Sucesso 200 | 200 | aprovado | — | Status final ACTIVE |
| Sensor final ativo weather | GET /api/sensors/8 | Sucesso 200 | 200 | aprovado | — | Status final ACTIVE |
| Registros anteriores preservados farms | GET /api/farms/{id} | Sucesso 200 | 200 | aprovado | — | IDs anteriores continuam consultáveis; nenhuma mutação enviada para eles. |
| Registros anteriores preservados crops | GET /api/crop-areas/{id} | Sucesso 200 | 200 | aprovado | — | IDs anteriores continuam consultáveis; nenhuma mutação enviada para eles. |
| Registros anteriores preservados sensors | GET /api/sensors/{id} | Sucesso 200 | 200 | aprovado | — | IDs anteriores continuam consultáveis; nenhuma mutação enviada para eles. |
| Registros anteriores preservados readings | GET /api/sensor-readings/{id} | Sucesso 200 | 200 | aprovado | — | IDs anteriores continuam consultáveis; nenhuma mutação enviada para eles. |
| Estado final da Fazenda DEMO-GS | GET /api/farms/7 | Sucesso 200 | 200 | aprovado | — | Propriedade DEMO-GS disponível e íntegra, área 100,5 hectares. |
| Perfil final preservado | GET /api/crop-areas/6/agronomic-profile | Sucesso 200 | 200 | aprovado | — | Revisão 2, demo=true, percentuais válidos e ordenados; sem criar revisão extra. |
| Código uppercase no recurso soil | GET /api/sensors/5 | Sucesso 200 | 200 | aprovado | — | Código armazenado em maiúsculas e status administrativo ACTIVE. |
| Código uppercase no recurso temperature | GET /api/sensors/6 | Sucesso 200 | 200 | aprovado | — | Código armazenado em maiúsculas e status administrativo ACTIVE. |
| Código uppercase no recurso humidity | GET /api/sensors/7 | Sucesso 200 | 200 | aprovado | — | Código armazenado em maiúsculas e status administrativo ACTIVE. |
| Código uppercase no recurso weather | GET /api/sensors/8 | Sucesso 200 | 200 | aprovado | — | Código armazenado em maiúsculas e status administrativo ACTIVE. |
| Campos ausentes reais permanecem null | GET /api/sensor-readings/5 | Sucesso 200 | 200 | aprovado | — | Umidade do solo 19; temperatura e umidade do ar null, sem conversão para zero. |
| Confirmar exclusão descartável activities 6 | GET /api/crop-areas/6/activities/6 | Rejeição esperada 404 | 404 | aprovado | — | Registro não encontrado |
| Confirmar exclusão descartável readings 9 | GET /api/sensor-readings/9 | Rejeição esperada 404 | 404 | aprovado | — | Leitura não encontrada |
| Confirmar exclusão descartável sensors 9 | GET /api/sensors/9 | Rejeição esperada 404 | 404 | aprovado | — | Sensor não encontrado |
| Confirmar exclusão descartável crops 7 | GET /api/crop-areas/7 | Rejeição esperada 404 | 404 | aprovado | — | Área de cultivo não encontrada |
| Confirmar exclusão descartável farms 8 | GET /api/farms/8 | Rejeição esperada 404 | 404 | aprovado | — | Propriedade não encontrada |
| Confirmar exclusão descartável activities 7 | GET /api/crop-areas/6/activities/7 | Rejeição esperada 404 | 404 | aprovado | — | Registro não encontrado |
| Job útil e alerta aberto preservados | GET /api/risk-jobs/3 | Sucesso 200 | 200 | aprovado | — | Resultado determinístico disponível, alerta OPEN e guidance=null após fallback não persistido. Nenhum novo POST. |
| Filtro real por tipo e período confere conteúdo | GET /api/crop-areas/6/activities?type=IRRIGATION&from=2026-11-12T05:03:08.355389Z&to=2026-11-13T05:03:08.355463Z&page=0&size=20 | Sucesso 200 | 200 | aprovado | — | Somente a irrigação DEMO-GS está no resultado; fertilização excluída pelo filtro. |
| Filtro de período sem ocorrências | GET /api/crop-areas/6/activities?from=2026-11-13T06:03:08.400179Z&to=2026-11-13T07:03:08.400216Z&page=0&size=20 | Sucesso 200 | 200 | aprovado | — | Página vazia real para o período sem atividades. |
| Filtro por vínculo confere IDs: Talhões da propriedade | GET /api/farms/7/crop-areas?page=0&size=20 | Sucesso 200 | 200 | aprovado | — | IDs retornados [6]; somente os recursos da auditoria nesse vínculo. |
| Filtro por vínculo confere IDs: Sensores do talhão | GET /api/crop-areas/6/sensors?page=0&size=20 | Sucesso 200 | 200 | aprovado | — | IDs retornados [5, 6, 7, 8]; somente os recursos da auditoria nesse vínculo. |
| Filtro por vínculo confere IDs: Leituras do talhão | GET /api/crop-areas/6/readings?page=0&size=20 | Sucesso 200 | 200 | aprovado | — | IDs retornados [4, 5, 6, 7, 8, 10]; somente os recursos da auditoria nesse vínculo. |
| Compatibilidade real da leitura soilLatest | GET /api/sensor-readings/5 | Sucesso 200 | 200 | aprovado | — | Medição principal presente; source MANUAL; intervalo de chuva válido quando aplicável. |
| Compatibilidade real da leitura temperatureReading | GET /api/sensor-readings/6 | Sucesso 200 | 200 | aprovado | — | Medição principal presente; source MANUAL; intervalo de chuva válido quando aplicável. |
| Compatibilidade real da leitura humidityReading | GET /api/sensor-readings/7 | Sucesso 200 | 200 | aprovado | — | Medição principal presente; source MANUAL; intervalo de chuva válido quando aplicável. |
| Compatibilidade real da leitura rainRegression | GET /api/sensor-readings/10 | Sucesso 200 | 200 | aprovado | — | Medição principal presente; source MANUAL; intervalo de chuva válido quando aplicável. |
| Totais do dashboard conferem com listagens | GET /api/dashboard e GETs paginados | Sucesso 200 | 200 | aprovado | — | Totais reais {"farms": 3, "cropAreas": 2, "recentReadings": 6}; alertas abertos/reconhecidos [3, 4] |
| Guidance válida persistida e reutilizada | POST /api/risk-jobs/{jobId}/guidance; GET /api/risk-jobs/{jobId} | Não observado na API real | — | não executado | — | A tentativa real retornou PROVIDER_UNAVAILABLE. Nenhuma resposta fallback=false foi observada; não houve repetição do POST. |
| Guidance legada sem campo fallback na API real | GET /api/risk-jobs/{jobId} | Não observado na API real | — | não executado | — | Não havia conteúdo legado desse formato nos jobs consultados. A normalização está coberta pelos testes puros. |
| Timeout real de guidance e falhas de rede/5xx | POST /api/risk-jobs/{jobId}/guidance; GET /api/risk-jobs/{jobId} | Não observado na API real | — | não executado | — | O provedor retornou contingência em cerca de 0,1 segundo. Não foi induzida falha de rede, 5xx ou espera de 180 segundos; políticas e consulta segura são cobertas por testes e auditoria de código. |

## Pendências de validação manual pelo usuário

| Item | Tela/contexto | Situação | Conferência necessária |
| --- | --- | --- | --- |
| Aparência e integridade das telas | Todas as telas | Pendente de validação manual pelo usuário | Verificar conteúdo cortado, títulos, mensagens e identidade visual. |
| Teclado e edição dos campos | Login e formulários | Pendente de validação manual pelo usuário | Digitar, trocar foco, ocultar teclado e confirmar preservação dos valores após erro. |
| Rolagem | Listas, detalhes e formulários | Pendente de validação manual pelo usuário | Conferir acesso ao início/fim, campos e ações inferiores. |
| Safe Area | Todas as telas | Pendente de validação manual pelo usuário | Conferir status bar, recorte da câmera e barra de navegação. |
| Temas claro, escuro e sistema | Perfil e demais módulos | Pendente de validação manual pelo usuário | Selecionar temas no próprio aplicativo e revisar contraste e legibilidade. |
| Fontes ampliadas | Todas as telas | Pendente de validação manual pelo usuário | Usar a configuração de fonte escolhida pelo usuário; conferir labels, cards e tabs. |
| Leitor de tela | Botões, cards, seletores e mensagens | Pendente de validação manual pelo usuário | Conferir ordem, leitura de labels e anúncios de erro/loading. |
| Áreas de toque | Botões e seletores | Pendente de validação manual pelo usuário | Conferir interação real; minHeight declarado não aprova sozinho a área efetiva. |
| Confirmações visuais e ações destrutivas | Detalhes, logout e formulários | Pendente de validação manual pelo usuário | Cancelar primeiro; usar somente descartáveis em testes de exclusão. |
| Navegação por botões e parâmetros | Tabs, stacks e atalhos do dashboard | Pendente de validação manual pelo usuário | Abrir e voltar entre propriedade, talhão, diário, perfil, sensores, leituras, análises e alertas. |
| Pull-to-refresh por gesto | Listagens e Home | Pendente de validação manual pelo usuário | Conferir indicador e atualização por gesto. |
| Abertura visual das fontes | Orientação agronômica | Pendente de validação manual pelo usuário | Quando houver fontes reais, abrir somente links HTTP(S); sources vazio deve continuar vazio. |
| Fechar e reabrir Expo Go | Autenticação e restauração | Pendente de validação manual pelo usuário | Validar sessão restaurada e sessão encerrada sem considerar o roteiro visual anterior como aprovação. |
| SecureStore, logout e troca de conta | Autenticação e Perfil | Pendente de validação manual pelo usuário | Conferir remoção do JWT/cache privado e ausência de dados da conta anterior. |
| Toques repetidos e envio duplicado | Formulários, análise, orientação e exclusões | Pendente de validação manual pelo usuário | Conferir bloqueios e quantidade efetiva de requisições no dispositivo. |
| Alterações não salvas | Formulários agrícolas | Pendente de validação manual pelo usuário | Editar campo, tentar voltar e testar continuar/descartar. |
| Contingência local após GET guidance=null | Detalhes da análise e do alerta | Pendente de validação manual pelo usuário | Após tentativa explícita com fallback, consultar atualização e conferir que a contingência local permanece. |
| Apresentação e atualização do dashboard | Home | Pendente de validação manual pelo usuário | Os dados DEMO-GS foram confirmados na API; sua renderização e atualização visual precisam de conferência manual. |
| Perfil do usuário e Sobre o App | Perfil → Sobre o App | Pendente de validação manual pelo usuário | Conferir nome/descrição provisórios, versão 1.0.0, SDK 58, tecnologias e hash configurado; sem inventar integrantes ou RMs. |
| Loading, vazio, erro e tentar novamente | Todas as telas | Pendente de validação manual pelo usuário | Conferir os estados, anúncios e preservação dos últimos dados em falhas reais. |

## Roteiro curto para conferência manual

1. No notebook, inicie o Expo com `npx expo start --clear --lan`; se houver múltiplas interfaces, defina `REACT_NATIVE_PACKAGER_HOSTNAME` com o IP LAN correto no ambiente do processo. Abra o projeto no Expo Go compatível com SDK 58 e entre normalmente. Confira a Home e os dados DEMO-GS; não use registros anteriores da conta para testes destrutivos.
2. Em Propriedades, abra Fazenda DEMO-GS (7), depois Ver talhões e Talhão DEMO-GS (6). Confira voltar, labels, áreas e datas.
3. No talhão, abra o perfil agronômico (revisão 2/demo), o diário (atividades 4 e 5), os sensores (5 a 8) e as leituras (4 a 8 e 10). Confira filtros, paginação, refresh, teclado e descarte de alterações.
4. Abra as análises 2/3/4. Compare o resultado determinístico com os alertas: 2 resolvido, 3/4 abertos. Preserve um alerta aberto; resolver não deve mudar o risco.
5. Se desejar testar orientação, faça uma única solicitação explícita após o resultado. Em contingência, consulte atualização sem perder o conteúdo local; após timeout, consulte antes de outra tentativa. A disponibilidade depende do backend Gemini/RAG.
6. Em Perfil, confira claro/escuro/sistema e Sobre o App. Com as configurações de fonte/acessibilidade escolhidas por você, revise cortes, rolagem, Safe Area e leitor de tela.
7. Por fim, saia, feche/reabra o Expo Go e entre novamente. Confira proteção das telas e limpeza de dados privados; troca de conta requer outra conta autorizada.

## Validações e arquivos

- `node --experimental-strip-types --test --test-reporter=spec tests/*.test.mjs`: 104 passaram, 0 falharam.
- `npx tsc --noEmit`: passou. Checagem adicional de imports/parâmetros não usados também passou.
- `npx expo install --check`: Dependencies are up to date; Expo ~58.0.25 preservado.
- `npx expo lint`: tentado, mas ESLint não está configurado; instalação recusada e nenhuma dependência adicionada.
- `git diff --check`: sem erros. Nenhum commit foi realizado.

Arquivos criados/modificados nesta auditoria:

- `.env.example`
- `README.md`
- `docs/auditoria-etapa-11.md`
- `src/components/cropAreas/CropAreaStatusBadge.tsx`
- `src/hooks/activities/useActivityCache.ts`
- `src/hooks/cropAreas/useCropAreaCache.ts`
- `src/hooks/farms/useCreateFarm.ts`
- `src/hooks/farms/useDeleteFarm.ts`
- `src/hooks/farms/useUpdateFarm.ts`
- `src/hooks/readings/useReadingCache.ts`
- `src/hooks/sensors/useSensorCache.ts`
- `src/screens/readings/ReadingFormScreen.tsx`
- `src/screens/settings/AboutScreen.tsx`
- `src/services/api.ts`
- `src/utils/activityFormatting.ts`
- `src/utils/cropAreaFormatting.ts`
- `src/utils/numberFormatting.ts`
- `src/utils/readingFormatting.ts`
- `src/utils/readingValidation.ts`
- `src/utils/sensorFormatting.ts`
- `tests/agronomic-profile-utils.test.mjs`
- `tests/audit-regressions.test.mjs`
- `tests/auth-utils.test.mjs`
- `tests/reading-utils.test.mjs`

Arquivo local adicional: `.env` (ignorado), apenas referência do HEAD para Sobre o App; origem da API preservada.

## Limitações e decisões antes de distribuição

A etapa não certifica a interface ou a distribuição. Falta a conferência visual manual listada acima. Não se provocou timeout/5xx nem se alterou configuração do provedor. As leituras consultadas estavam QUEUED_FOR_ANALYSIS; por isso o DELETE protegido por ANALYZED não foi enviado sobre leituras preservadas. A leitura descartável removível foi efetivamente excluída.

Gemini/RAG indisponível impede comprovar orientação válida persistida; a contingência foi observada e registrada corretamente. O backend de risco processou normalmente os jobs criados. Nome final, identidade visual, identificadores Android/iOS, integrantes/RMs documentados quando aplicável, contas/assinatura EAS e projeto Firebase dependem de decisões do usuário. Não foram inventados nem configurados.

Nenhum recurso DEMO-GS será limpo automaticamente. Os IDs acima permanecem para conferência manual.
