'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { AuthCard } from '@/components/auth/auth-card'
import { ProfileManagement } from '@/components/auth/profile-management'
import { AuthSystemTest } from '@/components/auth/auth-system-test'
import { 
  User, 
  Smartphone, 
  Globe, 
  Check, 
  X, 
  AlertTriangle,
  RefreshCw,
  Settings
} from 'lucide-react'

export default function AuthTestPage() {
  const { user, loading, refreshUser } = useAuth()
  const [activeTab, setActiveTab] = useState<'signin' | 'profile' | 'debug' | 'system'>('system')

  const platformInfo = {
    userAgent: typeof window !== 'undefined' ? navigator.userAgent : 'Server',
    isIOS: typeof window !== 'undefined' ? /iPad|iPhone|iPod/.test(navigator.userAgent) : false,
    isAndroid: typeof window !== 'undefined' ? /Android/.test(navigator.userAgent) : false,
    isMobile: typeof window !== 'undefined' ? /Mobi|Android/i.test(navigator.userAgent) : false,
    isCapacitor: typeof window !== 'undefined' && !!(window as any).Capacitor || false
  }

  const authInfo = {
    hasUser: !!user,
    userId: user?.id || 'None',
    email: user?.email || 'None',
    provider: user?.profile?.provider || 'None',
    profileCreated: user?.profile?.created_at || 'None',
    lastSignIn: user?.profile?.last_sign_in || 'None'
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">🧪 Authentication Test Lab</h1>
          <p className="text-gray-600">Test Google & Apple sign-in across different platforms</p>
        </div>

        {/* Status Bar */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  {loading ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500" />
                  ) : user ? (
                    <Check className="w-5 h-5 text-green-500" />
                  ) : (
                    <X className="w-5 h-5 text-red-500" />
                  )}
                  <span className="font-medium">
                    {loading ? 'Loading...' : user ? 'Authenticated' : 'Not Authenticated'}
                  </span>
                </div>
                {user && (
                  <Badge variant="outline">
                    {user.profile?.provider || 'Unknown'}
                  </Badge>
                )}
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={refreshUser}
                disabled={loading}
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Tab Navigation */}
        <div className="flex space-x-2">
          <Button
            variant={activeTab === 'system' ? 'default' : 'outline'}
            onClick={() => setActiveTab('system')}
          >
            System Check
          </Button>
          <Button
            variant={activeTab === 'signin' ? 'default' : 'outline'}
            onClick={() => setActiveTab('signin')}
          >
            Sign In Test
          </Button>
          <Button
            variant={activeTab === 'profile' ? 'default' : 'outline'}
            onClick={() => setActiveTab('profile')}
            disabled={!user}
          >
            Profile Test
          </Button>
          <Button
            variant={activeTab === 'debug' ? 'default' : 'outline'}
            onClick={() => setActiveTab('debug')}
          >
            Debug Info
          </Button>
        </div>

        {/* Tab Content */}
        {activeTab === 'system' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-center">System Health Check</h2>
            <AuthSystemTest />
          </div>
        )}

        {activeTab === 'signin' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Sign In Component */}
            <div className="space-y-4">
              <h2 className="text-2xl font-bold">Authentication Test</h2>
              <AuthCard />
            </div>

            {/* Platform Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Smartphone className="w-5 h-5" />
                  <span>Platform Detection</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex justify-between">
                    <span>iOS Device:</span>
                    <Badge variant={platformInfo.isIOS ? 'default' : 'secondary'}>
                      {platformInfo.isIOS ? 'Yes' : 'No'}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Android Device:</span>
                    <Badge variant={platformInfo.isAndroid ? 'default' : 'secondary'}>
                      {platformInfo.isAndroid ? 'Yes' : 'No'}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Mobile Device:</span>
                    <Badge variant={platformInfo.isMobile ? 'default' : 'secondary'}>
                      {platformInfo.isMobile ? 'Yes' : 'No'}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Capacitor:</span>
                    <Badge variant={platformInfo.isCapacitor ? 'default' : 'secondary'}>
                      {platformInfo.isCapacitor ? 'Yes' : 'No'}
                    </Badge>
                  </div>
                </div>
                <Separator />
                <div className="text-xs text-gray-500 break-all">
                  <strong>User Agent:</strong> {platformInfo.userAgent}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'profile' && user && (
          <ProfileManagement showTitle={false} />
        )}

        {activeTab === 'debug' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Authentication Debug */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <User className="w-5 h-5" />
                  <span>Authentication State</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2 text-sm">
                  {Object.entries(authInfo).map(([key, value]) => (
                    <div key={key} className="flex justify-between">
                      <span className="font-medium capitalize">{key.replace(/([A-Z])/g, ' $1')}:</span>
                      <span className="text-gray-600 truncate max-w-48">{value}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Environment Variables */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Settings className="w-5 h-5" />
                  <span>Environment Check</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Supabase URL:</span>
                    <Badge variant={process.env.NEXT_PUBLIC_SUPABASE_URL ? 'default' : 'destructive'}>
                      {process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Set' : 'Missing'}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Supabase Key:</span>
                    <Badge variant={process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'default' : 'destructive'}>
                      {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Set' : 'Missing'}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Google Client ID:</span>
                    <Badge variant={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ? 'default' : 'destructive'}>
                      {process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ? 'Set' : 'Missing'}
                    </Badge>
                  </div>
                </div>
                
                {(!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) && (
                  <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                    <div className="flex items-center space-x-2">
                      <AlertTriangle className="w-4 h-4 text-yellow-600" />
                      <span className="text-sm font-medium text-yellow-800">
                        Environment Setup Required
                      </span>
                    </div>
                    <p className="text-sm text-yellow-700 mt-1">
                      Create a `.env.local` file with your Supabase and OAuth credentials.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Test Instructions */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Testing Instructions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3 text-sm">
                  <div>
                    <h4 className="font-semibold text-green-700">✅ Web Testing (Chrome/Safari)</h4>
                    <p className="text-gray-600">
                      Test Google & Apple OAuth redirects. Signs in via browser popup/redirect.
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-blue-700">📱 Mobile Testing (Capacitor)</h4>
                    <p className="text-gray-600">
                      Run `npx cap run android` or `npx cap run ios` to test native authentication.
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-purple-700">🔄 Profile Testing</h4>
                    <p className="text-gray-600">
                      After signing in, test profile updates and learning language preferences.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}