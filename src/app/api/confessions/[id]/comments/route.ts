import { NextRequest, NextResponse } from 'next/server';
import { getConfessionComments, createConfessionComment } from '@/lib/db-utils';
import { createRateLimit } from '@/lib/rate-limit';
import { sanitizeInput } from '@/lib/security-utils';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const comments = await getConfessionComments(id);
    return NextResponse.json(comments);
  } catch (error) {
    console.error('Error fetching comments:', error);
    return NextResponse.json({ error: 'Failed to fetch comments' }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Apply rate limiting for comments (more generous than confessions)
    const COMMENT_RATE_LIMIT = {
      maxAttempts: 50, // 50 comments per 5 minutes
      windowMs: 5 * 60 * 1000, // 5 minutes
    };
    
    const rateLimit = createRateLimit(COMMENT_RATE_LIMIT);
    const rateLimitResult = rateLimit(req);
    
    if (rateLimitResult) {
      return rateLimitResult;
    }

    const { id } = await params;
    const { content, authorId, isAnonymous = true, parentId } = await req.json();

    // Input validation
    if (!content || !authorId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Sanitize input
    const sanitizedContent = sanitizeInput(content);

    // Content length validation
    if (sanitizedContent.length > 1000) {
      return NextResponse.json({ error: 'Comment too long (max 1000 characters)' }, { status: 400 });
    }

    if (sanitizedContent.trim().length === 0) {
      return NextResponse.json({ error: 'Comment cannot be empty' }, { status: 400 });
    }

    const comment = await createConfessionComment({
      content: sanitizedContent,
      authorId,
      confessionId: id,
      isAnonymous,
      parentId,
    });

    return NextResponse.json(comment);
  } catch (error) {
    console.error('Error creating comment:', error);
    return NextResponse.json({ error: 'Failed to create comment' }, { status: 500 });
  }
} 