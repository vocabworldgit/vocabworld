'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Loader2, RefreshCw } from 'lucide-react'

export default function DebugSubscription() {
  const { user, subscription, isPremium, refreshSubscription } = useAuth()
  const [debugData, setDebugData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState('')

  const fetchDebugData = async () => {
    if (!user?.id) return

    setLoading(true)
    try {
      const response = await fetch(`/api/debug/subscription?userId=${user.id}`)
      const data = await response.json()
      setDebugData(data)
    } catch (error) {
      console.error('Error fetching debug data:', error)
    } finally {
      setLoading(false)
    }
  }

  const performAction = async (action: string) => {
    if (!user?.id) return

    setActionLoading(action)
    try {
      const response = await fetch('/api/debug/subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, action })
      })
      
      const result = await response.json()
      console.log('Action result:', result)
      
      // Refresh both debug data and auth state
      await Promise.all([
        fetchDebugData(),
        refreshSubscription()
      ])
    } catch (error) {
      console.error('Error performing action:', error)
    } finally {
      setActionLoading('')
    }
  }

  useEffect(() => {
    fetchDebugData()
  }, [user?.id])

  if (!user) {
    return (
      <div className="container max-w-4xl mx-auto p-6">
        <Card>
          <CardContent className="pt-6">
            <p>Please sign in to debug subscription status.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Subscription Debug</h1>
        <div className="flex gap-2">
          <Button 
            onClick={fetchDebugData} 
            disabled={loading}
            variant="outline"
            size="sm"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            Refresh
          </Button>
          <Button 
            onClick={refreshSubscription}
            variant="outline"
            size="sm"
          >
            Refresh Auth
          </Button>
        </div>
      </div>

      {/* Current Auth State */}
      <Card>
        <CardHeader>
          <CardTitle>Current Auth State</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">User ID:</label>
              <p className="text-sm font-mono bg-gray-100 p-2 rounded">{user.id}</p>
            </div>
            <div>
              <label className="text-sm font-medium">Email:</label>
              <p className="text-sm bg-gray-100 p-2 rounded">{user.email}</p>
            </div>
            <div>
              <label className="text-sm font-medium">Is Premium:</label>
              <Badge variant={isPremium ? "default" : "secondary"}>
                {isPremium ? "YES" : "NO"}
              </Badge>
            </div>
            <div>
              <label className="text-sm font-medium">Subscription Status:</label>
              <Badge variant="outline">
                {subscription?.status || "NONE"}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Debug Data */}
      {debugData && (
        <Card>
          <CardHeader>
            <CardTitle>Debug Data</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="text-xs bg-gray-100 p-4 rounded overflow-auto">
              {JSON.stringify(debugData, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}

      {/* Test Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Test Actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Button 
              onClick={() => performAction('grant_premium')}
              disabled={!!actionLoading}
              variant="default"
            >
              {actionLoading === 'grant_premium' && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              Grant Premium (Test)
            </Button>
            <Button 
              onClick={() => performAction('revoke_premium')}
              disabled={!!actionLoading}
              variant="destructive"
            >
              {actionLoading === 'revoke_premium' && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              Revoke Premium
            </Button>
          </div>
          <p className="text-sm text-gray-600">
            Use these buttons to manually test premium access. This simulates what should happen after a successful Stripe payment.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}