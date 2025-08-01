import { NextRequest, NextResponse } from 'next/server';
import { 
  createConfession, 
  getConfessions, 
  getOrCreateUniversity,
  getDailyConfessionCount
} from '@/lib/db-utils';
import { createRateLimit, CONFESSION_RATE_LIMIT } from '@/lib/rate-limit';
import { sanitizeInput, logSecurityEvent } from '@/lib/security-utils';
import prisma from '@/db/prisma';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const universityId = searchParams.get('universityId') || undefined;
    const sortBy = (searchParams.get('sortBy') as 'recent' | 'hot') || 'recent';
    const search = searchParams.get('search') || undefined;

    const userId = searchParams.get('userId') || undefined;
    
    const confessions = await getConfessions({
      page,
      limit,
      universityId,
      sortBy,
      search,
      userId,
    });

    return NextResponse.json(confessions);
  } catch (error) {
    console.error('Error fetching confessions:', error);
    return NextResponse.json({ error: 'Failed to fetch confessions' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    // Apply rate limiting
    const rateLimit = createRateLimit(CONFESSION_RATE_LIMIT);
    const rateLimitResult = rateLimit(req);
    
    if (rateLimitResult) {
      return rateLimitResult;
    }

    const { title, content, authorId, university, isAnonymous } = await req.json();

    // Input validation
    if (!title || !content || !authorId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Check user's plan and daily confession limit
    const user = await prisma.user.findUnique({
      where: { id: authorId },
      select: { plan: true }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check daily limit for free users (1 confession per day)
    if (user.plan === 'free') {
      const dailyCount = await getDailyConfessionCount(authorId);
      
      if (dailyCount >= 1) {
        logSecurityEvent('CONFESSION_LIMIT_EXCEEDED', authorId, { 
          currentCount: dailyCount, 
          limit: 1,
          plan: user.plan 
        });
        return NextResponse.json({ 
          error: 'Daily confession limit reached. Free users can only post 1 confession per day. Upgrade to Plus or Premium to post more.' 
        }, { status: 403 });
      }
    }

    // Check daily limit for plus users (15 confessions per day)
    if (user.plan === 'plus') {
      const dailyCount = await getDailyConfessionCount(authorId);
      
      if (dailyCount >= 15) {
        logSecurityEvent('CONFESSION_LIMIT_EXCEEDED', authorId, { 
          currentCount: dailyCount, 
          limit: 15,
          plan: user.plan 
        });
        return NextResponse.json({ 
          error: 'Daily confession limit reached. Plus users can only post 15 confessions per day. Upgrade to Premium for unlimited posts.' 
        }, { status: 403 });
      }
    }

    // Sanitize inputs
    const sanitizedTitle = sanitizeInput(title);
    const sanitizedContent = sanitizeInput(content);

    // Content length validation
    if (sanitizedTitle.length > 200) {
      return NextResponse.json({ error: 'Title too long (max 200 characters)' }, { status: 400 });
    }

    if (sanitizedContent.length > 5000) {
      return NextResponse.json({ error: 'Content too long (max 5000 characters)' }, { status: 400 });
    }

    if (sanitizedTitle.trim().length === 0) {
      return NextResponse.json({ error: 'Title cannot be empty' }, { status: 400 });
    }

    if (sanitizedContent.trim().length === 0) {
      return NextResponse.json({ error: 'Content cannot be empty' }, { status: 400 });
    }

    let universityId: string | undefined;
    if (university) {
      const uni = await getOrCreateUniversity(university);
      universityId = uni.id;
    }

    const confession = await createConfession({
      title: sanitizedTitle,
      content: sanitizedContent,
      authorId,
      universityId,
      isAnonymous,
    });

    return NextResponse.json(confession);
  } catch (error) {
    console.error('Error creating confession:', error);
    return NextResponse.json({ error: 'Failed to create confession' }, { status: 500 });
  }
} 