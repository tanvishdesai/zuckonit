'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import { getPost, getImageUrl } from '@/lib/appwrite';
import { TiptapContentRenderer } from '@/components/ui/TiptapContentRenderer';
import Image from 'next/image';
import { format } from 'date-fns';
import { Loader2, Download } from 'lucide-react';
import html2canvas from 'html2canvas';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useTheme } from '@/app/components/ThemeProvider';
import type { Models } from 'appwrite'; // Import Models type

// Define a type for the post data - adjusted to align with Appwrite document structure
interface PostData extends Models.Document { // Extend base Document
  title: string;
  content: string;
  image?: string | null; // Assuming 'image' is the field name in Appwrite for imageId
  user_name?: string; // Assuming 'user_name'
  // $id, $createdAt, $updatedAt, $collectionId, $databaseId, $permissions are inherited
}

export default function SharePostPage() {
  const params = useParams();
  const postId = params.postId as string;
  const [post, setPost] = useState<PostData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const shareContainerRef = useRef<HTMLDivElement>(null);
  const { applyTheme } = useTheme();

  // Ensure dark mode is properly applied
  useEffect(() => {
    // Apply theme from localStorage
    applyTheme();
  }, [applyTheme]);

  useEffect(() => {
    if (!postId) return;

    const fetchPost = async () => {
      setLoading(true);
      setError(null);
      try {
        const postDocument = await getPost(postId); // Fetch the document
        // Now, cast it safely after fetching, assuming the fields match
        // If fields differ significantly, manual mapping is better
        setPost(postDocument as PostData);
      } catch (err) {
        console.error("Error fetching post for sharing:", err);
        // Handle Appwrite 404 specifically if desired
        if (err instanceof Error && 'code' in err) {
          if (err.code === 404) {
            setError("Post not found. It might have been deleted or made private.");
          } else {
            setError("Failed to load post.");
          }
        } else {
          setError("An unexpected error occurred.");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchPost();
  }, [postId]);

  const handleExportImage = async () => {
    if (!shareContainerRef.current) {
      toast.error("Could not find content to export.");
      return;
    }
    if (isExporting || !post) return;

    setIsExporting(true);
    toast.info("Generating image...");

    try {
      // Get content size to determine appropriate dimensions
      const contentElement = shareContainerRef.current.querySelector('.prose');
      const contentText = contentElement?.textContent || '';
      
      // Calculate roughly how much space we need based on content length
      // This is an approximation - longer content needs more vertical space
      const contentLength = contentText.length;
      let aspectRatio = 1.5; // Default aspect ratio (3:2)
      
      if (contentLength > 5000) {
        aspectRatio = 2.5; // Very long content - make taller image (5:2)
      } else if (contentLength > 2000) {
        aspectRatio = 2; // Medium-long content (2:1)
      }
      
      // Create a temporary div for export that will be sized exactly as needed
      const exportContainer = document.createElement('div');
      exportContainer.id = 'temp-export-container';
      exportContainer.style.position = 'absolute';
      exportContainer.style.left = '-9999px';
      exportContainer.style.backgroundColor = '#ffffff';
      exportContainer.style.width = '1200px'; // Fixed width for consistent results
      document.body.appendChild(exportContainer);
      
      // Set dimensions based on content
      const totalWidth = 1200;
      const totalHeight = Math.round(totalWidth * aspectRatio);
      
      // Set image height - for longer content, make image relatively smaller
      const imageHeightRatio = contentLength > 3000 ? 0.25 : contentLength > 1000 ? 0.3 : 0.4;
      const imageHeight = Math.round(totalHeight * imageHeightRatio);
      
      // Get theme mode for styling
      const isDarkMode = document.documentElement.classList.contains('dark');
      const themeColors = isDarkMode ? {
        bg: '#121212',
        cardBg: '#1e1e1e',
        text: '#ffffff',
        subtext: '#a0a0a0',
        accent: '#6d28d9', // Purple accent
        border: '#2a2a2a',
        gradient: 'linear-gradient(135deg, #1e1e1e 0%, #121212 100%)'
      } : {
        bg: '#f8f9fc',
        cardBg: '#ffffff',
        text: '#1a1a1a',
        subtext: '#64748b',
        accent: '#8b5cf6', // Purple accent
        border: '#e2e8f0',
        gradient: 'linear-gradient(135deg, #f8f9fc 0%, #edf2f7 100%)'
      };
      
      // Format date with more style
      const formattedDate = format(new Date(post.$createdAt), 'MMMM d, yyyy');
      
      // Prepare image HTML with better scaling
      let imageHtml = '';
      if (post.image) {
        const imgSrc = getImageUrl(post.image).toString();
        imageHtml = `
          <div style="
            width: 100%; 
            height: ${imageHeight}px; 
            overflow: hidden; 
            position: relative;
            background: ${themeColors.gradient};
            display: flex;
            align-items: center;
            justify-content: center;
          ">
            <img 
              src="${imgSrc}" 
              alt="${post.title}" 
              style="
                max-width: 100%; 
                max-height: 100%; 
                object-fit: contain;
                margin: 0 auto;
              "
              crossorigin="anonymous"
            />
            <div style="position: absolute; bottom: 0; left: 0; right: 0; height: 100px; 
              background: linear-gradient(to top, ${themeColors.bg}CC, transparent);">
            </div>
          </div>
        `;
      } else {
        // If no image, create a gradient header with pattern
        imageHtml = `
          <div style="width: 100%; height: ${imageHeight}px; overflow: hidden; position: relative; 
            background: ${themeColors.gradient};">
            <div style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; opacity: 0.1; 
              background-image: url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCI+CjxyZWN0IHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgZmlsbD0ibm9uZSI+PC9yZWN0Pgo8cGF0aCBkPSJNNjAgMzBDNjAgNDYuNTY5IDQ2LjU2OSA2MCAzMCA2MFMwIDQ2LjU2OSAwIDMwIDE1LjQzMSAwIDMwIDBzMzAgMTMuNDMxIDMwIDMweiIgZmlsbD0iI2ZmZmZmZjEwIj48L3BhdGg+Cjwvc3ZnPg==');">
            </div>
          </div>
        `;
      }
      
      // Determine content container height based on total height
      const contentContainerHeight = totalHeight - imageHeight - 200; // Adjusted to leave space for header/footer

      // Clone the content from the original container and sanitize for export
      const contentHTML = contentElement ? sanitizeContent(contentElement.innerHTML) : '';
      
      // Create HTML with improved structure and design
      exportContainer.innerHTML = `
        <div class="export-wrapper" style="
          background-color: ${themeColors.bg}; 
          padding: 0; 
          width: ${totalWidth}px; 
          height: ${totalHeight}px; 
          display: flex; 
          flex-direction: column;
          font-family: 'Inter', 'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif;
        ">
          ${imageHtml}
          
          <div style="
            padding: 50px 60px; 
            background-color: ${themeColors.cardBg}; 
            margin: -40px 40px 40px;
            border-radius: 12px;
            box-shadow: 0 10px 30px rgba(0,0,0,${isDarkMode ? '0.3' : '0.1'});
            position: relative;
            z-index: 10;
            border: 1px solid ${themeColors.border};
            flex-grow: 1;
            max-height: ${contentContainerHeight}px;
            display: flex;
            flex-direction: column;
          ">
            <!-- Brand Logo/Watermark -->
            <div style="
              position: absolute;
              top: 20px;
              right: 20px;
              font-size: 14px;
              font-weight: bold;
              color: ${themeColors.accent};
              opacity: 0.8;
            ">
              zuckonit
            </div>
            
            <!-- Title with decorative element -->
            <div style="position: relative; padding-left: 20px; margin-bottom: 24px; flex-shrink: 0;">
              <div style="
                position: absolute;
                left: 0;
                top: 8px;
                bottom: 8px;
                width: 4px;
                background: ${themeColors.accent};
                border-radius: 4px;
              "></div>
              <h1 style="
                font-size: 36px; 
                font-weight: 800; 
                margin: 0 0 16px 0; 
                color: ${themeColors.text};
                line-height: 1.2;
              ">
                ${post.title}
              </h1>
              
              <!-- Author and date with icon -->
              <div style="
                display: flex; 
                align-items: center; 
                font-size: 15px; 
                color: ${themeColors.subtext};
                margin-bottom: 8px;
              ">
                ${post.user_name ? `
                <div style="display: flex; align-items: center;">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="margin-right: 6px;">
                    <path d="M12 12C14.21 12 16 10.21 16 8C16 5.79 14.21 4 12 4C9.79 4 8 5.79 8 8C8 10.21 9.79 12 12 12ZM12 14C9.33 14 4 15.34 4 18V20H20V18C20 15.34 14.67 14 12 14Z" fill="${themeColors.subtext}"/>
                  </svg>
                  <span style="font-weight: 500;">${post.user_name}</span>
                </div>
                <span style="margin: 0 10px; opacity: 0.5;">•</span>
                ` : ''}
                <div style="display: flex; align-items: center;">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="margin-right: 6px;">
                    <path d="M12 2C6.5 2 2 6.5 2 12C2 17.5 6.5 22 12 22C17.5 22 22 17.5 22 12C22 6.5 17.5 2 12 2ZM16.2 16.2L11 13V7H12.5V12.2L17 14.9L16.2 16.2Z" fill="${themeColors.subtext}"/>
                  </svg>
                  <span>${formattedDate}</span>
                </div>
              </div>
            </div>
            
            <!-- Decorative separator -->
            <div style="
              height: 1px; 
              background: linear-gradient(to right, ${themeColors.accent}80, transparent);
              margin: 24px 0;
              flex-shrink: 0;
            "></div>
            
            <!-- Content with improved typography -->
            <div style="
              font-size: ${contentLength > 3000 ? '14px' : '16px'}; 
              line-height: 1.8; 
              color: ${themeColors.text};
              overflow-y: auto;
              flex-grow: 1;
              word-break: break-word;
            ">
              ${contentHTML}
            </div>
          </div>
          
          <!-- Footer with subtle branding -->
          <div style="
            padding: 0 40px 40px;
            text-align: center;
            color: ${themeColors.subtext};
            font-size: 12px;
            opacity: 0.7;
            flex-shrink: 0;
          ">
            Shared via zuckonit • ${new Date().getFullYear()}
          </div>
        </div>
      `;
      
      // Helper function to sanitize content for export
      function sanitizeContent(html: string) {
        // Create a temporary div to manipulate content
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = html;
        
        // Find all images and ensure they have proper sizing
        const images = tempDiv.querySelectorAll('img');
        images.forEach(img => {
          img.style.maxWidth = '100%';
          img.style.height = 'auto';
          img.style.objectFit = 'contain';
          img.style.marginLeft = 'auto';
          img.style.marginRight = 'auto';
          img.style.display = 'block';
        });
        
        // Find all tables and ensure they're formatted properly
        const tables = tempDiv.querySelectorAll('table');
        tables.forEach(table => {
          table.style.width = '100%';
          table.style.borderCollapse = 'collapse';
          table.style.marginBottom = '1em';
        });
        
        // Find all pre (code blocks) elements and ensure they're formatted correctly
        const preElements = tempDiv.querySelectorAll('pre');
        preElements.forEach(pre => {
          pre.style.overflowX = 'auto';
          pre.style.backgroundColor = isDarkMode ? '#1e1e1e' : '#f5f5f5';
          pre.style.padding = '1em';
          pre.style.borderRadius = '4px';
          pre.style.fontSize = '0.9em';
        });
        
        // Return the sanitized content
        return tempDiv.innerHTML;
      }
      
      // Wait for images to load properly
      await new Promise(resolve => {
        // Get all images in the container
        const images = exportContainer.querySelectorAll('img');
        let loadedImages = 0;
        const totalImages = images.length;
        
        // If no images, resolve immediately
        if (totalImages === 0) {
          resolve(true);
          return;
        }
        
        // Function to handle image load
        const onImageLoad = () => {
          loadedImages++;
          if (loadedImages === totalImages) {
            resolve(true);
          }
        };
        
        // Set up load event handlers
        images.forEach(img => {
          if (img.complete) {
            onImageLoad();
          } else {
            img.addEventListener('load', onImageLoad);
            img.addEventListener('error', () => {
              onImageLoad(); // Count errors as loaded to avoid hanging
            });
          }
        });
        
        // Fallback timeout in case images don't load
        setTimeout(() => {
          resolve(true);
        }, 3000);
      });
      
      // Delay to ensure DOM updates are processed
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Use html2canvas with the temporary container and custom hooks
      const canvas = await html2canvas(exportContainer as HTMLElement, {
        allowTaint: true,
        useCORS: true,
        logging: false,
        scale: 2,
        backgroundColor: themeColors.bg,
        imageTimeout: 30000
      });
      
      // Clean up the temporary container
      document.body.removeChild(exportContainer);
      
      // Download the image
      const dataUrl = canvas.toDataURL('image/png', 1.0);
      const link = document.createElement('a');
      link.href = dataUrl;
      const sanitizedTitle = post.title.replace(/[^a-z0-9]/gi, '_').toLowerCase() || 'post';
      link.download = `${sanitizedTitle}_share.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("Image downloaded!");
    } catch (err) {
      console.error("Error exporting image:", err);
      toast.error("Failed to export image. See console for details.");
    } finally {
      setIsExporting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-white dark:bg-black">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return <div className="flex justify-center items-center min-h-screen bg-white dark:bg-black text-red-500 p-4 text-center">{error}</div>;
  }

  if (!post) {
    // This case might be covered by the error state if fetch fails
    return <div className="flex justify-center items-center min-h-screen bg-white dark:bg-black">Post not found.</div>;
  }

  // Basic layout for sharing
  return (
    <div className="flex flex-col justify-center items-center min-h-screen bg-gradient-to-br from-gray-100 to-gray-200 dark:from-black dark:to-black p-4 sm:p-8">
      <div
        id="share-container"
        ref={shareContainerRef}
        className="bg-white dark:bg-black rounded-lg shadow-xl overflow-hidden max-w-2xl w-full border border-gray-200 dark:border-gray-700 mb-6"
      >
        {post.image && (
          <div className="relative w-full" style={{ paddingTop: '56.25%' }}> {/* 16:9 aspect ratio */}
            <Image
              src={getImageUrl(post.image).toString()}
              alt={post.title}
              fill
              className="object-cover absolute inset-0 w-full h-full"
              priority
              crossOrigin="anonymous"
              sizes="(max-width: 2xl) 100vw, 2xl"
            />
          </div>
        )}
        <div className="p-6 sm:p-8 text-gray-900 dark:text-white">
          <h1 className="text-2xl sm:text-3xl font-bold mb-3 text-gray-900 dark:text-white">{post.title}</h1>
          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-300 mb-4">
            {post.user_name && ( // Use user_name
              <>
                <span>By {post.user_name}</span>
                <span>•</span>
              </>
            )}
            <span>{format(new Date(post.$createdAt), 'PPP')}</span>
          </div>
          <hr className="my-4 border-gray-200 dark:border-gray-700" />
          <TiptapContentRenderer
            content={post.content}
            className="prose prose-sm sm:prose-base dark:prose-invert max-w-none prose-headings:my-2 prose-p:my-1.5"
          />
        </div>
      </div>
      {/* Export Button outside the container */}
      <Button
        onClick={handleExportImage}
        disabled={isExporting || loading}
        className="flex items-center gap-2 transition-all hover:scale-105 active:scale-95"
      >
        {isExporting ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Download className="h-4 w-4" />
        )}
        <span>{isExporting ? 'Exporting...' : 'Export as Image'}</span>
      </Button>
    </div>
  );
} 