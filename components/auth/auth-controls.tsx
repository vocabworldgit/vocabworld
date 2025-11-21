'use client'

import { useAuth } from '@/contexts/auth-context'
import { Button } from '@/components/ui/button'

export function AuthControls() {
  const { user, signOut, loading } = useAuth()

  if (!user) {
    return null
  }

  return (
    <div className="fixed top-4 right-4 z-40">
      <div className="bg-white/10 backdrop-blur-md rounded-lg p-4 text-white">
        <div className="text-sm mb-2">
          Signed in as: <span className="font-medium">{user.email}</span>
        </div>
        <Button
          onClick={signOut}
          disabled={loading}
          variant="outline"
          size="sm"
          className="bg-white/20 hover:bg-white/30 text-white border-white/30"
        >
          {loading ? 'Signing out...' : 'Sign Out'}
        </Button>
      </div>
    </div>
  )
}