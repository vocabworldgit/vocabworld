import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  console.log('🔔 Webhook test endpoint hit!')
  console.log('Headers:', Object.fromEntries(request.headers.entries()))
  
  const body = await request.text()
  console.log('Body:', body)
  
  return NextResponse.json({ 
    received: true,
    timestamp: new Date().toISOString()
  })
}

export async function GET(request: NextRequest) {
  return NextResponse.json({ 
    status: 'Webhook endpoint is accessible',
    timestamp: new Date().toISOString()
  })
}
