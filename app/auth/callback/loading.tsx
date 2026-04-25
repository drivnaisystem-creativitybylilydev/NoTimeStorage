/**
 * Instant shell while /auth/callback client bundle hydrates — improves
 * perceived FCP on the OAuth / magic-link handoff.
 */
export default function AuthCallbackLoading() {
  return (
    <div
      style={{
        minHeight: '100dvh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#2a1a14',
        color: '#E7D3BF',
        padding: 24,
        fontFamily: 'system-ui, -apple-system, Segoe UI, sans-serif',
        fontSize: '1rem',
      }}
    >
      <p style={{ textAlign: 'center', margin: 0 }}>Signing you in…</p>
    </div>
  );
}
