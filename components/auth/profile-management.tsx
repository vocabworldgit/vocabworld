'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { User, Mail, Globe, Crown, Calendar, Settings } from 'lucide-react'
import { updateLearningLanguages } from '@/lib/auth/user-profile'

const LANGUAGES = [
  { code: 'es', name: 'Spanish' },
  { code: 'fr', name: 'French' },
  { code: 'de', name: 'German' },
  { code: 'it', name: 'Italian' },
  { code: 'pt', name: 'Portuguese' },
  { code: 'nl', name: 'Dutch' },
  { code: 'ru', name: 'Russian' },
  { code: 'zh', name: 'Chinese' },
  { code: 'ja', name: 'Japanese' },
  { code: 'ko', name: 'Korean' },
  { code: 'ar', name: 'Arabic' },
  { code: 'hi', name: 'Hindi' },
  { code: 'tr', name: 'Turkish' }
]

interface ProfileManagementProps {
  showTitle?: boolean
}

export function ProfileManagement({ showTitle = true }: ProfileManagementProps) {
  const { user, updateProfile, loading } = useAuth()
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    full_name: user?.profile?.full_name || '',
    preferred_language: user?.profile?.preferred_language || 'en',
    learning_languages: user?.profile?.learning_languages || []
  })

  if (loading) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardContent className="pt-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!user) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardContent className="pt-6">
          <div className="text-center text-gray-500">
            Please sign in to view your profile
          </div>
        </CardContent>
      </Card>
    )
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await updateProfile(formData)
      
      // Update learning languages separately
      if (user.id) {
        await updateLearningLanguages(user.id, formData.learning_languages)
      }
      
      setEditing(false)
    } catch (error) {
      console.error('Error updating profile:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    setFormData({
      full_name: user?.profile?.full_name || '',
      preferred_language: user?.profile?.preferred_language || 'en',
      learning_languages: user?.profile?.learning_languages || []
    })
    setEditing(false)
  }

  const toggleLearningLanguage = (languageCode: string) => {
    const languages = formData.learning_languages.includes(languageCode)
      ? formData.learning_languages.filter(lang => lang !== languageCode)
      : [...formData.learning_languages, languageCode]
    
    setFormData({ ...formData, learning_languages: languages })
  }

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      {showTitle && (
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Profile Management</h1>
          <p className="text-gray-600">Manage your account settings and preferences</p>
        </div>
      )}

      {/* Profile Overview */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {user.profile?.avatar_url ? (
                <img 
                  src={user.profile.avatar_url} 
                  alt="Profile" 
                  className="w-16 h-16 rounded-full"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center">
                  <User className="w-8 h-8 text-gray-500" />
                </div>
              )}
              <div>
                <CardTitle className="text-xl">
                  {user.profile?.full_name || 'Anonymous User'}
                </CardTitle>
                <CardDescription>{user.email}</CardDescription>
              </div>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setEditing(!editing)}
              disabled={saving}
            >
              <Settings className="w-4 h-4 mr-2" />
              {editing ? 'Cancel' : 'Edit'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <Mail className="w-4 h-4" />
              <span>{user.email}</span>
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <Calendar className="w-4 h-4" />
              <span>Member since {new Date(user.profile?.created_at || '').toLocaleDateString()}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Crown className="w-4 h-4" />
              <Badge variant={user.profile?.subscription_status === 'premium' ? 'default' : 'secondary'}>
                {user.profile?.subscription_status || 'Free'}
              </Badge>
            </div>
            <div className="flex items-center space-x-2">
              <Globe className="w-4 h-4" />
              <Badge variant="outline">
                {user.profile?.provider || 'Email'}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Profile Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Profile Settings</CardTitle>
          <CardDescription>Update your personal information and preferences</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="full_name">Full Name</Label>
            <Input
              id="full_name"
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              disabled={!editing}
              placeholder="Enter your full name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="preferred_language">Preferred Language</Label>
            <Select
              value={formData.preferred_language}
              onValueChange={(value) => setFormData({ ...formData, preferred_language: value })}
              disabled={!editing}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select your preferred language" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en">English</SelectItem>
                {LANGUAGES.map((lang) => (
                  <SelectItem key={lang.code} value={lang.code}>
                    {lang.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Learning Languages</Label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {LANGUAGES.map((lang) => (
                <Button
                  key={lang.code}
                  variant={formData.learning_languages.includes(lang.code) ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => toggleLearningLanguage(lang.code)}
                  disabled={!editing}
                  className="justify-start"
                >
                  {lang.name}
                </Button>
              ))}
            </div>
          </div>

          {editing && (
            <>
              <Separator />
              <div className="flex space-x-2 justify-end">
                <Button variant="outline" onClick={handleCancel} disabled={saving}>
                  Cancel
                </Button>
                <Button onClick={handleSave} disabled={saving}>
                  {saving ? (
                    <div className="flex items-center space-x-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                      <span>Saving...</span>
                    </div>
                  ) : (
                    'Save Changes'
                  )}
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}