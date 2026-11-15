import type { GuidanceSource, RiskGuidance } from '../types/riskJob';

const record = (value: unknown): Record<string, unknown> | null => typeof value === 'object' && value !== null && !Array.isArray(value) ? value as Record<string, unknown> : null;
const text = (value: unknown): string | null => typeof value === 'string' && value.trim() ? value : null;
const strings = (value: unknown): string[] => Array.isArray(value) ? value.flatMap(item => { const value = text(item); return value === null ? [] : [value]; }) : [];
export function normalizeGuidance(value: unknown): RiskGuidance | null {
  const data = record(value);
  if (!data) return null;
  const sources: GuidanceSource[] = Array.isArray(data.sources) ? data.sources.flatMap(value => {
    const source = record(value);
    if (!source) return [];
    const item = { sourceId: text(source.sourceId), title: text(source.title), institution: text(source.institution), url: text(source.url), version: text(source.version) };
    return Object.values(item).some(value => value !== null) ? [item] : [];
  }) : [];
  return { summary: text(data.summary), recommendation: text(data.recommendation), recommendedActions: strings(data.recommendedActions), warnings: strings(data.warnings), signals: strings(data.signals), sources,
    riskLevel: text(data.riskLevel), fallback: typeof data.fallback === 'boolean' ? data.fallback : null, reason: text(data.reason), model: text(data.model), promptVersion: text(data.promptVersion), generatedAt: text(data.generatedAt) };
}
