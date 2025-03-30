"use client"

import { PostForm } from "@/components/ui/PostForm"
import { useAuth } from "@/context/AuthContext"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { getPost } from "@/lib/appwrite"
import { ArrowLeft, AlertCircle, Loader2 } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import React from "react"

// Define Post type
interface Post {
  $id: string
  title: string
  content: string
  image?: string
  created_at: string
  user_id: string
  user_name: string
}

export default function EditPostPage({ params }: { params: Promise<{ id: string }> | { id: string } }) {
  const unwrappedParams = React.use(params as Promise<{ id: string }>)
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [post, setPost] = useState<Post | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login")
      return
    }

    const fetchPost = async () => {
      try {
        const postData = await getPost(unwrappedParams.id)
        setPost(postData as unknown as Post)
      } catch (error) {
        console.error("Error fetching post:", error)
        setError("Failed to load post")
      } finally {
        setLoading(false)
      }
    }

    if (user) {
      fetchPost()
    }
  }, [user, authLoading, router, unwrappedParams.id])

  if (authLoading || loading) {
    return (
      <div className="flex flex-col justify-center items-center min-h-[60vh] gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-muted-foreground">Loading post...</p>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="max-w-md mx-auto mt-16 text-center py-12 bg-muted/30 rounded-xl border border-border/40">
        <AlertCircle className="h-12 w-12 text-primary mx-auto mb-4" />
        <h2 className="text-2xl font-semibold mb-2">Authentication Required</h2>
        <p className="text-muted-foreground mb-6 px-6">You need to be logged in to edit a post</p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button asChild>
            <Link href="/login">Login</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/">Back to Home</Link>
          </Button>
        </div>
      </div>
    )
  }

  if (error || !post) {
    return (
      <div className="max-w-md mx-auto mt-16">
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4 mr-2" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error || "The post could not be loaded"}</AlertDescription>
        </Alert>
        <div className="text-center">
          <Button asChild>
            <Link href="/">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Link>
          </Button>
        </div>
      </div>
    )
  }

  const initialData = {
    id: post.$id,
    title: post.title,
    content: post.content,
    imageId: post.image,
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6">
      <div className="mb-8">
        <Button variant="ghost" size="sm" className="mb-4" asChild>
          <Link href="/">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Link>
        </Button>
        <h1 className="text-3xl font-bold">Edit Post</h1>
        <p className="text-muted-foreground mt-2">Make changes to your post and save when youre done.</p>
      </div>
      <div className="bg-card rounded-xl p-6 shadow-sm border border-border/40">
        <PostForm initialData={initialData} mode="edit" />
      </div>
    </div>
  )
}

