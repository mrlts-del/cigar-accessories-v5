import { NextAuthOptions, DefaultSession } from 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      role: string;
    } & DefaultSession['user'];
  }
}

import GoogleProvider from 'next-auth/providers/google';
import CredentialsProvider from 'next-auth/providers/credentials';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { rateLimit } from "@/lib/rateLimiter";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials, req) {
        if (credentials?.email === process.env.ADMIN_EMAIL && credentials?.password === process.env.ADMIN_PASSWORD) {
          return {
            id: 'admin',
            email: process.env.ADMIN_EMAIL,
            isAdmin: true,
          };
        }

        const ip = req.headers?.['x-forwarded-for'] || req.headers?.['remoteAddress'] || 'unknown';
        const limit = 5; // 5 login attempts per minute
        const windowMs = 60 * 1000; // 1 minute

        if (rateLimit(ip, { limit, windowMs })) {
          // Returning null or throwing an error here will prevent the login attempt
          // We can't directly return a NextResponse with status 429 from authorize,
          // but returning null effectively denies the request.
          console.warn(`Rate limit exceeded for IP: ${ip} on login attempt.`);
          return null;
        }

        if (!credentials?.email || !credentials?.password) {
          return null; // No credentials provided
        }

        const user = await prisma.user.findUnique({
          where: {
            email: credentials.email
          },
          select: {
            id: true,
            email: true,
            name: true, // Include name
            image: true, // Include image
            passwordHash: true, // Include passwordHash for comparison
            isAdmin: true, // Include isAdmin
          }
        });

        if (!user) {
          return null; // User not found
        }
        if (!user.passwordHash) {
          return null; // User found, but no password set
        }

        // At this point, user and user.passwordHash are guaranteed to be non-null by the checks above.
        // credentials.password is also guaranteed to be non-null by the check on line 36.
        const isPasswordValid = await bcrypt.compare(credentials.password, user.passwordHash);

        if (!isPasswordValid) {
          return null; // Invalid password
        }

        // This check is redundant after the check on line 51, but keeping it for clarity/safety.
        if (!user) {
          return null; // User not found
        }

        // If everything is valid, return the user object, omitting passwordHash
        // Ensure the returned object matches the structure expected by NextAuth for the User type

        // Add a default role to match the NextAuth User type
        // Return the user object with necessary fields for NextAuth, including isAdmin
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          isAdmin: user.isAdmin,
        };
      }
    })
  ],
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.isAdmin ? 'ADMIN' : 'USER';
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
  },
};