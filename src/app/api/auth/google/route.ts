import { createClient } from '@/lib/supabase/server'
import { OAuth2Client } from 'google-auth-library'
import { NextResponse } from 'next/server'

const client = new OAuth2Client(process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID)

export async function POST(request: Request) {
  try {
    const { credential } = await request.json()

    if (!credential) {
      return NextResponse.json({ error: 'No credential provided' }, { status: 400 })
    }

    // Verify the Google token
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
    })

    const payload = ticket.getPayload()
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token payload' }, { status: 400 })
    }

    const { email, sub: googleId, name, picture } = payload

    if (!email) {
      return NextResponse.json({ error: 'Email not provided by Google' }, { status: 400 })
    }

    // Sign in with Supabase using the verified Google credentials
    const supabase = await createClient()
    
    // Use Supabase's signInWithIdToken to create a session
    const { data, error } = await supabase.auth.signInWithIdToken({
      provider: 'google',
      token: credential,
    })

    if (error) {
      console.error('Supabase auth error:', error)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      user: {
        id: data.user?.id,
        email: data.user?.email,
        name: data.user?.user_metadata?.full_name || name,
        picture: data.user?.user_metadata?.avatar_url || picture,
      }
    })

  } catch (error) {
    console.error('Google auth error:', error)
    
    if (error instanceof Error) {
      if (error.message.includes('Token used too early')) {
        return NextResponse.json({ error: 'Invalid token timing' }, { status: 400 })
      }
      if (error.message.includes('Invalid token signature')) {
        return NextResponse.json({ error: 'Invalid token' }, { status: 400 })
      }
    }

    return NextResponse.json({ error: 'Authentication failed' }, { status: 500 })
  }
}
