'use client';
import { useState, useEffect } from 'react';
import { User as UserIcon, Send, Reply } from 'lucide-react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useKindeBrowserClient } from '@kinde-oss/kinde-auth-nextjs';

interface Comment {
  id: string;
  content: string;
  authorId: string;
  isAnonymous: boolean;
  parentId?: string;
  createdAt: string;
  author: {
    id: string;
    name?: string;
    image?: string;
  };
  replies?: Comment[];
}

interface CommentSectionProps {
  confessionId: string;
  isVisible: boolean;
  onClose?: () => void;
  updateCommentCount: (confessionId: string, newCount: number) => void;
}

export function CommentSection({ confessionId, isVisible, onClose, updateCommentCount }: CommentSectionProps) {
  const { user } = useKindeBrowserClient();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchComments = async () => {
    if (!isVisible) return;
    
    setLoading(true);
    try {
      const response = await fetch(`/api/confessions/${confessionId}/comments`);
      if (response.ok) {
        const data = await response.json();
        setComments(data);
      }
    } catch (error) {
      console.error('Error fetching comments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitComment = async () => {
    if (!user?.id || !newComment.trim()) return;

    setSubmitting(true);
    try {
      const response = await fetch(`/api/confessions/${confessionId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: newComment.trim(),
          authorId: user.id,
          isAnonymous: false,
        }),
      });

      if (response.ok) {
        const newCommentData = await response.json();
        setComments(prev => [newCommentData, ...prev]);
        setNewComment('');
        updateCommentCount(confessionId, comments.length + 1);
      }
    } catch (error) {
      console.error('Error submitting comment:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitReply = async (parentId: string) => {
    if (!user?.id || !replyContent.trim()) return;

    setSubmitting(true);
    try {
      const response = await fetch(`/api/confessions/${confessionId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: replyContent.trim(),
          authorId: user.id,
          isAnonymous: false,
          parentId,
        }),
      });

      if (response.ok) {
        const newReply = await response.json();
        setComments(prev =>
          prev.map(comment =>
            comment.id === parentId
              ? { ...comment, replies: [...(comment.replies || []), newReply] }
              : comment
          )
        );
        setReplyContent('');
        setReplyingTo(null);
        // Note: A reply also increases the total comment count
        const totalComments = comments.reduce((acc, c) => acc + 1 + (c.replies?.length || 0), 0) + 1;
        updateCommentCount(confessionId, totalComments);
      }
    } catch (error) {
      console.error('Error submitting reply:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return "Just now";
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    return date.toLocaleDateString();
  };

  useEffect(() => {
    fetchComments();
  }, [isVisible, confessionId]);

  if (!isVisible) return null;

  return (
    <div className="border-t border-gray-200 bg-gray-50 p-4 lg:p-6 mt-6 rounded-b-[12px]">
      <div className="space-y-4">
        {/* Comment Input */}
        {user ? (
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="flex items-start gap-3">
              {user.picture ? (
                <Image
                  src={user.picture}
                  alt={user.given_name || "User"}
                  width={32}
                  height={32}
                  className="rounded-full object-cover"
                />
              ) : (
                <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                  <UserIcon className="w-4 h-4 text-gray-500" />
                </div>
              )}
              <div className="flex-1">
                <Textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Write a comment..."
                  className="min-h-[10px] text-gray-800 resize-none border-0 focus:ring-0 p-2"
                  disabled={submitting}
                />
                <div className="flex justify-between items-center mt-3">
                  <span className="text-xs text-gray-500">Commenting as {user.given_name || 'You'}</span>
                  <Button
                    onClick={handleSubmitComment}
                    disabled={!newComment.trim() || submitting}
                    size="sm"
                    className="bg-blue-300 hover:bg-blue-600"
                  >
                    <Send className="w-4 h-4 mr-2" />
                    {submitting ? 'Posting...' : 'Post'}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg p-4 border border-gray-200 text-center text-gray-500">
            Please log in to comment
          </div>
        )}

        {/* Comments List */}
        {loading ? (
          <div className="text-center py-1 text-gray-500">Loading comments...</div>
        ) : comments.length === 0 ? (
          <div className="text-center py-1 text-gray-500">
            No comments yet. Be the first to comment!
          </div>
        ) : (
          <div className="space-y-4">
            {comments.map((comment) => (
              <div key={comment.id} className="bg-white rounded-lg p-4 border border-gray-200">
                {/* Main Comment */}
                <div className="flex items-start gap-3">
                  {comment.author?.image && !comment.isAnonymous ? (
                    <Image
                      src={comment.author.image}
                      alt={comment.author.name || "User"}
                      width={32}
                      height={32}
                      className="rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                      <UserIcon className="w-4 h-4 text-gray-500" />
                    </div>
                  )}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-sm text-gray-800">
                        {comment.isAnonymous ? 'Anonymous' : comment.author?.name || 'Unknown'}
                      </span>
                      <span className="text-xs text-gray-500">
                        {formatTimeAgo(comment.createdAt)}
                      </span>
                    </div>
                    <p className="text-gray-700 whitespace-pre-line">{comment.content}</p>
                    <button
                      onClick={() => setReplyingTo(comment.id)}
                      className="mt-2 text-xs text-blue-500 hover:text-blue-600 flex items-center gap-1"
                    >
                      <Reply className="w-3 h-3" />
                      Reply
                    </button>
                  </div>
                </div>

                {/* Reply Input */}
                {replyingTo === comment.id && user && (
                  <div className="mt-4 ml-11 bg-gray-50 rounded-lg p-3 border border-gray-200">
                    <Textarea
                      value={replyContent}
                      onChange={(e) => setReplyContent(e.target.value)}
                      placeholder="Write a reply..."
                      className="min-h-[60px] resize-none text-gray-800 bg-white"
                      disabled={submitting}
                    />
                    <div className="flex justify-end gap-2 mt-2">
                      <Button
                        onClick={() => {
                          setReplyingTo(null);
                          setReplyContent('');
                        }}
                        variant="outline"
                        size="sm"
                        disabled={submitting}
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={() => handleSubmitReply(comment.id)}
                        disabled={!replyContent.trim() || submitting}
                        size="sm"
                        className="bg-blue-500 hover:bg-blue-600"
                      >
                        {submitting ? 'Posting...' : 'Reply'}
                      </Button>
                    </div>
                  </div>
                )}

                {/* Replies */}
                {comment.replies && comment.replies.length > 0 && (
                  <div className="mt-4 ml-11 space-y-3">
                    {comment.replies.map((reply) => (
                      <div key={reply.id} className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                        <div className="flex items-start gap-3">
                          {reply.author?.image && !reply.isAnonymous ? (
                            <Image
                              src={reply.author.image}
                              alt={reply.author.name || "User"}
                              width={24}
                              height={24}
                              className="rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center">
                              <UserIcon className="w-3 h-3 text-gray-500" />
                            </div>
                          )}
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-semibold text-xs text-gray-800">
                                {reply.isAnonymous ? 'Anonymous' : reply.author?.name || 'Unknown'}
                              </span>
                              <span className="text-xs text-gray-500">
                                {formatTimeAgo(reply.createdAt)}
                              </span>
                            </div>
                            <p className="text-sm text-gray-700 whitespace-pre-line">{reply.content}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 