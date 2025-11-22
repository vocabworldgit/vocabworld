import { NextRequest, NextResponse } from 'next/server'
import { progressService } from '@/lib/progress/progress-service'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const userId = searchParams.get('userId')
  const targetLanguageCode = searchParams.get('targetLanguageCode')
  if (!userId || !targetLanguageCode) {
    return NextResponse.json({ error: 'Missing parameters' }, { status: 400 })
  }
  const stats = await progressService.getProgressStats(userId, targetLanguageCode)
  return NextResponse.json(stats)
}
