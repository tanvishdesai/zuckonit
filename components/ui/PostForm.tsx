'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { createPost as createPostDB, updatePost as updatePostDB, uploadImage, getUserGroups, PostVisibility, Group, getImageUrl } from '@/lib/appwrite';
import { useRouter } from 'next/navigation';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Highlight from '@tiptap/extension-highlight';
import Typography from '@tiptap/extension-typography';
import Heading from '@tiptap/extension-heading';
import Image from '@tiptap/extension-image';
import { Toggle } from '@/components/ui/toggle';
import { Bold, Italic, Heading1, Heading2, Heading3, Quote, List, ListOrdered, Highlighter, ImageIcon } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

interface PostFormProps {
  initialData?: {
    id: string;
    title: string;
    content: string;
    imageId?: string;
    visibility?: PostVisibility;
    group_id?: string[];
    post_type?: 'standard' | 'blog';
  };
  mode: 'create' | 'edit';
}

export function PostForm({ initialData, mode = 'create' }: PostFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [title, setTitle] = useState(initialData?.title || '');
  const [error, setError] = useState<string | null>(null);
  const [coverImageFile, setCoverImageFile] = useState<File | null>(null);
  const [visibility, setVisibility] = useState<PostVisibility>(initialData?.visibility || 'public');
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroups, setSelectedGroups] = useState<string[]>(initialData?.group_id || []);
  const [postType, setPostType] = useState<'standard' | 'blog'>(initialData?.post_type || 'standard');

  const fileInputRef = useRef<HTMLInputElement>(null);

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

  let initialContentJson: Record<string, unknown> | string = '';
  try {
    initialContentJson = initialData?.content ? JSON.parse(initialData.content) : '';
  } catch (e) {
    console.warn("Initial content is not valid JSON, using as plain text:", initialData?.content);
    initialContentJson = initialData?.content || '';
  }

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
      Image.configure({
        inline: false,
      }),
    ],
    content: initialContentJson,
    editorProps: {
      attributes: {
        class: 'prose dark:prose-invert prose-headings:font-bold prose-h1:text-2xl prose-h2:text-xl prose-h3:text-lg max-w-none focus:outline-none min-h-[300px] max-h-[600px] overflow-y-auto p-4 rounded-md border border-input bg-background',
      },
    },
  });

  const handleCoverImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setCoverImageFile(file);
  };

  const addImageToContent = useCallback(async (file: File) => {
    if (!editor) return;

    try {
      setIsLoading(true);
      const uploadedImage = await uploadImage(file);
      const imageUrl = getImageUrl(uploadedImage.id);
      if (imageUrl) {
        editor.chain().focus().setImage({ src: imageUrl.toString() }).run();
      }
    } catch (error) {
      console.error("Error uploading image:", error);
      setError("Failed to upload image.");
    } finally {
      setIsLoading(false);
    }
  }, [editor]);

  const handleImageUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      addImageToContent(file);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const contentJson = editor?.getJSON();

    if (!title.trim() || !contentJson || Object.keys(contentJson.content || {}).length === 0 ) {
      setError('Title and content are required');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      let coverImageId = initialData?.imageId;

      if (coverImageFile) {
        const uploadedCoverImage = await uploadImage(coverImageFile);
        coverImageId = uploadedCoverImage.id;
      }

      const postData = {
        title: title,
        content: JSON.stringify(contentJson),
        visibility: visibility,
        group_id: visibility === 'groups' ? selectedGroups : [],
        post_type: postType,
        image: coverImageId,
      };

      if (mode === 'create') {
        await createPostDB(
          postData.title,
          postData.content,
          postData.post_type,
          postData.visibility,
          postData.group_id,
          postData.image
        );
        router.push('/');
      } else if (initialData?.id) {
        await updatePostDB(initialData.id, postData);
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
          <Toggle
            size="sm"
            onPressedChange={handleImageUploadClick}
            aria-label="Add image"
          >
            <ImageIcon className="h-4 w-4" />
          </Toggle>
          <input
            type="file"
            accept="image/*"
            ref={fileInputRef}
            onChange={handleFileInputChange}
            style={{ display: 'none' }}
            disabled={isLoading}
          />
        </div>
      </div>
    );
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <Label htmlFor="title">Title</Label>
        <Input
          id="title"
          type="text"
          placeholder="Post Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          disabled={isLoading}
          className="text-xl font-semibold mt-1"
        />
      </div>
      <div>
        <Label>Post Type</Label>
        <RadioGroup
          value={postType}
          onValueChange={(value: 'standard' | 'blog') => setPostType(value)}
          className="flex gap-4 mt-1"
          disabled={isLoading}
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="standard" id="type-standard" />
            <Label htmlFor="type-standard">Standard</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="blog" id="type-blog" />
            <Label htmlFor="type-blog">Blog</Label>
          </div>
        </RadioGroup>
      </div>
      <div>
        <Label>Content</Label>
        <MenuBar />
        <div className="rounded-md border border-input bg-background">
          <EditorContent editor={editor} />
        </div>
        <style jsx global>{`
          .ProseMirror {
            outline: none;
          }
          .ProseMirror img {
            max-width: 100%;
            height: auto;
            display: block;
            margin-top: 1rem;
            margin-bottom: 1rem;
            border-radius: 0.375rem;
          }
          .ProseMirror img.ProseMirror-selectednode {
            outline: 3px solid #68CEF8;
          }
          .ProseMirror h1 { font-size: 1.75rem; font-weight: bold; margin-top: 1.5rem; margin-bottom: 0.5rem; }
          .ProseMirror h2 { font-size: 1.5rem; font-weight: bold; margin-top: 1.25rem; margin-bottom: 0.5rem; }
          .ProseMirror h3 { font-size: 1.25rem; font-weight: bold; margin-top: 1rem; margin-bottom: 0.5rem; }
          .ProseMirror p { margin-bottom: 0.75rem; }
          .ProseMirror ul, .ProseMirror ol { margin-left: 1.5rem; margin-bottom: 0.75rem; }
          .ProseMirror blockquote { border-left: 3px solid hsl(var(--border)); padding-left: 1rem; margin-left: 0; margin-right: 0; font-style: italic; color: hsl(var(--muted-foreground)); }
          .ProseMirror mark { background-color: yellow;
          `}</style>
      </div>
      <div>
        <Label htmlFor="cover-image">Cover Image (Optional)</Label>
        <Input
          id="cover-image"
          type="file"
          accept="image/*"
          onChange={handleCoverImageChange}
          disabled={isLoading}
          className="mt-1"
        />
      </div>
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <Label>Visibility</Label>
          <Select value={visibility} onValueChange={(value: PostVisibility) => setVisibility(value)} disabled={isLoading}>
            <SelectTrigger className="mt-1">
              <SelectValue placeholder="Select visibility" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="public">Public</SelectItem>
              <SelectItem value="private">Private</SelectItem>
              <SelectItem value="groups">Groups</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {visibility === 'groups' && (
          <div className="flex-1">
            <Label>Select Groups</Label>
            {groups.length > 0 ? (
              <div className="mt-1 space-y-2 max-h-32 overflow-y-auto border p-2 rounded-md">
                {groups.map((group) => (
                  <div key={group.$id} className="flex items-center gap-2">
                    <Checkbox
                      id={`group-${group.$id}`}
                      checked={selectedGroups.includes(group.$id)}
                      onCheckedChange={(checked) => {
                        setSelectedGroups(prev =>
                          checked
                            ? [...prev, group.$id]
                            : prev.filter(id => id !== group.$id)
                        );
                      }}
                      disabled={isLoading}
                    />
                    <Label htmlFor={`group-${group.$id}`} className="font-normal">{group.name}</Label>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground mt-1">No groups found or you are not a member of any groups.</p>
            )}
          </div>
        )}
      </div>
      {error && <p className="text-red-500 text-sm">{error}</p>}
      <Button type="submit" disabled={isLoading || !editor}>
        {isLoading ? (mode === 'create' ? 'Creating...' : 'Saving...') : (mode === 'create' ? 'Create Post' : 'Save Changes')}
      </Button>
    </form>
  );
} 