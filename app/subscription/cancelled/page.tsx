'use client'

import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { X, ArrowLeft } from 'lucide-react'

export default function SubscriptionCancelled() {
  const router = useRouter()

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-blue-50">
      <Card className="w-full max-w-md mx-4">
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
            <X className="w-8 h-8 text-gray-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">
            Subscription Cancelled
          </CardTitle>
        </CardHeader>
        
        <CardContent className="text-center space-y-4">
          <p className="text-gray-600">
            No worries! You can still access the free vocabulary topics and upgrade anytime when you're ready.
          </p>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-800 mb-2">Available for free:</h3>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>✓ Greetings vocabulary topic</li>
              <li>✓ Basic practice sessions</li>
              <li>✓ Core learning features</li>
            </ul>
          </div>

          <div className="pt-4 space-y-3">
            <Button 
              onClick={() => router.push('/')}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white"
              size="lg"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Continue Learning
            </Button>
            
            <Button 
              onClick={() => router.push('/')}
              variant="outline"
              className="w-full border-gray-300 text-gray-700 hover:bg-gray-50"
              size="lg"
            >
              Try Premium Later
            </Button>
          </div>

          <p className="text-xs text-gray-500">
            Premium features are just a click away whenever you're ready!
          </p>
        </CardContent>
      </Card>
    </div>
  )
}