import { type ApiErrorEnvelope } from '@shared/api-contracts';

/**
 * Build a user-facing message from API error envelope payload.
 */
export function getApiErrorMessage(
  responseStatus: number,
  errorEnvelope: ApiErrorEnvelope | null,
): string {
  const errorCode = errorEnvelope?.error?.code;
  const errorMessage = errorEnvelope?.error?.message;
  const requestId = errorEnvelope?.meta?.requestId;

  const baseMessage =
    errorMessage ??
    (errorCode === 'validation_error'
      ? 'Please check your input and try again.'
      : errorCode === 'invalid_token'
        ? 'Your session is invalid. Please sign in again.'
        : errorCode === 'internal_error'
          ? 'Server error. Please try again in a moment.'
          : `Request failed: ${responseStatus}`);

  return requestId ? `${baseMessage} (request: ${requestId})` : baseMessage;
}
