import axios, { type AxiosError } from 'axios';

interface ApiErrorData {
  title?: string;
  status?: number;
  errors?: string[];
  error?: string;
}

/**
 * Type-safe API error handler.
 * Logs structured error details for debugging.
 */
export function handleApiError(error: unknown, operation: string): string {
  if (!error) {
    console.error(`${operation} failed: Unknown error`);
    return 'An unknown error occurred';
  }

  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<ApiErrorData>;
    const status = axiosError.response?.status;
    const data = axiosError.response?.data;
    const message = data?.title ?? data?.error ?? axiosError.message;

    console.error(`${operation} failed:`, { status, message, url: axiosError.config?.url });

    if (data?.errors && Array.isArray(data.errors)) {
      return data.errors.join('. ');
    }

    return message ?? `HTTP ${status ?? 'unknown'}`;
  }

  if (error instanceof Error) {
    console.error(`${operation} failed:`, error.message);
    return error.message;
  }

  console.error(`${operation} failed:`, String(error));
  return String(error);
}
