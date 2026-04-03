export function initSentry() {
  const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
  if (!dsn) return;

  import('@sentry/nextjs').then((Sentry) => {
    Sentry.init({
      dsn,
      environment: process.env.NODE_ENV || 'development',
      tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.2 : 1.0,
      replaysSessionSampleRate: 0,
      replaysOnErrorSampleRate: process.env.NODE_ENV === 'production' ? 1.0 : 0,
    });
  }).catch(() => {
    // Sentry not installed, silently skip
  });
}
