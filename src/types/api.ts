export interface ApiErrorResponse {
  message?: string;
  fields?: Record<string, string | string[]>;
}

export interface ProblemDetail extends ApiErrorResponse {
  type?: string;
  title?: string;
  status?: number;
  detail?: string;
  instance?: string;
}
