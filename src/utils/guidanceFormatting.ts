export function formatGuidanceReason(reason: string | null): string {
  switch (reason) {
    case 'INSUFFICIENT_CONTEXT': return 'Faltam dados para explicar esta análise. Confira as leituras e o perfil.';
    case 'NO_RELEVANT_SOURCES': return 'Não há referências suficientes para uma orientação confiável.';
    case 'PROVIDER_UNAVAILABLE': return 'A orientação está indisponível. O resultado da análise continua disponível.';
    default: return 'O servidor não confirmou uma orientação válida da IA. O resultado determinístico continua disponível.';
  }
}
