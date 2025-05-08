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
import { 
  Bold, Italic, Heading1, Heading2, Heading3, Quote, List, 
  ListOrdered, Highlighter, ImageIcon, Save, Eye, EyeOff, 
  Users, FileText, Bookmark, Clock, Film, Palette, BookOpen, 
  Briefcase, BookMarked, ArrowLeft, Plus, LayoutGrid, X
} from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import Link from 'next/link';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

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
    label?: 'Work' | 'Philosophy' | 'Art' | 'literature' | 'Cinema';
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
  const [coverImagePreview, setCoverImagePreview] = useState<string | null>(null);
  const [visibility, setVisibility] = useState<PostVisibility>(initialData?.visibility || 'public');
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroups, setSelectedGroups] = useState<string[]>(initialData?.group_id || []);
  const [postType, setPostType] = useState<'standard' | 'blog'>(initialData?.post_type || 'standard');
  const [postStatus, setPostStatus] = useState<'published' | 'draft'>(initialData?.status || 'published');
  const [postLabel, setPostLabel] = useState<'Work' | 'Philosophy' | 'Art' | 'literature' | 'Cinema'>(initialData?.label || 'Work');
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [localInitialData, setLocalInitialData] = useState(initialData);
  const [localMode, setLocalMode] = useState(mode);
  const [activeTab, setActiveTab] = useState("content");

  const fileInputRef = useRef<HTMLInputElement>(null);
  const coverImageInputRef = useRef<HTMLInputElement>(null);
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
        class: 'prose dark:prose-invert prose-headings:font-bold prose-h1:text-2xl prose-h2:text-xl prose-h3:text-lg max-w-none focus:outline-none min-h-[400px] p-4 rounded-md',
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

  // Set cover image preview when file changes
  useEffect(() => {
    if (coverImageFile) {
      const objectUrl = URL.createObjectURL(coverImageFile);
      setCoverImagePreview(objectUrl);
      
      return () => URL.revokeObjectURL(objectUrl);
    }
  }, [coverImageFile]);

  // Define savePostAsDraft before useEffect
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
        
        if (response?.$id) {
          setLocalInitialData({ 
            ...localInitialData, 
            id: response.$id,
            title: title,
            content: postData.content,
            status: 'draft'
          });
          setLocalMode('edit');
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
      }, 5000);
    }
    
    return () => {
      if (successMessageTimerRef.current) {
        clearTimeout(successMessageTimerRef.current);
      }
    };
  }, [successMessage]);

  const handleCoverImageClick = () => {
    coverImageInputRef.current?.click();
  };

  const handleCoverImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setCoverImageFile(file);
    setHasChanges(true);
  };

  const removeCoverImage = () => {
    setCoverImageFile(null);
    setCoverImagePreview(null);
    if (coverImageInputRef.current) {
      coverImageInputRef.current.value = '';
    }
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
      <div className="border border-input bg-transparent rounded-md mb-2">
        <div className="flex flex-wrap gap-1 p-1">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
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
              </TooltipTrigger>
              <TooltipContent>Heading 1</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
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
              </TooltipTrigger>
              <TooltipContent>Heading 2</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
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
              </TooltipTrigger>
              <TooltipContent>Heading 3</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <Separator orientation="vertical" className="h-6 mx-1" />

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
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
              </TooltipTrigger>
              <TooltipContent>Bold</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
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
              </TooltipTrigger>
              <TooltipContent>Italic</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
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
              </TooltipTrigger>
              <TooltipContent>Highlight</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <Separator orientation="vertical" className="h-6 mx-1" />

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
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
              </TooltipTrigger>
              <TooltipContent>Bullet List</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
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
              </TooltipTrigger>
              <TooltipContent>Ordered List</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
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
              </TooltipTrigger>
              <TooltipContent>Quote</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <Separator orientation="vertical" className="h-6 mx-1" />

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" onClick={handleImageUploadClick}>
                  <ImageIcon className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Insert Image</TooltipContent>
            </Tooltip>
          </TooltipProvider>

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

  const handleSaveClick = () => {
    savePostAsDraft();
  };

  const renderSaveStatus = () => {
    if (isSaving) {
      return <span className="text-sm text-muted-foreground flex items-center"><Clock className="h-3 w-3 mr-1 animate-spin" /> Saving...</span>;
    }
    if (lastSaved) {
      return <span className="text-sm text-muted-foreground flex items-center"><Clock className="h-3 w-3 mr-1" /> Last saved: {lastSaved.toLocaleTimeString()}</span>;
    }
    return null;
  };

  const getLabelIcon = (label: string) => {
    switch(label) {
      case 'Work': return <Briefcase className="h-4 w-4" />;
      case 'Philosophy': return <BookMarked className="h-4 w-4" />;
      case 'Art': return <Palette className="h-4 w-4" />;
      case 'literature': return <BookOpen className="h-4 w-4" />;
      case 'Cinema': return <Film className="h-4 w-4" />;
      default: return <Briefcase className="h-4 w-4" />;
    }
  };

  const getVisibilityIcon = () => {
    switch(visibility) {
      case 'public': return <Eye className="h-4 w-4" />;
      case 'private': return <EyeOff className="h-4 w-4" />;
      case 'groups': return <Users className="h-4 w-4" />;
      default: return <Eye className="h-4 w-4" />;
    }
  };

  // Get color based on post label
  const getLabelGradientColors = () => {
    switch(postLabel) {
      case 'Work': 
        return 'from-blue-500/10 via-background to-blue-500/20';
      case 'Philosophy': 
        return 'from-purple-500/10 via-background to-purple-500/20';
      case 'Art': 
        return 'from-pink-500/10 via-background to-pink-500/20';
      case 'literature': 
        return 'from-amber-500/10 via-background to-amber-500/20';
      case 'Cinema': 
        return 'from-red-500/10 via-background to-red-500/20';
      default: 
        return 'from-primary/10 via-background to-primary/20';
    }
  };

  // Get gradient direction based on active tab
  const getGradientDirection = () => {
    switch(activeTab) {
      case 'content': return 'bg-gradient-to-br';
      case 'settings': return 'bg-gradient-to-tr';
      case 'visibility': return 'bg-gradient-to-r';
      default: return 'bg-gradient-to-br';
    }
  };

  return (
    <div className="max-w-5xl mx-auto relative p-6 sm:p-8 md:p-10 mt-4 rounded-xl ring-1 ring-white/10 ring-inset backdrop-blur-sm">
      <div className={`absolute inset-0 ${getGradientDirection()} ${getLabelGradientColors()} rounded-xl -z-10 backdrop-blur-sm shadow-xl transition-all duration-500 overflow-hidden`}>
        <div className="absolute inset-0 opacity-20">
          <div className="absolute -inset-[100%] animate-pulse bg-gradient-radial from-white/20 via-transparent to-transparent blur-xl"></div>
        </div>
      </div>
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center">
          <Link href="/" className="mr-2">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">{mode === 'create' ? 'Create New Post' : 'Edit Post'}</h1>
        </div>
        <div className="flex items-center gap-2">
          {renderSaveStatus()}
        </div>
      </div>

      {error && (
        <div className="bg-destructive/10 text-destructive p-3 rounded-md mb-4 flex items-center">
          <X className="h-4 w-4 mr-2" />
          {error}
        </div>
      )}
      
      {successMessage && (
        <div className="bg-green-500/10 text-green-700 p-3 rounded-md mb-4 flex justify-between items-center">
          <span className="flex items-center">
            <Save className="h-4 w-4 mr-2" />
            {successMessage}
          </span>
          {postStatus === 'draft' && (
            <Button variant="outline" size="sm" asChild>
              <Link href="/my-drafts">View My Drafts</Link>
            </Button>
          )}
        </div>
      )}

      <form onSubmit={(e) => handleSubmit(e, false)}>
        <Tabs defaultValue="content" value={activeTab} onValueChange={setActiveTab} className="mb-6">
          <TabsList className="grid grid-cols-3 mb-4">
            <TabsTrigger value="content" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Content
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <LayoutGrid className="h-4 w-4" />
              Settings
            </TabsTrigger>
            <TabsTrigger value="visibility" className="flex items-center gap-2">
              {getVisibilityIcon()}
              Visibility
            </TabsTrigger>
          </TabsList>

          {/* Content Tab */}
          <TabsContent value="content" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>
                  <Input
                    id="title"
                    placeholder="Enter a title..."
                    value={title}
                    onChange={(e) => {
                      setTitle(e.target.value);
                      setHasChanges(true);
                    }}
                    className="text-xl border-none px-0 focus-visible:ring-0 focus-visible:ring-offset-0 font-bold"
                  />
                </CardTitle>
                <CardDescription>Write your post content below</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <MenuBar />
                    <div className="border rounded-md">
                      <EditorContent editor={editor} />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Post Settings</CardTitle>
                <CardDescription>Configure your post&apos;s appearance and type</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="post-type" className="text-base font-medium mb-2 block">Post Type</Label>
                    <div className="grid grid-cols-2 gap-4">
                      <div 
                        className={cn(
                          "flex flex-col items-center border rounded-lg p-4 cursor-pointer transition-all",
                          postType === 'standard' ? "border-primary bg-primary/5" : "border-input hover:border-primary/50"
                        )}
                        onClick={() => setPostType('standard')}
                      >
                        <FileText className="h-8 w-8 mb-2" />
                        <span className="font-medium">Standard Post</span>
                        <span className="text-xs text-muted-foreground mt-1">Short-form content</span>
                      </div>
                      <div 
                        className={cn(
                          "flex flex-col items-center border rounded-lg p-4 cursor-pointer transition-all",
                          postType === 'blog' ? "border-primary bg-primary/5" : "border-input hover:border-primary/50"
                        )}
                        onClick={() => setPostType('blog')}
                      >
                        <Bookmark className="h-8 w-8 mb-2" />
                        <span className="font-medium">Blog Post</span>
                        <span className="text-xs text-muted-foreground mt-1">Long-form content</span>
                      </div>
                    </div>
                  </div>

                  {postType === 'standard' && (
                    <div className="pt-2">
                      <Label htmlFor="post-label" className="text-base font-medium mb-2 block">Post Label</Label>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
                        {(['Work', 'Philosophy', 'Art', 'literature', 'Cinema'] as const).map((label) => (
                          <div
                            key={label}
                            className={cn(
                              "flex items-center justify-center border rounded-md p-2 gap-2 cursor-pointer transition-all",
                              postLabel === label ? "border-primary bg-primary/5" : "border-input hover:border-primary/50"
                            )}
                            onClick={() => setPostLabel(label)}
                          >
                            {getLabelIcon(label)}
                            <span>{label}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="pt-4">
                    <Label htmlFor="cover-image" className="text-base font-medium mb-2 block">Cover Image</Label>
                    <div 
                      className={cn(
                        "border-2 border-dashed rounded-lg p-4 text-center cursor-pointer hover:border-primary/50 transition-all",
                        coverImagePreview ? "border-primary" : "border-input"
                      )}
                      onClick={handleCoverImageClick}
                    >
                      {coverImagePreview ? (
                        <div className="relative">
                          <img 
                            src={coverImagePreview} 
                            alt="Cover preview" 
                            className="rounded-md max-h-[200px] mx-auto object-cover"
                          />
                          <Button 
                            type="button" 
                            variant="destructive" 
                            size="icon"
                            className="absolute top-2 right-2 h-8 w-8 rounded-full"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeCoverImage();
                            }}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <div className="py-8 flex flex-col items-center">
                          <ImageIcon className="h-12 w-12 mb-2 text-muted-foreground" />
                          <p className="text-muted-foreground font-medium">Click to upload cover image</p>
                          <p className="text-xs text-muted-foreground mt-1">Recommended size: 1200 x 630px</p>
                        </div>
                      )}
                      <input
                        id="cover-image"
                        type="file"
                        accept="image/*"
                        ref={coverImageInputRef}
                        className="hidden"
                        onChange={handleCoverImageChange}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Visibility Tab */}
          <TabsContent value="visibility" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Visibility Settings</CardTitle>
                <CardDescription>Control who can see your post</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label htmlFor="visibility" className="text-base font-medium mb-2 block">Who can see this post?</Label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div 
                      className={cn(
                        "flex flex-col border rounded-lg p-4 cursor-pointer transition-all",
                        visibility === 'public' ? "border-primary bg-primary/5" : "border-input hover:border-primary/50"
                      )}
                      onClick={() => setVisibility('public')}
                    >
                      <div className="flex items-center mb-2">
                        <Eye className="h-5 w-5 mr-2" />
                        <span className="font-medium">Public</span>
                      </div>
                      <p className="text-sm text-muted-foreground">Everyone can see this post</p>
                    </div>

                    <div 
                      className={cn(
                        "flex flex-col border rounded-lg p-4 cursor-pointer transition-all",
                        visibility === 'private' ? "border-primary bg-primary/5" : "border-input hover:border-primary/50"
                      )}
                      onClick={() => setVisibility('private')}
                    >
                      <div className="flex items-center mb-2">
                        <EyeOff className="h-5 w-5 mr-2" />
                        <span className="font-medium">Private</span>
                      </div>
                      <p className="text-sm text-muted-foreground">Only you can see this post</p>
                    </div>

                    <div 
                      className={cn(
                        "flex flex-col border rounded-lg p-4 cursor-pointer transition-all",
                        visibility === 'groups' ? "border-primary bg-primary/5" : "border-input hover:border-primary/50"
                      )}
                      onClick={() => setVisibility('groups')}
                    >
                      <div className="flex items-center mb-2">
                        <Users className="h-5 w-5 mr-2" />
                        <span className="font-medium">Specific Groups</span>
                      </div>
                      <p className="text-sm text-muted-foreground">Only members of selected groups</p>
                    </div>
                  </div>
                </div>

                {visibility === 'groups' && (
                  <div className="pt-2">
                    <Label className="text-base font-medium mb-2 block">Select Groups</Label>
                    {groups.length === 0 ? (
                      <div className="text-center p-4 border border-dashed rounded-md">
                        <p className="text-muted-foreground">You don&apos;t have any groups yet</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[300px] overflow-y-auto p-2">
                        {groups.map((group) => (
                          <div key={group.$id} className="flex items-center space-x-2 border rounded-md p-2">
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
                            <Label htmlFor={group.$id} className="flex-1">{group.name}</Label>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex flex-wrap justify-between items-center gap-3 mt-6">
          <div className="flex gap-3">
            <Button 
              type="button" 
              variant="outline" 
              disabled={isLoading || isSaving} 
              onClick={handleSaveAsDraftClick}
              className="flex items-center gap-2"
            >
              <Bookmark className="h-4 w-4" />
              Save as Draft
            </Button>
            
            <Button 
              type="submit" 
              disabled={isLoading || isSaving}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              {postStatus === 'draft' ? 'Publish' : 'Post'}
            </Button>
          </div>
          
          <div className="flex gap-3">
            <Button 
              type="button" 
              variant="ghost" 
              disabled={!hasChanges || isLoading || isSaving}
              onClick={handleSaveClick}
              className="flex items-center gap-2"
            >
              <Save className="h-4 w-4" />
              Save
            </Button>
            
            <Button 
              type="button" 
              variant="link" 
              asChild
            >
              <Link href="/my-drafts">My Drafts</Link>
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
} 