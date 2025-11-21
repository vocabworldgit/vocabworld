'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Search, 
  User, 
  CreditCard, 
  Activity, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  DollarSign,
  Calendar,
  Users
} from 'lucide-react'

interface UserSubscription {
  id: string
  userId: string
  userEmail: string
  userName: string
  status: string
  planType: string
  currentPeriodStart: string
  currentPeriodEnd: string
  stripeCustomerId: string
  stripeSubscriptionId: string
  createdAt: string
  updatedAt: string
}

interface SubscriptionEvent {
  id: string
  userId: string
  userEmail: string
  eventType: string
  eventData: any
  createdAt: string
}

interface AdminStats {
  totalUsers: number
  activeSubscriptions: number
  freeUsers: number
  monthlyRevenue: number
  yearlyRevenue: number
  churnRate: number
}

export default function AdminDashboard() {
  const [searchUserId, setSearchUserId] = useState('')
  const [searchResults, setSearchResults] = useState<UserSubscription[]>([])
  const [recentEvents, setRecentEvents] = useState<SubscriptionEvent[]>([])
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Load dashboard stats on mount
  useEffect(() => {
    loadDashboardStats()
    loadRecentEvents()
  }, [])

  const loadDashboardStats = async () => {
    try {
      const response = await fetch('/api/admin/stats')
      if (!response.ok) throw new Error('Failed to load stats')
      const data = await response.json()
      setStats(data)
    } catch (error) {
      console.error('Error loading stats:', error)
    }
  }

  const loadRecentEvents = async () => {
    try {
      const response = await fetch('/api/admin/events?limit=20')
      if (!response.ok) throw new Error('Failed to load events')
      const data = await response.json()
      setRecentEvents(data.events)
    } catch (error) {
      console.error('Error loading events:', error)
    }
  }

  const searchUser = async () => {
    if (!searchUserId.trim()) return

    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/admin/user-search?query=${encodeURIComponent(searchUserId.trim())}`)
      if (!response.ok) throw new Error('Failed to search user')
      
      const data = await response.json()
      setSearchResults(data.users)
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Search failed')
      setSearchResults([])
    } finally {
      setLoading(false)
    }
  }

  const updateSubscription = async (userId: string, action: string, data?: any) => {
    try {
      const response = await fetch('/api/admin/subscription-update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, action, data })
      })

      if (!response.ok) throw new Error('Failed to update subscription')

      // Refresh search results
      await searchUser()
      await loadDashboardStats()
      
      alert(`Subscription ${action} successful`)
    } catch (error) {
      alert(`Error: ${error instanceof Error ? error.message : 'Update failed'}`)
    }
  }

  const getStatusBadge = (status: string) => {
    const statusMap = {
      active: { variant: 'default', icon: CheckCircle, color: 'text-green-600' },
      trialing: { variant: 'secondary', icon: Clock, color: 'text-blue-600' },
      past_due: { variant: 'destructive', icon: AlertTriangle, color: 'text-yellow-600' },
      canceled: { variant: 'outline', icon: XCircle, color: 'text-gray-600' },
      free: { variant: 'outline', icon: User, color: 'text-gray-600' }
    }
    
    const config = statusMap[status as keyof typeof statusMap] || statusMap.free
    const Icon = config.icon
    
    return (
      <Badge variant={config.variant as any} className="flex items-center gap-1">
        <Icon className={`w-3 h-3 ${config.color}`} />
        {status.toUpperCase()}
      </Badge>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="text-gray-600">Manage subscriptions and monitor system health</p>
          </div>
          <Badge variant="outline" className="text-xs">
            Last updated: {new Date().toLocaleTimeString()}
          </Badge>
        </div>

        {/* Stats Overview */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="text-2xl font-bold">{stats.totalUsers}</p>
                    <p className="text-sm text-gray-600">Total Users</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <div>
                    <p className="text-2xl font-bold">{stats.activeSubscriptions}</p>
                    <p className="text-sm text-gray-600">Active Subscriptions</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-purple-600" />
                  <div>
                    <p className="text-2xl font-bold">${stats.monthlyRevenue}</p>
                    <p className="text-sm text-gray-600">Monthly Revenue</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Activity className="w-5 h-5 text-red-600" />
                  <div>
                    <p className="text-2xl font-bold">{stats.churnRate}%</p>
                    <p className="text-sm text-gray-600">Churn Rate</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <Tabs defaultValue="search" className="space-y-4">
          <TabsList>
            <TabsTrigger value="search">User Search</TabsTrigger>
            <TabsTrigger value="events">Recent Events</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          {/* User Search Tab */}
          <TabsContent value="search" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Search className="w-5 h-5" />
                  User Search
                </CardTitle>
                <CardDescription>
                  Search by user ID, email, or name to manage subscriptions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4 mb-4">
                  <Input
                    placeholder="Enter user ID, email, or name..."
                    value={searchUserId}
                    onChange={(e) => setSearchUserId(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && searchUser()}
                    className="flex-1"
                  />
                  <Button onClick={searchUser} disabled={loading}>
                    {loading ? 'Searching...' : 'Search'}
                  </Button>
                </div>

                {error && (
                  <Alert variant="destructive" className="mb-4">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                {searchResults.length > 0 && (
                  <div className="space-y-4">
                    {searchResults.map((user) => (
                      <Card key={user.id} className="border-l-4 border-l-blue-500">
                        <CardContent className="p-4">
                          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                            {/* User Info */}
                            <div>
                              <h3 className="font-semibold text-lg">{user.userName || 'No Name'}</h3>
                              <p className="text-sm text-gray-600">{user.userEmail}</p>
                              <p className="text-xs text-gray-500">ID: {user.userId}</p>
                            </div>

                            {/* Subscription Info */}
                            <div>
                              <div className="flex items-center gap-2 mb-2">
                                {getStatusBadge(user.status)}
                                {user.planType && (
                                  <Badge variant="outline">{user.planType.toUpperCase()}</Badge>
                                )}
                              </div>
                              <p className="text-sm text-gray-600">
                                Period: {new Date(user.currentPeriodStart).toLocaleDateString()} - {new Date(user.currentPeriodEnd).toLocaleDateString()}
                              </p>
                              {user.stripeCustomerId && (
                                <p className="text-xs text-gray-500">
                                  Stripe: {user.stripeCustomerId}
                                </p>
                              )}
                            </div>

                            {/* Actions */}
                            <div className="space-y-2">
                              <div className="flex gap-2 flex-wrap">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => updateSubscription(user.userId, 'grant_premium', { planType: 'yearly', days: 30 })}
                                >
                                  Grant 30 Days
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => updateSubscription(user.userId, 'cancel')}
                                >
                                  Cancel
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => updateSubscription(user.userId, 'reactivate')}
                                >
                                  Reactivate
                                </Button>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Recent Events Tab */}
          <TabsContent value="events" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5" />
                  Recent Subscription Events
                </CardTitle>
                <CardDescription>
                  Monitor real-time subscription activity
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {recentEvents.map((event) => (
                    <div key={event.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <div>
                          <p className="font-medium">{event.eventType.replace('_', ' ').toUpperCase()}</p>
                          <p className="text-sm text-gray-600">{event.userEmail}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-500">
                          {new Date(event.createdAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5" />
                  Subscription Analytics
                </CardTitle>
                <CardDescription>
                  Detailed metrics and insights
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-gray-500">
                  Analytics dashboard coming soon...
                  <br />
                  <small>This will include charts, conversion rates, and detailed metrics.</small>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
