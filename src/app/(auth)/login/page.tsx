import { GoogleSignInButton } from '@/components/auth/GoogleSignInButton'

// Force dynamic rendering to ensure env vars are available at runtime
export const dynamic = 'force-dynamic'

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-2xl shadow-sm border border-gray-100">
        <div className="text-center space-y-2">
          <div className="flex justify-center">
            <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center">
              <svg 
                className="w-6 h-6 text-white" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" 
                />
              </svg>
            </div>
          </div>
          <h2 className="text-2xl font-bold text-gray-900">
            Smart Bookmarks
          </h2>
          <p className="text-gray-500 text-sm">
            Save and organize your favorite links
          </p>
        </div>

        <div className="space-y-4">
          <GoogleSignInButton />
          <p className="text-center text-xs text-gray-400">
            Sign in to access your bookmarks from anywhere
          </p>
        </div>
      </div>
    </div>
  )
}
