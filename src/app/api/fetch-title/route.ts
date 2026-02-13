import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json()

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 })
    }

    // Validate URL format
    let parsedUrl: URL
    try {
      parsedUrl = new URL(url)
    } catch {
      return NextResponse.json({ error: 'Invalid URL format' }, { status: 400 })
    }

    // Fetch the page with timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5000)

    const response = await fetch(parsedUrl.href, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      // Return domain as fallback title
      return NextResponse.json({ 
        title: parsedUrl.hostname.replace('www.', ''),
        source: 'fallback'
      })
    }

    const html = await response.text()

    // Extract title using regex (faster than parsing full HTML)
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i)
    let title = titleMatch ? titleMatch[1].trim() : null

    // Try og:title if no title tag
    if (!title) {
      const ogTitleMatch = html.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["']/i)
        || html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:title["']/i)
      title = ogTitleMatch ? ogTitleMatch[1].trim() : null
    }

    // Fallback to domain name
    if (!title) {
      title = parsedUrl.hostname.replace('www.', '')
    }

    // Clean up title (decode HTML entities, trim whitespace)
    title = title
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/\s+/g, ' ')
      .trim()

    // Limit title length
    if (title.length > 100) {
      title = title.substring(0, 97) + '...'
    }

    return NextResponse.json({ title, source: 'fetched' })
  } catch (error) {
    console.error('Error fetching title:', error)
    
    // Try to extract domain from URL as fallback
    try {
      const { url } = await request.clone().json()
      const parsedUrl = new URL(url)
      return NextResponse.json({ 
        title: parsedUrl.hostname.replace('www.', ''),
        source: 'fallback'
      })
    } catch {
      return NextResponse.json({ error: 'Failed to fetch title' }, { status: 500 })
    }
  }
}
