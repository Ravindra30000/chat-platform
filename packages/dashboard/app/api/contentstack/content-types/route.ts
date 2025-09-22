mport { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  try {
    const cookieStore = cookies()
    const token = cookieStore.get('contentstack_token')?.value

    if (!token) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const stack = searchParams.get('stack')

    if (!stack) {
      return NextResponse.json({ error: 'Stack ID required' }, { status: 400 })
    }

    const response = await fetch(`https://api.contentstack.io/v3/content_types`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'api_key': stack,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch content types: ${response.statusText}`)
    }

    const data = await response.json()
    const contentTypes = data.content_types.map((ct: any) => ({
      uid: ct.uid,
      title: ct.title,
      schema: ct.schema,
    }))

    return NextResponse.json({ contentTypes })
  } catch (error) {
    console.error('Error fetching content types:', error)
    return NextResponse.json({ error: 'Failed to fetch content types' }, { status: 500 })
  }
}