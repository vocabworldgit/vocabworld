'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/auth-context'

// Debug component to help understand auth state
export function AuthDebugger() {
  const { user, loading } = useAuth()
  const [debugInfo, setDebugInfo] = useState<any>({})

  useEffect(() => {
    const getDebugInfo = async () => {
      // Check localStorage for any session info
      const localStorageKeys = Object.keys(localStorage).filter(key => 
        key.includes('supabase') || key.includes('auth')
      )
      
      const localStorageData: any = {}
      localStorageKeys.forEach(key => {
        try {
          localStorageData[key] = JSON.parse(localStorage.getItem(key) || 'null')
        } catch {
          localStorageData[key] = localStorage.getItem(key)
        }
      })

      setDebugInfo({
        userState: user ? 'authenticated' : 'not authenticated',
        userId: user?.id || 'none',
        userEmail: user?.email || 'none',
        hasProfile: user?.profile ? 'yes' : 'no',
        loading: loading,
        localStorage: localStorageData,
        url: window.location.href,
        timestamp: new Date().toLocaleTimeString()
      })
    }

    getDebugInfo()
  }, [user, loading])

  // Only show in development
  if (process.env.NODE_ENV !== 'development') {
    return null
  }

  return (
    <div className="fixed bottom-4 right-4 bg-black/80 text-white text-xs p-4 rounded-lg max-w-md z-50">
      <h4 className="font-bold mb-2">🔍 Auth Debug</h4>
      <div className="space-y-1">
        <div>State: <span className="text-green-400">{debugInfo.userState}</span></div>
        <div>Loading: <span className="text-blue-400">{debugInfo.loading ? 'true' : 'false'}</span></div>
        <div>User ID: <span className="text-yellow-400">{debugInfo.userId}</span></div>
        <div>Email: <span className="text-purple-400">{debugInfo.userEmail}</span></div>
        <div>Profile: <span className="text-orange-400">{debugInfo.hasProfile}</span></div>
        <div>Time: <span className="text-gray-400">{debugInfo.timestamp}</span></div>
        {Object.keys(debugInfo.localStorage || {}).length > 0 && (
          <details className="mt-2">
            <summary className="cursor-pointer">LocalStorage</summary>
            <pre className="text-xs mt-1 bg-gray-800 p-2 rounded overflow-auto max-h-32">
              {JSON.stringify(debugInfo.localStorage, null, 2)}
            </pre>
          </details>
        )}
      </div>
    </div>
  )
}