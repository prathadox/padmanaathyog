import Image from "next/image"
import Link from "next/link"
import { formatDate, resolveExternalBlogUrl } from "@/lib/utils"

interface BlogCardProps {
  id: number
  title: string
  excerpt: string
  image: string
  date: string
  author: string
  slug: string
  tags: string[]
  provider?: string
  external_id?: string
}

export default function BlogCard({ 
  id, 
  title, 
  excerpt, 
  image, 
  date, 
  author, 
  slug, 
  tags, 
  provider = "external",
  external_id 
}: BlogCardProps) {
  const externalUrl = resolveExternalBlogUrl(external_id, provider, author)

  const blogUrl = externalUrl ?? `/blog/${slug}`
  const isExternalLink = Boolean(externalUrl)
  return (
    <article className="glass-card group overflow-hidden">
      <div className="relative h-52 w-full">
        <Image
          src={image || "/placeholder.svg"}
          alt={title}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
      </div>

      <div className="p-5">
        <div className="flex items-center text-sm text-muted-foreground mb-2">
          <time dateTime={date}>{formatDate(date)}</time>
          <span className="mx-2">•</span>
          <span>{author}</span>
        </div>

        <h3 className="text-xl font-semibold mb-2 group-hover:text-yoga-orange transition-colors">
          {isExternalLink ? (
            <a href={blogUrl} target="_blank" rel="noopener noreferrer">{title}</a>
          ) : (
            <Link href={blogUrl}>{title}</Link>
          )}
        </h3>

        <p className="text-muted-foreground mb-4 line-clamp-2">{excerpt}</p>

        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <span key={tag} className="text-xs px-2 py-1 bg-yoga-saffron/30 text-yoga-ochre rounded-full">
              {tag}
            </span>
          ))}
        </div>

        {isExternalLink ? (
          <a
            href={blogUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center mt-4 text-yoga-orange hover:text-yoga-ochre transition-colors text-sm font-medium"
          >
            Read more
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4 ml-1"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </a>
        ) : (
          <Link
            href={blogUrl}
            className="inline-flex items-center mt-4 text-yoga-orange hover:text-yoga-ochre transition-colors text-sm font-medium"
          >
            Read more
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4 ml-1"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        )}
      </div>
    </article>
  )
}
