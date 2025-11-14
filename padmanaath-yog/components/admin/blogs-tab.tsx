"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Search, Edit, Trash2, ExternalLink, Calendar, User } from "lucide-react"
import { formatDate, resolveExternalBlogUrl } from "@/lib/utils"
import type { BlogExternalRef } from "@/lib/services/blog-service"

interface BlogsTabProps {
  blogs: BlogExternalRef[]
  isLoading: boolean
  searchTerm: string
  onEdit: (blog: BlogExternalRef) => void
  onDelete: (blog: BlogExternalRef) => void
  editingItemId: number | null
}

export default function BlogsTab({
  blogs,
  isLoading,
  searchTerm,
  onEdit,
  onDelete,
  editingItemId,
}: BlogsTabProps) {
  const [localSearchTerm, setLocalSearchTerm] = useState(searchTerm)

  const filteredBlogs = blogs.filter((blog) =>
    blog.title.toLowerCase().includes(localSearchTerm.toLowerCase()) ||
    blog.author.toLowerCase().includes(localSearchTerm.toLowerCase()) ||
    blog.excerpt.toLowerCase().includes(localSearchTerm.toLowerCase())
  )

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yoga-burnt mx-auto"></div>
          <p className="mt-2 text-gray-500">Loading blogs...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Search */}
      <div className="bg-white p-4 rounded-lg shadow-sm">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search blogs by title, author, or content..."
            value={localSearchTerm}
            onChange={(e) => setLocalSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Blog Grid */}
      {filteredBlogs.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-500">
            {blogs.length === 0 ? (
              <div>
                <h3 className="text-lg font-medium mb-2">No blog posts yet</h3>
                <p>Add your first blog post to get started.</p>
              </div>
            ) : (
              <div>
                <h3 className="text-lg font-medium mb-2">No matching blog posts</h3>
                <p>Try adjusting your search terms.</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredBlogs.map((blog) => {
            const externalUrl = resolveExternalBlogUrl(blog.external_id, blog.provider, blog.author)
            return (
            <Card
              key={blog.id}
              className={`group hover:shadow-lg transition-all duration-200 ${
                editingItemId === blog.id ? "ring-2 ring-yoga-burnt" : ""
              }`}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-lg font-semibold line-clamp-2 group-hover:text-yoga-burnt transition-colors">
                      {blog.title}
                    </CardTitle>
                    <div className="flex items-center gap-2 mt-2 text-sm text-gray-500">
                      <User className="h-3 w-3" />
                      <span>{blog.author}</span>
                      <Calendar className="h-3 w-3 ml-2" />
                      <span>{formatDate(blog.date)}</span>
                    </div>
                  </div>
                  <Badge 
                    variant="secondary" 
                    className="ml-2 bg-yoga-saffron/20 text-yoga-ochre border-yoga-saffron/30"
                  >
                    {blog.provider}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Featured Image */}
                {blog.image && (
                  <div className="relative h-32 w-full rounded-md overflow-hidden bg-gray-100">
                    <img
                      src={blog.image}
                      alt={blog.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement
                        target.src = "/heroSection.png"
                      }}
                    />
                  </div>
                )}

                {/* Excerpt */}
                <p className="text-sm text-gray-600 line-clamp-3">{blog.excerpt}</p>

                {/* Metadata */}
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>Slug: {blog.slug}</span>
                  {externalUrl && (
                    <ExternalLink className="h-3 w-3" />
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onEdit(blog)}
                    className="flex-1 hover:bg-yoga-lightgreen hover:text-yoga-green border-yoga-lightgreen"
                  >
                    <Edit className="h-3 w-3 mr-1" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onDelete(blog)}
                    className="flex-1 hover:bg-red-50 hover:text-red-600 border-red-200"
                  >
                    <Trash2 className="h-3 w-3 mr-1" />
                    Delete
                  </Button>
                </div>

                {/* External Link Button */}
                {externalUrl && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full text-yoga-burnt hover:bg-yoga-lightgreen"
                    onClick={() => window.open(externalUrl, '_blank', 'noopener,noreferrer')}
                  >
                    <ExternalLink className="h-3 w-3 mr-1" />
                    View Original
                  </Button>
                )}
              </CardContent>
            </Card>
          )})}
        </div>
      )}

      {/* Stats */}
      <div className="bg-white p-4 rounded-lg shadow-sm">
        <div className="flex flex-wrap gap-4 text-sm text-gray-600">
          <span>Total: {blogs.length} blog posts</span>
          {localSearchTerm && (
            <span>Filtered: {filteredBlogs.length} results</span>
          )}
          <span>
            Providers: {Array.from(new Set(blogs.map(b => b.provider))).join(", ")}
          </span>
        </div>
      </div>
    </div>
  )
}
