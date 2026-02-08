'use client';

import { ReactNode } from 'react';
import { AuthProvider as OidcAuthProvider } from 'react-oidc-context';
import type { WebStorageStateStore } from 'oidc-client-ts';

const cognitoDomain = 'https://eu-west-2s533x2p21.auth.eu-west-2.amazoncognito.com';
const clientId = '7r3sa4mqqamdrd8idrrtu89g95';
const redirectUri = 'https://dashboard.ingeniumdesigns.co.uk';

const oidcConfig = {
  authority: cognitoDomain,
  client_id: clientId,
  redirect_uri: redirectUri,
  response_type: 'code',
  scope: 'openid email profile',
  post_logout_redirect_uri: redirectUri,
  // Use sessionStorage so tokens survive page refreshes but not new tabs
  userStore: typeof window !== 'undefined'
    ? new (require('oidc-client-ts').WebStorageStateStore)({ store: window.sessionStorage }) as WebStorageStateStore
    : undefined,
};

export function AuthProvider({ children }: { children: ReactNode }) {
  return (
    <OidcAuthProvider {...oidcConfig}>
      {children}
    </OidcAuthProvider>
  );
}
