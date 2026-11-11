import * as Sentry from '@sentry/react';

export function initializeErrorReporting() {
  const dsn = import.meta.env.VITE_SENTRY_DSN;
  if (!dsn || import.meta.env.MODE === 'test') return;
  Sentry.init({ dsn, defaultIntegrations: false, tracesSampleRate: 0,
    dataCollection: { userInfo: false, cookies: false, httpHeaders: false, httpBodies: [],
      urlQueryParams: false, databaseQueryData: false, queues: false, stackFrameVariables: false,
      frameContextLines: 0, graphQL: { document: false, variables: false },
      genAI: { inputs: false, outputs: false }, mcp: { inputs: false, outputs: false } },
    beforeSend: event => ({ type: undefined, event_id: event.event_id, timestamp: event.timestamp,
      platform: event.platform, level: 'error', message: 'Falha da interface' }),
  });
  const report = () => { Sentry.captureMessage('Falha da interface', 'error'); };
  window.addEventListener('error', report);
  window.addEventListener('unhandledrejection', report);
}
