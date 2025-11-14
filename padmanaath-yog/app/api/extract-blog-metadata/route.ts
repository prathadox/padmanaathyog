import { NextRequest, NextResponse } from "next/server"
import * as cheerio from "cheerio"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json()

    if (!url) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 })
    }

    // Fetch the blog post HTML
    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
      },
    })

    if (!response.ok) {
      return NextResponse.json({ error: "Failed to fetch URL" }, { status: 400 })
    }

    const html = await response.text()
    const $ = cheerio.load(html)

    // Extract Open Graph and meta tags
    const metadata = {
      title:
        $('meta[property="og:title"]').attr("content") ||
        $('meta[name="twitter:title"]').attr("content") ||
        $("title").text() ||
        "",

      excerpt:
        $('meta[property="og:description"]').attr("content") ||
        $('meta[name="twitter:description"]').attr("content") ||
        $('meta[name="description"]').attr("content") ||
        "",

      image:
        $('meta[property="og:image"]').attr("content") ||
        $('meta[name="twitter:image"]').attr("content") ||
        "",

      author:
        $('meta[property="article:author"]').attr("content") ||
        $('meta[name="author"]').attr("content") ||
        $('meta[property="author"]').attr("content") ||
        $('meta[name="twitter:creator"]').attr("content") ||
        $('a[rel="author"]').text() ||
        $('[data-testid="authorName"]').text() ||
        $('a[data-action="show-user-card"]').text() ||
        $('.author-name').text() ||
        $('span[data-testid="authorName"]').first().text() ||
        "",

      date:
        $('meta[property="article:published_time"]').attr("content") ||
        $('meta[name="publish_date"]').attr("content") ||
        $('time[datetime]').attr("datetime") ||
        new Date().toISOString().split("T")[0],

      tags: [] as string[],
    }

    // Extract tags from article:tag meta tags
    $('meta[property="article:tag"]').each((_, el) => {
      const tag = $(el).attr("content")
      if (tag) {
        metadata.tags.push(tag)
      }
    })

    // If no tags found, try keywords
    if (metadata.tags.length === 0) {
      const keywords = $('meta[name="keywords"]').attr("content")
      if (keywords) {
        metadata.tags = keywords
          .split(",")
          .map((tag) => tag.trim())
          .filter((tag) => tag.length > 0)
      }
    }

    // Format date to YYYY-MM-DD
    if (metadata.date) {
      try {
        const dateObj = new Date(metadata.date)
        metadata.date = dateObj.toISOString().split("T")[0]
      } catch (error) {
        metadata.date = new Date().toISOString().split("T")[0]
      }
    }

    // Clean up author name (remove extra whitespace, URLs)
    if (metadata.author) {
      metadata.author = metadata.author.trim().split("\n")[0].trim()
      if (metadata.author.startsWith("http")) {
        metadata.author = ""
      }
    }

    // Filter out platform names that aren't real author names
    const platformNames = ['substack', 'medium', 'dev.to', 'hashnode', 'wordpress', 'blogger', 'ghost', 'notion']
    if (metadata.author && platformNames.includes(metadata.author.toLowerCase())) {
      metadata.author = ""
    }

    // Extract author from URL if not found in metadata
    if (!metadata.author) {
      const urlObj = new URL(url)
      const pathParts = urlObj.pathname.split('/').filter(part => part.length > 0)
      
      // Medium URLs: medium.com/@username/article
      if (url.includes('medium.com')) {
        const authorPart = pathParts.find(part => part.startsWith('@'))
        if (authorPart) {
          metadata.author = authorPart.substring(1) // Remove @ symbol
        }
      }
      
      // Substack URLs: substack.com/@username/note/... or substack.com/@username/p/...
      if (url.includes('substack.com')) {
        const authorPart = pathParts.find(part => part.startsWith('@'))
        if (authorPart) {
          metadata.author = authorPart.substring(1) // Remove @ symbol
        }
      }
      
      // Dev.to URLs: dev.to/username/article
      if (url.includes('dev.to')) {
        const authorPart = pathParts[0] // First path segment is usually the username
        if (authorPart && !authorPart.includes('.')) {
          metadata.author = authorPart
        }
      }
    }

    // Limit tags to 5
    metadata.tags = metadata.tags.slice(0, 5)

    return NextResponse.json(metadata)
  } catch (error) {
    console.error("Error extracting metadata:", error)
    return NextResponse.json({ error: "Failed to extract metadata" }, { status: 500 })
  }
}
