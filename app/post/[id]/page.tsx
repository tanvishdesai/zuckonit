// This is a Server Component
import PostPageClient from './PostPageClient'

export default function PostPage({ params }: { params: { id: string } }) {
  return <PostPageClient id={params.id} />
} 