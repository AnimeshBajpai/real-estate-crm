import { NextAuthOptions } from "next-auth";
import { JWT } from "next-auth/jwt";
import { PrismaAdapter } from "@auth/prisma-adapter";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

// Extend the built-in session types
declare module "next-auth" {
  interface User {
    id: string;
    role?: string;
    phone?: string;
    companyId?: string;
  }
  
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      role?: string;
      phone?: string;
      companyId?: string;
    }
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role?: string;
    phone?: string;
    companyId?: string;
  }
}

const prisma = new PrismaClient();

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        phone: { label: "Phone", type: "tel" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.phone || !credentials?.password) {
          throw new Error('Please enter phone and password');
        }

        const user = await prisma.user.findUnique({
          where: {
            phone: credentials.phone,
          },
        });

        if (!user) {
          throw new Error('No user found with this phone number');
        }

        const passwordMatch = await bcrypt.compare(credentials.password, user.password);

        if (!passwordMatch) {
          throw new Error('Incorrect password');
        }

        // Return all the user data we need in the session
        return {
          id: user.id,
          name: user.name,
          phone: user.phone,
          role: user.role,
          companyId: user.companyId || undefined
        };
      }
    })
  ],
  callbacks: {
    async jwt({ token, user, account }) {
      if (user) {
        // Initial sign in
        token.id = user.id;
        token.role = user.role;
        token.phone = user.phone;
        token.companyId = user.companyId;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        // Add properties to the session from the token
        session.user.id = token.id;
        session.user.role = token.role as string;
        session.user.phone = token.phone as string;
        session.user.companyId = token.companyId as string;
      }
      return session;
    }
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: '/auth/signin',
  }
};
