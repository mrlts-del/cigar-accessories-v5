import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const createFaqSchema = z.object({
  question: z.string().min(1, 'Question is required'),
  answer: z.string().min(1, 'Answer is required'),
  order: z.number().optional(),
});

async function getUserFromRequest() {
  // Placeholder implementation
  return { role: 'ADMIN' };
}

export async function GET() {
  try {
    const faqs = await prisma.fAQ.findMany({
      orderBy: { order: 'asc' },
    });
    return NextResponse.json(faqs, { status: 200 });
  } catch (error) {
    console.error('Error fetching FAQs:', error);
    return NextResponse.json({ error: 'Failed to fetch FAQs' }, { status: 500 });
  }
}

export async function POST(_request: NextRequest) {
  try {
    const user = await getUserFromRequest();
    if (!user || user.role !== 'ADMIN') {
      return new NextResponse('Unauthorized', { status: 403 });
    }

    const data = await _request.json();
    const validatedData = createFaqSchema.parse(data);

    const faq = await prisma.fAQ.create({
      data: validatedData,
    });

    return NextResponse.json(faq, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request data', details: error.issues }, { status: 400 });
    }
    console.error('Error creating FAQ:', error);
    return NextResponse.json({ error: 'Failed to create FAQ' }, { status: 500 });
  }
}