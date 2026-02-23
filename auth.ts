import { createUserIfNew, getUser } from "@/backend/user";
import NextAuth from "next-auth";
import type { NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google"

export const authConfig = {
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
  providers: [
    Google,
  ],
  callbacks: {
    async signIn({ user }) {
      if (user.email) {
        await createUserIfNew(user.email);
        const userProfile = await getUser(user.email);
        console.log("User logged in, ID:", userProfile?.id);
        return true;
      }

      return false;
    },
  },
} satisfies NextAuthConfig;

export const { auth, handlers, signIn, signOut } = NextAuth(authConfig);
