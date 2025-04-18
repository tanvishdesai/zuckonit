import PostClient from './page-client';

type Props = {
  params: { id: string };
}

export default function PostPage({ params }: Props) {
  return <PostClient postId={params.id} />;
} 