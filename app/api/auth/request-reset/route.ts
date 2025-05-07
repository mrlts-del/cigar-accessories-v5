import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma'; // Assuming prisma client is exported as a named export
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { sendPasswordResetRequestEmail } from '@/lib/emailService'; // Corrected function name
import { rateLimit } from "@/lib/rateLimiter";

export async function POST(request: Request) {
  const headers = request.headers as unknown as Record<string, string>;
  const ip = headers['x-forwarded-for'] || headers['remote-address'] || 'unknown';
  const limit = 15; // 15 requests per minute
  const windowMs = 60 * 1000; // 1 minute

  if (rateLimit(ip, { limit, windowMs })) {
    return new NextResponse("Too Many Requests", { status: 429 });
  }

  try {
    const { email } = await request.json();

    // Find the user by email
    const user = await prisma.user.findUnique({
      where: { email },
    });

    // Prevent email enumeration - always return a success-like response
    if (!user) {
      console.warn(`Password reset requested for non-existent email: ${email}`);
      return NextResponse.json({ message: 'If an account exists for this email, a password reset link has been sent.' });
    }

    // Generate a secure, random token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenHash = await bcrypt.hash(resetToken, 10); // Hash the token for storage

    // Set token expiration time (e.g., 1 hour from now)
    const resetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Save the hashed token and expiry date to the user record
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordResetToken: resetTokenHash,
        passwordResetExpires: resetExpires,
      },
    });

    // Send email to the user with the original (unhashed) token
    // The frontend reset page will read this token from the URL
    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${resetToken}`;

    // Assuming sendPasswordResetEmail function exists and handles email sending
    // It should take user email and the reset URL
    await sendPasswordResetRequestEmail(user.email, resetUrl);

    return NextResponse.json({ message: 'If an account exists for this email, a password reset link has been sent.' });

  } catch (error) {
    console.error('Password reset request failed:', error);
    return NextResponse.json({ message: 'An error occurred while processing your request.' }, { status: 500 });
  }
}