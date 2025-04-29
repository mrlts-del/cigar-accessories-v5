import NextAuth, { type NextAuthOptions } from "next-auth";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import GoogleProvider from "next-auth/providers/google";
import GitHubProvider from "next-auth/providers/github";
import { prisma } from "@/lib/prisma";
import { sendWelcomeEmail } from "@/lib/emailService";
import type { User } from "@prisma/client"; // Import User type from Prisma

export const authOptions: NextAuthOptions = { // Add type annotation
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "GOOGLE_CLIENT_ID_PLACEHOLDER",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "GOOGLE_CLIENT_SECRET_PLACEHOLDER",
    }),
    GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID || "GITHUB_CLIENT_ID_PLACEHOLDER",
      clientSecret: process.env.GITHUB_CLIENT_SECRET || "GITHUB_CLIENT_SECRET_PLACEHOLDER",
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET || "NEXTAUTH_SECRET_PLACEHOLDER",
  pages: {
    // signIn: '/auth/signin', // Optional: specify custom sign-in page
  },
  callbacks: {
    async session({ session, user }) {
      // Send properties to the client, like an access_token and user id from a provider.
      if (session.user) {
        session.user.id = user.id; // Add user ID
        // Assuming your Prisma User model has a 'role' field
        // Cast user to include the role property if it's not directly on the base User type from next-auth
        session.user.role = (user as User).role; // Use Prisma User type
        // session.user.role = user.role; // Add role if you have one
      }
      return session;
    },
    // Add jwt callback if using JWT strategy
  },
  events: {
    async createUser({ user }) {
      // Send welcome email after user is created
      if (user.email) {
        try {
          console.log(`Attempting to send welcome email to new user: ${user.email}`);
          // Pass the user object directly, assuming sendWelcomeEmail expects a compatible type
          await sendWelcomeEmail(user.email, user as User); // Use Prisma User type
        } catch (error) {
          console.error(`Failed to send welcome email to ${user.email}:`, error);
          // Log error, but don't block the sign-up process
        }
      } else {
        console.warn(`New user created without email (ID: ${user.id}), cannot send welcome email.`);
      }
    },
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };