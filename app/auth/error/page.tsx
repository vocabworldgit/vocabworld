"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AlertTriangle } from 'lucide-react'
import Link from 'next/link'

export default function AuthErrorPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <AlertTriangle className="h-12 w-12 text-red-500" />
          </div>
          <CardTitle className="text-2xl font-bold text-red-600">
            Authentication Error
          </CardTitle>
          <CardDescription>
            Sorry, there was a problem signing you in. Please try again.
          </CardDescription>
        </CardHeader>
        
        <CardContent className="text-center">
          <Button asChild className="w-full">
            <Link href="/">
              Return to Home
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}