'use client';

import { useAuth } from 'react-oidc-context';
import { useEffect } from 'react';

const cognitoDomain = 'https://eu-west-2s533x2p21.auth.eu-west-2.amazoncognito.com';
const clientId = '7r3sa4mqqamdrd8idrrtu89g95';
const logoutUri = 'https://dashboard.ingeniumdesigns.co.uk';

interface AuthGateProps {
  children: React.ReactNode;
}

export default function AuthGate({ children }: AuthGateProps) {
  const auth = useAuth();

  // Handle the OIDC callback redirect (exchange code for tokens)
  useEffect(() => {
    if (auth.isLoading) return;

    // If we're returning from Cognito with a ?code= param, signinCallback handles it
    const hasCodeInUrl = window.location.search.includes('code=');
    if (hasCodeInUrl && !auth.isAuthenticated) {
      // The AuthProvider handles this automatically, but clean the URL afterward
      return;
    }

    // Clean up the URL after successful authentication
    if (auth.isAuthenticated && window.location.search.includes('code=')) {
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [auth.isLoading, auth.isAuthenticated]);

  // Cognito requires a specific logout URL format
  function signOutRedirect() {
    const logoutUrl =
      `${cognitoDomain}/logout?` +
      `client_id=${clientId}&` +
      `logout_uri=${encodeURIComponent(logoutUri)}`;
    window.location.href = logoutUrl;
  }

  if (auth.isLoading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-[#0f0f14]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-3 border-[#3b82f6]/30 border-t-[#3b82f6] rounded-full animate-spin" />
          <p className="text-gray-400 text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  if (auth.error) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-[#0f0f14]">
        <div className="flex flex-col items-center gap-4 max-w-md text-center">
          <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center">
            <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <p className="text-red-400 text-sm">Authentication error: {auth.error.message}</p>
          <button
            onClick={() => auth.signinRedirect()}
            className="px-4 py-2 bg-[#3b82f6] text-white text-sm rounded-lg hover:bg-[#2563eb] transition-colors"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  if (!auth.isAuthenticated) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-[#0f0f14]">
        <div className="flex flex-col items-center gap-6 max-w-sm text-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#3b82f6] to-[#8b5cf6] flex items-center justify-center">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white mb-2">Life OS Dashboard</h1>
            <p className="text-gray-400 text-sm">Sign in to access your personal dashboard</p>
          </div>
          <button
            onClick={() => auth.signinRedirect()}
            className="w-full px-6 py-3 bg-gradient-to-r from-[#3b82f6] to-[#8b5cf6] text-white font-medium rounded-xl hover:opacity-90 transition-opacity"
          >
            Sign In
          </button>
        </div>
      </div>
    );
  }

  // Authenticated — render the dashboard
  return (
    <>
      {children}
      {/* Debug panel: uncomment during development to see tokens */}
      {/* <TokenDebugPanel /> */}
    </>
  );
}

/**
 * Token debug panel — matches Cognito Quick Setup Guide output.
 * Uncomment the <TokenDebugPanel /> above to see tokens during dev.
 */
export function TokenDebugPanel() {
  const auth = useAuth();

  if (!auth.isAuthenticated || !auth.user) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-[#1a1a22] border-t border-[#2a2a33] p-4 max-h-[40vh] overflow-auto z-50">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-white">Cognito Tokens (Debug)</h3>
        <p className="text-xs text-gray-400">
          Hello, {auth.user.profile.email ?? auth.user.profile.sub}
        </p>
      </div>
      <div className="space-y-3">
        <TokenBlock label="ID Token" token={auth.user.id_token} />
        <TokenBlock label="Access Token" token={auth.user.access_token} />
        <TokenBlock label="Refresh Token" token={auth.user.refresh_token} />
      </div>
    </div>
  );
}

function TokenBlock({ label, token }: { label: string; token?: string }) {
  return (
    <div>
      <p className="text-xs font-medium text-[#3b82f6] mb-1">{label}</p>
      <pre className="text-[10px] text-gray-400 bg-[#0f0f14] rounded-lg p-2 overflow-x-auto whitespace-pre-wrap break-all">
        {token ?? 'N/A'}
      </pre>
    </div>
  );
}
