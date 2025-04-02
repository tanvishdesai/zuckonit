'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { createPost, updatePost, uploadImage, getUserGroups, PostVisibility, Group } from '@/lib/appwrite';
import { useRouter } from 'next/navigation';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Highlight from '@tiptap/extension-highlight';
import Typography from '@tiptap/extension-typography';
import Heading from '@tiptap/extension-heading';
import { Toggle } from '@/components/ui/toggle';
import { Bold, Italic, Heading1, Heading2, Heading3, Quote, List, ListOrdered, Highlighter } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

interface PostFormProps {
  initialData?: {
    id: string;
    title: string;
    content: string;
    imageId?: string;
    visibility?: PostVisibility;
    group_id?: string[];
  };
  mode: 'create' | 'edit';
}

export function PostForm({ initialData, mode = 'create' }: PostFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [title, setTitle] = useState(initialData?.title || '');
  const [error, setError] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [visibility, setVisibility] = useState<PostVisibility>(initialData?.visibility || 'public');
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroups, setSelectedGroups] = useState<string[]>(initialData?.group_id || []);

  // Load user's groups
  useEffect(() => {
    const loadGroups = async () => {
      try {
        const userGroups = await getUserGroups();
        setGroups(userGroups);
      } catch (error) {
        console.error('Error loading groups:', error);
      }
    };
    loadGroups();
  }, []);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: false,
      }),
      Highlight,
      Typography,
      Heading.configure({
        levels: [1, 2, 3],
      }),
    ],
    content: initialData?.content || '',
    editorProps: {
      attributes: {
        class: 'prose dark:prose-invert prose-headings:font-bold prose-h1:text-2xl prose-h2:text-xl prose-h3:text-lg max-w-none focus:outline-none min-h-[300px] max-h-[600px] overflow-y-auto p-4 rounded-md border border-input bg-background',
      },
    },
  });

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setImageFile(file);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!title.trim() || !editor?.getHTML()) {
      setError('Title and content are required');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      let imageId = initialData?.imageId;

      if (imageFile) {
        const uploadedImage = await uploadImage(imageFile);
        imageId = uploadedImage.id;
      }

      if (mode === 'create') {
        await createPost(
          title,
          editor.getHTML(),
          visibility,
          visibility === 'groups' ? selectedGroups : [],
          imageId
        );
        router.push('/');
      } else if (initialData?.id) {
        await updatePost(initialData.id, {
          title,
          content: editor.getHTML(),
          image: imageId,
          visibility,
          group_id: visibility === 'groups' ? selectedGroups : []
        });
        router.push(`/post/${initialData.id}`);
      }
    } catch (error) {
      console.error('Error saving post:', error);
      setError('Failed to save post. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const MenuBar = () => {
    if (!editor) {
      return null;
    }

    return (
      <div className="border border-input bg-transparent rounded-md mb-4">
        <div className="flex flex-wrap gap-1 p-1">
          <Toggle
            size="sm"
            pressed={editor.isActive('heading', { level: 1 })}
            onPressedChange={() => {
              editor.chain().focus().toggleHeading({ level: 1 }).run();
            }}
          >
            <Heading1 className="h-4 w-4" />
          </Toggle>
          <Toggle
            size="sm"
            pressed={editor.isActive('heading', { level: 2 })}
            onPressedChange={() => {
              editor.chain().focus().toggleHeading({ level: 2 }).run();
            }}
          >
            <Heading2 className="h-4 w-4" />
          </Toggle>
          <Toggle
            size="sm"
            pressed={editor.isActive('heading', { level: 3 })}
            onPressedChange={() => {
              editor.chain().focus().toggleHeading({ level: 3 }).run();
            }}
          >
            <Heading3 className="h-4 w-4" />
          </Toggle>
          <Toggle
            size="sm"
            pressed={editor.isActive('bold')}
            onPressedChange={() => editor.chain().focus().toggleBold().run()}
          >
            <Bold className="h-4 w-4" />
          </Toggle>
          <Toggle
            size="sm"
            pressed={editor.isActive('italic')}
            onPressedChange={() => editor.chain().focus().toggleItalic().run()}
          >
            <Italic className="h-4 w-4" />
          </Toggle>
          <Toggle
            size="sm"
            pressed={editor.isActive('highlight')}
            onPressedChange={() => editor.chain().focus().toggleHighlight().run()}
          >
            <Highlighter className="h-4 w-4" />
          </Toggle>
          <Toggle
            size="sm"
            pressed={editor.isActive('bulletList')}
            onPressedChange={() => editor.chain().focus().toggleBulletList().run()}
          >
            <List className="h-4 w-4" />
          </Toggle>
          <Toggle
            size="sm"
            pressed={editor.isActive('orderedList')}
            onPressedChange={() => editor.chain().focus().toggleOrderedList().run()}
          >
            <ListOrdered className="h-4 w-4" />
          </Toggle>
          <Toggle
            size="sm"
            pressed={editor.isActive('blockquote')}
            onPressedChange={() => {
              editor.chain().focus().toggleBlockquote().run();
            }}
          >
            <Quote className="h-4 w-4" />
          </Toggle>
        </div>
      </div>
    );
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
        <MenuBar />
        <style jsx global>{`
          .ProseMirror h1 {
            font-size: 1.75rem;
            font-weight: bold;
            margin-top: 1.5rem;
            margin-bottom: 0.5rem;
          }
          .ProseMirror h2 {
            font-size: 1.5rem;
            font-weight: bold;
            margin-top: 1.25rem;
            margin-bottom: 0.5rem;
          }
          .ProseMirror h3 {
            font-size: 1.25rem;
            font-weight: bold;
            margin-top: 1rem;
            margin-bottom: 0.5rem;
          }
          .ProseMirror p {
            margin-bottom: 0.75rem;
          }
          .ProseMirror ul, .ProseMirror ol {
            margin-left: 1.5rem;
            margin-bottom: 0.75rem;
          }
          .ProseMirror blockquote {
            border-left: 3px solid #e2e8f0;
            padding-left: 1rem;
            font-style: italic;
          }
        `}</style>
        <EditorContent editor={editor} />
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
      <div className="space-y-4">
        <div className="space-y-2">
          <Label>Post Visibility</Label>
          <Select
            value={visibility}
            onValueChange={(value: PostVisibility) => setVisibility(value)}
            disabled={isLoading}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select visibility" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="public">Public</SelectItem>
              <SelectItem value="private">Private</SelectItem>
              <SelectItem value="groups">Selected Groups</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {visibility === 'groups' && (
          <div className="space-y-2">
            <Label>Select Groups</Label>
            <div className="space-y-2">
              {groups.map((group) => (
                <div key={group.$id} className="flex items-center space-x-2">
                  <Checkbox
                    id={group.$id}
                    checked={selectedGroups.includes(group.$id)}
                    onCheckedChange={(checked: boolean) => {
                      if (checked) {
                        setSelectedGroups([...selectedGroups, group.$id]);
                      } else {
                        setSelectedGroups(selectedGroups.filter(id => id !== group.$id));
                      }
                    }}
                  />
                  <Label htmlFor={group.$id}>{group.name}</Label>
                </div>
              ))}
            </div>
          </div>
        )}
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