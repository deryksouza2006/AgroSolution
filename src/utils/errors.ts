import axios from 'axios';

export class AppError extends Error {}

export function isUnauthorized(error: unknown): boolean {
  return axios.isAxiosError(error) && [401, 403].includes(error.response?.status ?? 0);
}

function record(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function message(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const text = value.trim();
  // Reject common diagnostic payloads instead of rendering server internals.
  if (!text || text.length > 500 || /(?:\bat\s+[\w.$]+\([^)]*:\d+|stacktrace|exception|<html|\bselect\b.+\bfrom\b|\b(?:Bearer|eyJ)\s*\S+)/i.test(text)) return undefined;
  return text;
}

export { message as safeApiMessage };

export function parseApiError(error: unknown): string {
  if (error instanceof AppError) return error.message;
  if (!axios.isAxiosError<unknown>(error)) return 'Não foi possível concluir a operação. Tente novamente.';
  if (!error.response) return 'Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.';
  const data = error.response.data;
  if (record(data)) {
    const preferred = message(data.detail) ?? message(data.message);
    if (preferred) return preferred;
    if (record(data.fields)) {
      const messages = Object.values(data.fields).flatMap(value =>
        (Array.isArray(value) ? value : [value]).flatMap(item => {
          const text = message(item);
          return text ? [text] : [];
        }),
      );
      if (messages.length) return messages.slice(0, 4).join('\n');
    }
  }
  if (isUnauthorized(error)) return 'Acesso não autorizado. Verifique suas credenciais ou entre novamente.';
  if (error.response.status >= 500) return 'O servidor está indisponível no momento. Tente novamente.';
  return 'Não foi possível concluir a operação. Verifique os dados e tente novamente.';
}

export function parseApiFieldErrors(error: unknown): Record<string, string> {
  if (!axios.isAxiosError<unknown>(error) || error.response?.status !== 400) return {};
  const data = error.response.data;
  if (!record(data) || !record(data.fields)) return {};
  const fields: Record<string, string> = {};
  for (const [key, value] of Object.entries(data.fields)) {
    const messages = (Array.isArray(value) ? value : [value])
      .map(message).filter((item): item is string => item !== undefined);
    if (messages.length) fields[key] = messages.slice(0, 2).join('\n');
  }
  return fields;
}
