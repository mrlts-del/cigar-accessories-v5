import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { sendAdminContactNotification, sendContactAutoResponse } from '@/lib/emailService';
import { rateLimit } from '@/lib/rateLimiter';
import { z } from 'zod';

const contactFormSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  subject: z.string().min(1),
  message: z.string().min(1),
  leave_blank: z.string().optional(),
  csrfToken: z.string().min(1),
  recaptchaToken: z.string().min(1), // Add recaptchaToken to schema
});

const RATE_LIMIT_OPTIONS = {
  limit: 5,
  windowMs: 60 * 1000, // 1 minute
};

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const csrfTokenFromCookie = cookieStore.get('csrfToken')?.value;

    const { name, email, subject, message, leave_blank, csrfToken, recaptchaToken } = await request.json();
    
    const recaptchaSecretKey = process.env.RECAPTCHA_SECRET_KEY;
    if (!recaptchaSecretKey) {
      console.error('RECAPTCHA_SECRET_KEY is missing from environment variables');
      return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
    
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('remote-addr') || 'unknown';
    
    try {
      const recaptchaResponse = await fetch('https://www.google.com/recaptcha/api/siteverify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          secret: recaptchaSecretKey,
          response: recaptchaToken,
          remoteip: ip,
        }).toString(),
      });
    
      const recaptchaData = await recaptchaResponse.json();
    
      if (!recaptchaData.success || recaptchaData.score < 0.5 || recaptchaData.action !== 'contactForm') {
        return NextResponse.json({ error: 'reCAPTCHA verification failed' }, { status: 403 });
      }
    } catch (error) {
      console.error('Error verifying reCAPTCHA:', error);
      return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }

    // CSRF token validation
    if (!csrfToken || csrfToken !== csrfTokenFromCookie) {
      return NextResponse.json({ error: 'Invalid CSRF token' }, { status: 403 });
    }

    const isRateLimited = rateLimit(ip, RATE_LIMIT_OPTIONS);

    if (isRateLimited) {
      return NextResponse.json({ error: 'Too Many Requests' }, { status: 429 });
    }

    // Validate request body using Zod schema
    const result = contactFormSchema.safeParse({ name, email, subject, message, leave_blank, csrfToken });
    if (!result.success) {
      return NextResponse.json({ error: 'Invalid request data' }, { status: 400 });
    }

    // Honeypot check
    if (leave_blank) {
      // Pretend to accept the request without actually processing it
      return NextResponse.json({ message: 'Contact inquiry submitted successfully' }, { status: 201 });
    }

    // Basic validation
    if (!name || !email || !subject || !message) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Simple email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
    }

    // Save to database
    const contactInquiry = await prisma.contactInquiry.create({
      data: {
        name,
        email,
        subject,
        message,
        ip_address: request.headers.get('x-forwarded-for') || request.headers.get('remote-addr') || undefined,
        user_agent: request.headers.get('user-agent') || undefined,
      },
    });

    // Send email notifications
    await sendAdminContactNotification(contactInquiry);
    await sendContactAutoResponse(contactInquiry);

    return NextResponse.json({ message: 'Contact inquiry submitted successfully' }, { status: 201 });
  } catch (error) {
    console.error('Error handling contact form submission:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}