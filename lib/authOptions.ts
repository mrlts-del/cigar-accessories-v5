import { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import CredentialsProvider from 'next-auth/providers/credentials';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcrypt';
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
// eslint-disable-next-line @typescript-eslint/no-unused-vars
    async signIn(_) {
      // You can add custom logic here if needed,
      // but the adapter handles user creation/linking by default.
      // For example, you might want to check if the email domain is allowed.
      return true; // Allow sign in
    },
    async jwt({ token, user, account }) {
      // Add user id and isAdmin to the token
      if (user) {
        token.id = user.id;
        // Fetch user from database to get isAdmin
        const dbUser = await prisma.user.findUnique({
          where: { id: user.id },
          select: { isAdmin: true },
        });
        if (dbUser) {
          token.isAdmin = dbUser.isAdmin;
        }
      } else if (token.id) {
        // If user is not available (e.g., on subsequent requests),
        // fetch isAdmin from the database using the token's user id
        const dbUser = await prisma.user.findUnique({
          where: { id: token.id as string },
          select: { isAdmin: true },
        });
        if (dbUser) {
          token.isAdmin = dbUser.isAdmin;
        }
      }

      // Add access_token and other provider specific properties to the token
      if (account) {
        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token;
        token.expiresAt = account.expires_at;
        token.provider = account.provider;
      }
      return token;
    },
    async session({ session, token }) {
      // Add user id and isAdmin from the token to the session
      if (token) {
        session.user.id = token.id as string;
        session.user.isAdmin = token.isAdmin as boolean;
      }
      return session;
    },
  },
  // Optional: Add pages for custom sign-in, sign-out, error pages
  // pages: {
  //   signIn: '/auth/signin',
  //   signOut: '/auth/signout',
  //   error: '/auth/error',
  //   verifyRequest: '/auth/verify-request',
  //   newUser: '/auth/new-user'
  // },
};