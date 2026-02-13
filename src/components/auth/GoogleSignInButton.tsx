'use client'

import { GoogleLogin, useGoogleOAuth } from '@react-oauth/google'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

function GoogleSignInButtonInner() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleGoogleSuccess = async (credentialResponse: { credential?: string }) => {
    if (!credentialResponse.credential) {
      setError('No credential received from Google')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/auth/google', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          credential: credentialResponse.credential,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Authentication failed')
      }

      // Redirect to dashboard on success
      router.push('/dashboard')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed. Please try again.')
      console.error('Authentication error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleError = () => {
    setError('Google authentication failed. Please try again.')
  }

  return (
    <div className="space-y-3">
      {error && (
        <div className="p-3 bg-red-50 border border-red-100 rounded-lg text-red-600 text-sm text-center">
          {error}
        </div>
      )}
      
      <div className="flex justify-center">
        <GoogleLogin
          onSuccess={handleGoogleSuccess}
          onError={handleGoogleError}
          useOneTap={false}
          theme="outline"
          size="large"
          width="300"
          text="signin_with"
          shape="rectangular"
        />
      </div>

      {isLoading && (
        <div className="flex items-center justify-center gap-2 text-gray-500 text-sm">
          <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          Signing you in...
        </div>
      )}
    </div>
  )
}

export function GoogleSignInButton() {
  // Check if we're inside the GoogleOAuthProvider
  try {
    // This will throw if not inside provider
    useGoogleOAuth()
    return <GoogleSignInButtonInner />
  } catch {
    // Not inside provider - show configuration message
    return (
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-800 text-sm text-center">
        <p className="font-medium">Google OAuth not configured</p>
        <p className="mt-1 text-xs">Please set NEXT_PUBLIC_GOOGLE_CLIENT_ID in your environment variables.</p>
      </div>
    )
  }
}
