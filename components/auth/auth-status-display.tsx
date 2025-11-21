'use client'

import { useAuth } from '@/contexts/auth-context'

export function AuthStatusDisplay() {
  const { user, loading, signOut } = useAuth()

  const clearSession = () => {
    // Clear all Supabase session data from localStorage
    Object.keys(localStorage).forEach(key => {
      if (key.includes('supabase')) {
        localStorage.removeItem(key)
      }
    })
    // Reload the page
    window.location.reload()
  }

  return (
    <div className="fixed top-4 left-4 z-50 bg-black/80 text-white p-4 rounded-lg text-sm">
      <h3 className="font-bold mb-2">🔍 Auth Status</h3>
      <div className="space-y-1 mb-3">
        <div>Loading: <span className="text-yellow-300">{loading ? 'YES' : 'NO'}</span></div>
        <div>User: <span className="text-green-300">{user ? user.email : 'NONE'}</span></div>
        <div>Should show welcome: <span className="text-blue-300">{!loading && !user ? 'YES' : 'NO'}</span></div>
      </div>
      <div className="space-y-2">
        {user && (
          <button 
            onClick={signOut}
            className="bg-red-600 hover:bg-red-700 px-2 py-1 rounded text-xs w-full"
          >
            Sign Out
          </button>
        )}
        <button 
          onClick={clearSession}
          className="bg-orange-600 hover:bg-orange-700 px-2 py-1 rounded text-xs w-full"
        >
          Clear Session
        </button>
      </div>
    </div>
  )
}