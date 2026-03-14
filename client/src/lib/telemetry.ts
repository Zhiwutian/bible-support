type TelemetryPayload = Record<string, unknown>;

export type AppTelemetryEvent = {
  name: string;
  payload?: TelemetryPayload;
  timestamp: string;
};

/**
 * Emit lightweight app telemetry events. This is vendor-neutral by design:
 * listeners can subscribe to the browser event and forward externally.
 */
export function trackEvent(name: string, payload?: TelemetryPayload): void {
  const event: AppTelemetryEvent = {
    name,
    payload,
    timestamp: new Date().toISOString(),
  };
  window.dispatchEvent(
    new CustomEvent<AppTelemetryEvent>('app:telemetry', { detail: event }),
  );
}
