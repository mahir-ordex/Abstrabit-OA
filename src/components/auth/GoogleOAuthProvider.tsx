'use client'

import { GoogleOAuthProvider as Provider } from '@react-oauth/google'

export function GoogleOAuthProvider({ children }: { children: React.ReactNode }) {
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID

  if (!clientId) {
    // During build or when clientId is not set, render children without provider
    // The GoogleSignInButton will show an error message
    return <>{children}</>
  }

  return (
    <Provider clientId={clientId}>
      {children}
    </Provider>
  )
}
