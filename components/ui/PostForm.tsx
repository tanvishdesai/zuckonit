'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { createPost, updatePost, uploadImage } from '@/lib/appwrite';
import { useRouter } from 'next/navigation';

interface PostFormProps {
  initialData?: {
    id: string;
    title: string;
    content: string;
    imageId?: string;
  };
  mode: 'create' | 'edit';
}

export function PostForm({ initialData, mode = 'create' }: PostFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [title, setTitle] = useState(initialData?.title || '');
  const [content, setContent] = useState(initialData?.content || '');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setImageFile(file);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!title.trim() || !content.trim()) {
      setError('Title and content are required');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      let imageId = initialData?.imageId;

      // Handle image upload if there's a new image
      if (imageFile) {
        const uploadedImage = await uploadImage(imageFile);
        imageId = uploadedImage.id;
      }

      if (mode === 'create') {
        await createPost(title, content, imageId);
        router.push('/');
      } else if (initialData?.id) {
        await updatePost(initialData.id, { title, content, image: imageId });
        router.push(`/post/${initialData.id}`);
      }
    } catch (error) {
      console.error('Error saving post:', error);
      setError('Failed to save post. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Input
          type="text"
          placeholder="Post Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          disabled={isLoading}
          className="text-xl font-semibold"
        />
      </div>
      <div>
        <Textarea
          placeholder="Write your post content here... (Markdown supported)"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          disabled={isLoading}
          className="min-h-[300px]"
        />
      </div>
      <div>
        <Input
          type="file"
          accept="image/*"
          onChange={handleImageChange}
          disabled={isLoading}
        />
        <p className="text-sm text-muted-foreground mt-1">
          Add a featured image for your post
        </p>
      </div>
      {error && <p className="text-red-500 text-sm">{error}</p>}
      <div className="flex justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={isLoading}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Saving...' : mode === 'create' ? 'Create Post' : 'Save Changes'}
        </Button>
      </div>
    </form>
  );
} 