'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { formatDistance } from 'date-fns';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { createComment, getComments, deleteComment } from '@/lib/appwrite';
import { MessageCircle, X, Loader2 } from 'lucide-react';

type Comment = {
  $id: string;
  content: string;
  created_at: string;
  user_id: string;
  user_name: string;
  post_id: string;
};

interface CommentsProps {
  postId: string;
}

export function Comments({ postId }: CommentsProps) {
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchComments = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getComments(postId);
      // Cast the documents to Comment type
      setComments(data.documents as unknown as Comment[]);
      setError(null);
    } catch (err) {
      console.error('Error fetching comments:', err);
      setError('Failed to load comments');
    } finally {
      setLoading(false);
    }
  }, [postId]);

  // Fetch comments on mount
  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      setError('Please log in to comment');
      return;
    }
    
    if (!newComment.trim()) {
      return;
    }
    
    try {
      setSubmitting(true);
      await createComment(postId, newComment);
      setNewComment('');
      fetchComments(); // Refresh comments
      setError(null);
    } catch (err) {
      console.error('Error creating comment:', err);
      setError('Failed to post your comment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!user) return;
    
    if (!confirm('Are you sure you want to delete this comment?')) {
      return;
    }
    
    try {
      await deleteComment(commentId);
      setComments(comments.filter(comment => comment.$id !== commentId));
    } catch (err) {
      console.error('Error deleting comment:', err);
      setError('Failed to delete comment');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <MessageCircle className="mr-2 h-5 w-5" />
            Comments ({comments.length})
          </CardTitle>
        </CardHeader>
        
        {user ? (
          <CardContent>
            <form onSubmit={handleSubmitComment} className="space-y-4">
              <Textarea
                placeholder="Write a comment..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="min-h-24 resize-none"
              />
              <div className="flex justify-end">
                <Button type="submit" disabled={submitting || !newComment.trim()}>
                  {submitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Posting...
                    </>
                  ) : (
                    'Post Comment'
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        ) : (
          <CardContent>
            <p className="text-center text-muted-foreground py-4">
              Please <a href="/login" className="text-primary underline">log in</a> to post a comment
            </p>
          </CardContent>
        )}
      </Card>

      {error && (
        <div className="bg-destructive/10 text-destructive p-3 rounded-md text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : comments.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <MessageCircle className="h-8 w-8 mx-auto mb-2 opacity-20" />
          <p>No comments yet. Be the first to comment!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {comments.map((comment) => (
            <Card key={comment.$id} className="overflow-hidden hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {comment.user_name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-sm">{comment.user_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDistance(new Date(comment.created_at), new Date(), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                  
                  {user && user.$id === comment.user_id && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => handleDeleteComment(comment.$id)}
                      className="h-7 w-7 p-0 rounded-full text-muted-foreground hover:text-destructive"
                    >
                      <X className="h-4 w-4" />
                      <span className="sr-only">Delete comment</span>
                    </Button>
                  )}
                </div>
                
                <div className="pl-10">
                  <p className="text-sm whitespace-pre-line">{comment.content}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
} 