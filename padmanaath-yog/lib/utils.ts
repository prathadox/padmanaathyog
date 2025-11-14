import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date)
}

const HTTP_REGEX = /^https?:\/\//i

const ensureProtocol = (value: string) => {
  if (HTTP_REGEX.test(value)) return value
  return `https://${value.replace(/^\/+/, "")}`
}

const buildMediumUrl = (identifier: string) => {
  const trimmed = identifier.trim()
  if (!trimmed) return null

  if (trimmed.includes("medium.com")) {
    return ensureProtocol(trimmed)
  }

  if (trimmed.startsWith("@") || trimmed.includes("/")) {
    return `https://medium.com/${trimmed.replace(/^\/+/, "")}`
  }

  const slugParts = trimmed.split("-")
  const maybeId = slugParts[slugParts.length - 1]
  if (maybeId && maybeId.length >= 6) {
    return `https://medium.com/p/${maybeId}`
  }

  return null
}

const buildDevtoUrl = (identifier: string, author?: string) => {
  if (!author) return null
  const handle = author.trim().replace(/\s+/g, "").replace(/^@/, "").toLowerCase()
  if (!handle) return null
  return `https://dev.to/${handle}/${identifier.replace(/^\/+/, "")}`
}

const buildGenericUrl = (identifier: string) => {
  const trimmed = identifier.trim()
  if (!trimmed) return null

  if (trimmed.includes("://")) {
    return ensureProtocol(trimmed)
  }

  if (trimmed.includes(".")) {
    return ensureProtocol(trimmed)
  }

  return null
}

export function resolveExternalBlogUrl(
  externalId?: string | null,
  provider?: string | null,
  author?: string | null
): string | null {
  if (!externalId) return null
  const value = externalId.trim()
  if (!value) return null

  if (HTTP_REGEX.test(value)) {
    return value
  }

  switch (provider) {
    case "medium":
      return buildMediumUrl(value)
    case "dev.to":
      return buildDevtoUrl(value, author ?? undefined)
    case "hashnode":
    case "wordpress":
    case "substack":
    case "blogger":
    case "ghost":
    case "notion":
      return buildGenericUrl(value)
    default:
      return buildGenericUrl(value)
  }
}
