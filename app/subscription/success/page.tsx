'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Check, Loader2 } from 'lucide-react'
import { useAuth } from '@/contexts/auth-context'

export default function SubscriptionSuccess() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { refreshSubscription } = useAuth()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const sessionId = searchParams.get('session_id')
    
    if (sessionId) {
      // Refresh subscription data and redirect after a short delay
      const handleSuccess = async () => {
        try {
          await refreshSubscription()
        } catch (error) {
          console.error('Error refreshing subscription:', error)
        } finally {
          setLoading(false)
          
          // Redirect to main app after 3 seconds
          setTimeout(() => {
            router.push('/')
          }, 3000)
        }
      }

      handleSuccess()
    } else {
      setLoading(false)
    }
  }, [searchParams, refreshSubscription, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="pt-6">
            <div className="text-center">
              <Loader2 className="w-12 h-12 mx-auto text-green-500 animate-spin mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Setting up your subscription...
              </h2>
              <p className="text-gray-600">
                Please wait while we activate your premium access.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50">
      <Card className="w-full max-w-md mx-4">
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="w-8 h-8 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">
            Welcome to Premium!
          </CardTitle>
        </CardHeader>
        
        <CardContent className="text-center space-y-4">
          <p className="text-gray-600">
            Your subscription has been activated successfully. You now have access to all vocabulary topics and premium features.
          </p>
          
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h3 className="font-semibold text-green-800 mb-2">What's unlocked:</h3>
            <ul className="text-sm text-green-700 space-y-1">
              <li>✓ All vocabulary topics</li>
              <li>✓ Daily reminder notifications</li>
              <li>✓ Progress tracking</li>
              <li>✓ Unlimited practice sessions</li>
              <li>✓ Offline access</li>
            </ul>
          </div>

          <div className="pt-4">
            <Button 
              onClick={() => router.push('/')}
              className="w-full bg-green-500 hover:bg-green-600 text-white"
              size="lg"
            >
              Start Learning
            </Button>
          </div>

          <p className="text-xs text-gray-500">
            Redirecting automatically in a few seconds...
          </p>
        </CardContent>
      </Card>
    </div>
  )
}