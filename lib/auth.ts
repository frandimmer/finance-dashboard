import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "./db";

function getAllowedEmails() {
  return (
    process.env.ALLOWED_EMAILS?.split(",")
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean) ?? []
  );
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [Google],
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async signIn({ user }) {
      const allowedEmails = getAllowedEmails();

      if (allowedEmails.length === 0) {
        console.error("ALLOWED_EMAILS is not configured.");
        return false;
      }

      if (!user.email) {
        return false;
      }

      return allowedEmails.includes(user.email.toLowerCase());
    },

    session({ session, user }) {
      session.user.id = user.id;
      return session;
    },
  },
});