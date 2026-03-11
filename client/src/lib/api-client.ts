import {
  type ApiErrorEnvelope,
  type ApiSuccessEnvelope,
} from '@shared/api-contracts';
import { resolveApiInput } from './api-base-url';
import { getDeviceId } from './device-id';
import { getApiErrorMessage } from './api-error';

/** Merge request headers with shared anonymous device identifier. */
function withDefaultHeaders(init?: RequestInit): RequestInit {
  const headers = new Headers(init?.headers);
  headers.set('x-device-id', getDeviceId());
  return {
    credentials: 'include',
    ...init,
    headers,
  };
}

/**
 * Fetch JSON from an API endpoint and throw on non-2xx responses.
 */
export async function fetchJson<T>(
  input: RequestInfo,
  init?: RequestInit,
): Promise<T> {
  const response = await fetch(
    resolveApiInput(input),
    withDefaultHeaders(init),
  );
  if (!response.ok) {
    const errorBody = (await response
      .json()
      .catch(() => null)) as ApiErrorEnvelope | null;
    throw new Error(getApiErrorMessage(response.status, errorBody));
  }
  const responseBody = (await response.json()) as ApiSuccessEnvelope<T>;
  return responseBody.data;
}

/**
 * Fetch endpoint expected to return no response body (e.g., HTTP 204).
 */
export async function fetchNoContent(
  input: RequestInfo,
  init?: RequestInit,
): Promise<void> {
  const response = await fetch(
    resolveApiInput(input),
    withDefaultHeaders(init),
  );
  if (!response.ok) {
    const errorBody = (await response
      .json()
      .catch(() => null)) as ApiErrorEnvelope | null;
    throw new Error(getApiErrorMessage(response.status, errorBody));
  }
}
