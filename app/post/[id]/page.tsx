import PostClient from './page-client';

type Props = {
  params: { id: string };
}

export default async function PostPage({ params }: Props) {
  // Await params as per Next.js error message
  const resolvedParams = await params;
  return <PostClient postId={resolvedParams.id} />;
} 