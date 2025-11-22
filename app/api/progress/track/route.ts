import { NextRequest, NextResponse } from 'next/server'
import { progressService } from '@/lib/progress/progress-service'

export async function POST(request: NextRequest) {
  const { userId, vocabularyId, targetLanguageCode } = await request.json()
  if (!userId || !vocabularyId || !targetLanguageCode) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }
  const result = await progressService.trackWordPlayed(userId, vocabularyId, targetLanguageCode)
  return NextResponse.json(result)
}
