import NextAuth, { DefaultSession, DefaultUser } from "next-auth";
import { JWT, DefaultJWT } from "next-auth/jwt";

// Augment the default User type
declare module "next-auth" {
  /**
   * Returned by `useSession`, `getSession` and received as a prop on the `SessionProvider` React Context
   */
  interface Session {
    user: {
      /** The user's id. */
      id: string;
      /** The user's role. */
      role: string; // Add role property
      // Add other custom properties like role here if needed
      // role: string;
    } & DefaultSession["user"]; // Keep the default properties
  }

  /**
   * The shape of the user object returned in the OAuth providers' `profile` callback,
   * or the second parameter of the `session` callback, when using a database.
   */
  interface User extends DefaultUser {
    /** The user's role. */
    role: string; // Add role property
    // Add other custom properties like role here if needed
    // role: string;
  }
}

// Augment the default JWT type (only needed if using JWT strategy)
// declare module "next-auth/jwt" {
//   /** Returned by the `jwt` callback and `getToken`, when using JWT sessions */
//   interface JWT extends DefaultJWT {
//     /** OpenID ID Token */
//     id?: string;
//     // Add other custom properties like role here if needed
//     // role: string;
//   }
// }