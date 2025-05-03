import NextAuth, { DefaultSession, DefaultUser } from "next-auth";
import { JWT, DefaultJWT } from "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      isAdmin: boolean; // Add this
      // role?: string; // Remove or comment out if exists
    } & DefaultSession["user"]; // Keep existing fields
  }

  interface User extends DefaultUser {
    isAdmin: boolean; // Add this
    // role?: string; // Remove or comment out if exists
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    isAdmin: boolean; // Add this
    // role?: string; // Remove or comment out if exists
  }
}