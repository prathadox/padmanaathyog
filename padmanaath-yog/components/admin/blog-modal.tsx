"use client"

import { useEffect, useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "@/hooks/use-toast"
import { BlogService, type BlogExternalRef } from "@/lib/services/blog-service"

const PROVIDER_DEFINITIONS = [
  { value: "medium", label: "Medium", hosts: ["medium.com"] },
  { value: "dev.to", label: "Dev.to", hosts: ["dev.to"] },
  { value: "hashnode", label: "Hashnode", hosts: ["hashnode.dev", "hashnode.com"] },
  { value: "wordpress", label: "WordPress", hosts: ["wordpress.com", "wp.com"] },
  { value: "substack", label: "Substack", hosts: ["substack.com"] },
  { value: "blogger", label: "Blogger", hosts: ["blogspot.com"] },
  { value: "ghost", label: "Ghost", hosts: ["ghost.io"] },
  { value: "notion", label: "Notion", hosts: ["notion.site", "notion.so"] },
]

const PROVIDER_OPTIONS = [
  { value: "external", label: "External / Custom" },
  ...PROVIDER_DEFINITIONS.map(({ value, label }) => ({ value, label })),
]

const normalizeUrlInput = (value: string) => {
  if (!value) return ""
  const trimmed = value.trim()
  if (!trimmed) return ""
  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed
  }
  return `https://${trimmed.replace(/^https?:\/\//i, "")}`
}

const shouldNormalizeToUrl = (value: string) => {
  if (!value) return false
  return /^https?:\/\//i.test(value) || value.includes(".")
}

const detectProviderFromHost = (hostname: string) => {
  const normalized = hostname.toLowerCase()
  const match = PROVIDER_DEFINITIONS.find(({ hosts }) =>
    hosts.some((host) => normalized.includes(host))
  )
  return match?.value ?? "external"
}

interface BlogModalProps {
  isOpen: boolean
  onClose: () => void
  blog?: BlogExternalRef | null
  onSuccess: () => void
}

export default function BlogModal({ isOpen, onClose, blog, onSuccess }: BlogModalProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [isFetchingMetadata, setIsFetchingMetadata] = useState(false)
  const [formData, setFormData] = useState({
    external_id: "",
    title: "",
    excerpt: "",
    image: "",
    author: "",
    date: "",
    slug: "",
    provider: "external",
    tags: "",
  })

  // Reset form when modal opens/closes or blog changes
  useEffect(() => {
    if (isOpen) {
      if (blog) {
        setFormData({
          external_id: blog.external_id || "",
          title: blog.title || "",
          excerpt: blog.excerpt || "",
          image: blog.image || "",
          author: blog.author || "",
          date: blog.date ? new Date(blog.date).toISOString().split('T')[0] : "",
          slug: blog.slug || "",
          provider: blog.provider || "external",
          tags: (blog as any).tags?.join(", ") || "",
        })
      } else {
        setFormData({
          external_id: "",
          title: "",
          excerpt: "",
          image: "",
          author: "",
          date: new Date().toISOString().split('T')[0],
          slug: "",
          provider: "external",
          tags: "",
        })
      }
    }
  }, [isOpen, blog])

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")
  }

  const handleTitleChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      title: value,
      slug: prev.slug || generateSlug(value)
    }))
  }

  const extractDataFromUrl = async (inputUrl: string) => {
    const normalizedUrl = normalizeUrlInput(inputUrl)
    if (!normalizedUrl) return

    try {
      const parsedUrl = new URL(normalizedUrl)
      const provider = detectProviderFromHost(parsedUrl.hostname)

      setFormData(prev => ({
        ...prev,
        external_id: normalizedUrl,
        provider,
      }))

      setIsFetchingMetadata(true)

      try {
        const response = await fetch('/api/extract-blog-metadata', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ url: normalizedUrl }),
        })

        if (response.ok) {
          const metadata = await response.json()

          setFormData(prev => ({
            ...prev,
            external_id: normalizedUrl,
            provider,
            title: metadata.title || prev.title,
            excerpt: metadata.excerpt || prev.excerpt,
            image: metadata.image || prev.image,
            author: metadata.author || prev.author,
            date: metadata.date || prev.date,
            tags: metadata.tags?.join(', ') || prev.tags,
            slug: prev.slug || generateSlug(metadata.title || '')
          }))

          toast({
            title: "Success",
            description: "Blog metadata extracted successfully!",
          })
        } else {
          console.error('Failed to fetch metadata')
          toast({
            title: "Partial Success",
            description: "Provider detected, but couldn't auto-fill all fields. Please fill manually.",
          })
        }
      } catch (error) {
        console.error('Error fetching metadata:', error)
        toast({
          title: "Partial Success",
          description: "Provider detected, but couldn't auto-fill all fields. Please fill manually.",
        })
      } finally {
        setIsFetchingMetadata(false)
      }
    } catch (error) {
      console.error("Invalid blog URL provided:", error)
      setFormData(prev => ({
        ...prev,
        external_id: normalizedUrl,
        provider: "external"
      }))
      toast({
        title: "Invalid URL",
        description: "We couldn't parse this URL. Please double-check and try again.",
        variant: "destructive",
      })
    }
  }

  const handleExtractClick = () => {
    if (!formData.external_id || isFetchingMetadata) return
    extractDataFromUrl(formData.external_id)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.title.trim() || !formData.excerpt.trim() || !formData.author.trim()) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      })
      return
    }

    if (!formData.slug.trim()) {
      setFormData(prev => ({ ...prev, slug: generateSlug(formData.title) }))
    }

    setIsLoading(true)

    try {
      const resolvedExternalId = formData.external_id?.trim()
        ? (shouldNormalizeToUrl(formData.external_id.trim())
            ? normalizeUrlInput(formData.external_id)
            : formData.external_id.trim())
        : (formData.slug.trim() || generateSlug(formData.title))

      const blogData = {
        external_id: resolvedExternalId,
        title: formData.title.trim(),
        excerpt: formData.excerpt.trim(),
        image: formData.image.trim() || "/heroSection.png",
        author: formData.author.trim(),
        date: formData.date,
        slug: formData.slug.trim() || generateSlug(formData.title),
        provider: formData.provider,
        tags: formData.tags ? formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag) : [],
      }

      if (blog?.id) {
        await BlogService.update(blog.id, blogData)
        toast({
          title: "Success",
          description: "Blog post updated successfully!",
        })
      } else {
        await BlogService.create(blogData)
        toast({
          title: "Success",
          description: "Blog post created successfully!",
        })
      }

      onSuccess()
      onClose()
    } catch (error) {
      console.error("Error saving blog post:", error)
      toast({
        title: "Error",
        description: "Failed to save blog post. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{blog ? "Edit Blog Post" : "Add New Blog Post"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            <div className="space-y-2">
              <Label htmlFor="external_id">Blog URL (paste to auto-extract)</Label>
              <div className="flex gap-2">
                <Input
                  id="external_id"
                  value={formData.external_id}
                  onChange={(e) => setFormData(prev => ({ ...prev, external_id: e.target.value }))}
                  onBlur={(e) => extractDataFromUrl(e.target.value)}
                  placeholder="https://medium.com/@user/article-title-123abc"
                  disabled={isFetchingMetadata}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleExtractClick}
                  disabled={isFetchingMetadata || !formData.external_id?.trim()}
                >
                  {isFetchingMetadata ? "Extracting..." : "Extract"}
                </Button>
              </div>
              <p className="text-xs text-gray-500">
                Supports Medium, Dev.to, Hashnode, WordPress, Substack, Blogger, Ghost, Notion, or any public link.
              </p>
              {isFetchingMetadata && (
                <p className="text-sm text-gray-500 flex items-center gap-2">
                  <span className="animate-spin">⏳</span> Fetching blog metadata...
                </p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="provider">Provider (auto-detected)</Label>
            <Select value={formData.provider} onValueChange={(value) => setFormData(prev => ({ ...prev, provider: value }))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PROVIDER_OPTIONS.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder="Enter blog post title"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="slug">Slug</Label>
            <Input
              id="slug"
              value={formData.slug}
              onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
              placeholder="url-friendly-slug"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="excerpt">Excerpt *</Label>
            <Textarea
              id="excerpt"
              value={formData.excerpt}
              onChange={(e) => setFormData(prev => ({ ...prev, excerpt: e.target.value }))}
              placeholder="Brief description of the blog post"
              rows={3}
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="author">Author *</Label>
              <Input
                id="author"
                value={formData.author}
                onChange={(e) => setFormData(prev => ({ ...prev, author: e.target.value }))}
                placeholder="Author name"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="image">Featured Image URL</Label>
            <Input
              id="image"
              value={formData.image}
              onChange={(e) => setFormData(prev => ({ ...prev, image: e.target.value }))}
              placeholder="https://example.com/image.jpg"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="tags">Tags</Label>
            <Input
              id="tags"
              value={formData.tags}
              onChange={(e) => setFormData(prev => ({ ...prev, tags: e.target.value }))}
              placeholder="yoga, meditation, wellness (comma separated)"
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading} className="bg-yoga-burnt hover:bg-yoga-lightorange">
              {isLoading ? "Saving..." : blog ? "Update" : "Create"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
