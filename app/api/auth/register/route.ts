import { z } from "zod";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";
import { withError } from "@/lib/withError"; // Assuming withError is exported from lib/withError
import { rateLimit } from "@/lib/rateLimiter";

const registerBody = z.object({
  email: z.string().email(),
  password: z.string().min(6), // Basic password length validation
});

export type RegisterBody = z.infer<typeof registerBody>;

async function registerUser(body: RegisterBody) {
  const { email, password } = body;

  // Check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    throw new Error("User with this email already exists.");
  }

  // Hash the password
  const passwordHash = await bcrypt.hash(password, 10); // 10 is the salt rounds

  // Create the new user
  const newUser = await prisma.user.create({
    data: {
      email,
      passwordHash,
      // Add other required fields here if any, based on your schema
      // For now, assuming only email and passwordHash are required for basic auth
    },
    select: {
      id: true,
      email: true,
      createdAt: true,
    }, // Select fields to return, exclude passwordHash
  });

  return { user: newUser };
}

export const POST = withError(async (request: Request) => {
  const ip = request.headers.get('x-forwarded-for') || request.headers.get('remote-address') || 'unknown';
  const limit = 10; // 10 requests per minute
  const windowMs = 60 * 1000; // 1 minute

  if (rateLimit(ip, { limit, windowMs })) {
    return new NextResponse("Too Many Requests", { status: 429 });
  }

  const json = await request.json();
  const body = registerBody.parse(json);

  const result = await registerUser(body);

  return NextResponse.json(result, { status: 201 }); // 201 Created
});