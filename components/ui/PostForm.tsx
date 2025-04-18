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
import { Bold, Italic, Heading1, Heading2, Heading3, Quote, List, ListOrdered, Highlighter, ImageIcon, Save } from 'lucide-react';
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
    status?: 'published' | 'draft';
    label?: 'Work' | 'Philosophy' | 'Art';
  };
  mode: 'create' | 'edit';
}

export function PostForm({ initialData, mode = 'create' }: PostFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [title, setTitle] = useState(initialData?.title || '');
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [coverImageFile, setCoverImageFile] = useState<File | null>(null);
  const [visibility, setVisibility] = useState<PostVisibility>(initialData?.visibility || 'public');
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroups, setSelectedGroups] = useState<string[]>(initialData?.group_id || []);
  const [postType, setPostType] = useState<'standard' | 'blog'>(initialData?.post_type || 'standard');
  const [postStatus, setPostStatus] = useState<'published' | 'draft'>(initialData?.status || 'published');
  const [postLabel, setPostLabel] = useState<'Work' | 'Philosophy' | 'Art'>(initialData?.label || 'Work');
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [localInitialData, setLocalInitialData] = useState(initialData);
  const [localMode, setLocalMode] = useState(mode);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const successMessageTimerRef = useRef<NodeJS.Timeout | null>(null);

  let initialContentJson: Record<string, unknown> | string = '';
  try {
    initialContentJson = initialData?.content ? JSON.parse(initialData.content) : '';
  } catch  {
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
    onUpdate: () => {
      setHasChanges(true);
    },
  });

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

  // Set up autosave
  useEffect(() => {
    if (hasChanges && editor) {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
      
      autoSaveTimerRef.current = setTimeout(() => {
        savePostAsDraft();
      }, 30000); // Autosave every 30 seconds of inactivity
    }
    
    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, [hasChanges, title, editor]);

  // Track changes
  useEffect(() => {
    setHasChanges(true);
  }, [title, visibility, selectedGroups, postType, postLabel, coverImageFile]);

  // Set default label when post type changes
  useEffect(() => {
    if (postType === 'blog') {
      setPostLabel('Work'); // Default label for blog posts
    }
  }, [postType]);

  // Clear success message after a set time
  useEffect(() => {
    if (successMessage) {
      if (successMessageTimerRef.current) {
        clearTimeout(successMessageTimerRef.current);
      }
      
      successMessageTimerRef.current = setTimeout(() => {
        setSuccessMessage(null);
      }, 5000); // Clear message after 5 seconds
    }
    
    return () => {
      if (successMessageTimerRef.current) {
        clearTimeout(successMessageTimerRef.current);
      }
    };
  }, [successMessage]);

  const handleCoverImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setCoverImageFile(file);
    setHasChanges(true);
  };

  const addImageToContent = useCallback(async (file: File) => {
    if (!editor) return;

    try {
      setIsLoading(true);
      const uploadedImage = await uploadImage(file);
      const imageUrl = getImageUrl(uploadedImage.id);
      if (imageUrl) {
        editor.chain().focus().setImage({ src: imageUrl.toString() }).run();
        setHasChanges(true);
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

  const savePostAsDraft = async () => {
    if (!editor || !title.trim()) return;
    
    const contentJson = editor.getJSON();
    
    try {
      setIsSaving(true);
      
      let coverImageId = localInitialData?.imageId;

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
        label: postLabel
      };

      if (localMode === 'create') {
        const response = await createPostDB(
          postData.title,
          postData.content,
          postData.visibility,
          postData.group_id,
          postData.image,
          'draft',
          postData.post_type,
          postData.label
        );
        
        // Update initialData with the new post id
        if (response?.$id) {
          setLocalInitialData({ 
            ...localInitialData, 
            id: response.$id,
            title: title,
            content: postData.content,
            status: 'draft'
          });
          setLocalMode('edit'); // Switch to edit mode since we now have a saved draft
          
          // Update the database to mark as draft
          await updatePostDB(response.$id, {
            status: 'draft'
          });
        }
      } else if (localInitialData?.id) {
        await updatePostDB(localInitialData.id, {
          ...postData,
          status: 'draft'
        });
      }
      
      setLastSaved(new Date());
      setHasChanges(false);
      setSuccessMessage(`Draft saved at ${new Date().toLocaleTimeString()}`);
    } catch (error) {
      console.error('Error saving draft:', error);
      setError("There was a problem saving your draft. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>, saveAsDraft = false) => {
    e.preventDefault();
    
    if (!title.trim()) {
      setError("Please enter a title for your post.");
      return;
    }
    
    if (!editor) {
      setError("Editor not initialized.");
      return;
    }
    
    const contentJson = editor.getJSON();
    const isEmpty = editor.isEmpty;
    
    if (isEmpty) {
      setError("Please add some content to your post.");
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      let coverImageId = initialData?.imageId;
      
      if (coverImageFile) {
        const uploadedCoverImage = await uploadImage(coverImageFile);
        coverImageId = uploadedCoverImage.id;
      }
      
      const finalStatus = saveAsDraft ? 'draft' : 'published';
      
      if (mode === 'create') {
        await createPostDB(
          title,
          JSON.stringify(contentJson),
          visibility,
          visibility === 'groups' ? selectedGroups : [],
          coverImageId,
          finalStatus,
          postType,
          postLabel
        );
        
        // Redirect to home page after successful post creation
        if (!saveAsDraft) {
          router.push('/');
          router.refresh();
        } else {
          setSuccessMessage("Draft saved successfully!");
          setPostStatus('draft');
        }
      } else if (initialData?.id) {
        await updatePostDB(initialData.id, {
          title: title,
          content: JSON.stringify(contentJson),
          image: coverImageId,
          visibility: visibility,
          group_id: visibility === 'groups' ? selectedGroups : [],
          post_type: postType,
          status: finalStatus,
          label: postLabel
        });
        
        if (!saveAsDraft) {
          router.push(`/post/${initialData.id}`);
          router.refresh();
        } else {
          setSuccessMessage("Draft saved successfully!");
          setPostStatus('draft');
        }
      }
      
      setHasChanges(false);
    } catch (error) {
      console.error("Error creating/updating post:", error);
      setError("Failed to save post. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveAsDraftClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    handleSubmit(e as unknown as React.FormEvent<HTMLFormElement>, true);
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
              setHasChanges(true);
            }}
          >
            <Heading1 className="h-4 w-4" />
          </Toggle>
          <Toggle
            size="sm"
            pressed={editor.isActive('heading', { level: 2 })}
            onPressedChange={() => {
              editor.chain().focus().toggleHeading({ level: 2 }).run();
              setHasChanges(true);
            }}
          >
            <Heading2 className="h-4 w-4" />
          </Toggle>
          <Toggle
            size="sm"
            pressed={editor.isActive('heading', { level: 3 })}
            onPressedChange={() => {
              editor.chain().focus().toggleHeading({ level: 3 }).run();
              setHasChanges(true);
            }}
          >
            <Heading3 className="h-4 w-4" />
          </Toggle>
          <Toggle
            size="sm"
            pressed={editor.isActive('bold')}
            onPressedChange={() => {
              editor.chain().focus().toggleBold().run();
              setHasChanges(true);
            }}
          >
            <Bold className="h-4 w-4" />
          </Toggle>
          <Toggle
            size="sm"
            pressed={editor.isActive('italic')}
            onPressedChange={() => {
              editor.chain().focus().toggleItalic().run();
              setHasChanges(true);
            }}
          >
            <Italic className="h-4 w-4" />
          </Toggle>
          <Toggle
            size="sm"
            pressed={editor.isActive('highlight')}
            onPressedChange={() => {
              editor.chain().focus().toggleHighlight().run();
              setHasChanges(true);
            }}
          >
            <Highlighter className="h-4 w-4" />
          </Toggle>
          <Toggle
            size="sm"
            pressed={editor.isActive('bulletList')}
            onPressedChange={() => {
              editor.chain().focus().toggleBulletList().run();
              setHasChanges(true);
            }}
          >
            <List className="h-4 w-4" />
          </Toggle>
          <Toggle
            size="sm"
            pressed={editor.isActive('orderedList')}
            onPressedChange={() => {
              editor.chain().focus().toggleOrderedList().run();
              setHasChanges(true);
            }}
          >
            <ListOrdered className="h-4 w-4" />
          </Toggle>
          <Toggle
            size="sm"
            pressed={editor.isActive('blockquote')}
            onPressedChange={() => {
              editor.chain().focus().toggleBlockquote().run();
              setHasChanges(true);
            }}
          >
            <Quote className="h-4 w-4" />
          </Toggle>
          <Button variant="ghost" size="sm" onClick={handleImageUploadClick} className="flex items-center">
            <ImageIcon className="h-4 w-4 mr-1" />
            <span>Image</span>
          </Button>
          <input
            type="file"
            accept="image/*"
            ref={fileInputRef}
            className="hidden"
            onChange={handleFileInputChange}
          />
        </div>
      </div>
    );
  };

  // Display last saved time
  const renderSaveStatus = () => {
    if (isSaving) {
      return <span className="text-sm text-muted-foreground">Saving...</span>;
    }
    if (lastSaved) {
      return <span className="text-sm text-muted-foreground">Last autosaved: {lastSaved.toLocaleTimeString()}</span>;
    }
    return null;
  };

  // For the save button onClick handler
  const handleSaveClick = () => {
    savePostAsDraft();
  };

  return (
    <form onSubmit={(e) => handleSubmit(e, false)} className="space-y-6">
      {error && <div className="bg-destructive/10 text-destructive p-3 rounded-md">{error}</div>}
      {successMessage && <div className="bg-green-500/10 text-green-700 p-3 rounded-md">{successMessage}</div>}
      
      <div className="space-y-2">
        <Label htmlFor="title">Post Title</Label>
        <Input
          id="title"
          placeholder="Enter a title"
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            setHasChanges(true);
          }}
          className="text-lg"
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="post-type">Post Type</Label>
        <RadioGroup
          value={postType}
          onValueChange={(value: 'standard' | 'blog') => {
            setPostType(value);
            setHasChanges(true);
          }}
          className="flex flex-col space-y-1"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="standard" id="standard" />
            <Label htmlFor="standard">Standard Post</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="blog" id="blog" />
            <Label htmlFor="blog">Blog Post</Label>
          </div>
        </RadioGroup>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="cover-image">Cover Image (Optional)</Label>
        <Input
          id="cover-image"
          type="file"
          accept="image/*"
          onChange={handleCoverImageChange}
        />
      </div>
      
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <Label>Content</Label>
          {renderSaveStatus()}
        </div>
        <MenuBar />
        <EditorContent editor={editor} />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="visibility">Visibility</Label>
        <Select
          value={visibility}
          onValueChange={(value: PostVisibility) => {
            setVisibility(value);
            setHasChanges(true);
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select visibility" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="public">Public</SelectItem>
            <SelectItem value="private">Private</SelectItem>
            <SelectItem value="groups">Specific Groups</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      {visibility === 'groups' && (
        <div className="space-y-4">
          <Label>Select Groups</Label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {groups.map((group) => (
              <div key={group.$id} className="flex items-center space-x-2">
                <Checkbox 
                  id={group.$id} 
                  checked={selectedGroups.includes(group.$id)}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      setSelectedGroups([...selectedGroups, group.$id]);
                    } else {
                      setSelectedGroups(selectedGroups.filter(id => id !== group.$id));
                    }
                    setHasChanges(true);
                  }}
                />
                <Label htmlFor={group.$id}>{group.name}</Label>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Only show label selection for standard posts */}
      {postType === 'standard' && (
        <div className="space-y-2">
          <Label htmlFor="post-label">Post Label</Label>
          <RadioGroup
            value={postLabel}
            onValueChange={(value: 'Work' | 'Philosophy' | 'Art') => {
              setPostLabel(value);
              setHasChanges(true);
            }}
            className="flex flex-col space-y-2"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="Work" id="label-work" />
              <Label htmlFor="label-work">Work</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="Philosophy" id="label-philosophy" />
              <Label htmlFor="label-philosophy">Philosophy</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="Art" id="label-art" />
              <Label htmlFor="label-art">Art</Label>
            </div>
          </RadioGroup>
        </div>
      )}
      
      <div className="flex gap-3">
        <Button 
          type="button" 
          variant="outline" 
          disabled={isLoading || isSaving} 
          onClick={handleSaveAsDraftClick}
        >
          Save as Draft
        </Button>
        <Button 
          type="submit" 
          disabled={isLoading || isSaving}
        >
          {postStatus === 'draft' ? 'Publish' : 'Post'}
        </Button>
        <Button 
          type="button" 
          variant="ghost" 
          disabled={!hasChanges || isLoading || isSaving}
          onClick={handleSaveClick}
          className="ml-auto"
        >
          <Save className="h-4 w-4 mr-2" />
          Save
        </Button>
      </div>
    </form>
  );
} 