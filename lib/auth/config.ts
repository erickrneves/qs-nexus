import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import { db } from '@/lib/db/index'
import { ragUsers } from '@/lib/db/schema/rag-users'
import { eq } from 'drizzle-orm'
import bcrypt from 'bcryptjs'

const authConfig = NextAuth({
  providers: [
    Credentials({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const user = await db
          .select()
          .from(ragUsers)
          .where(eq(ragUsers.email, credentials.email as string))
          .limit(1)

        if (user.length === 0) {
          return null
        }

        const isValidPassword = await bcrypt.compare(
          credentials.password as string,
          user[0].password
        )

        if (!isValidPassword) {
          return null
        }

        return {
          id: user[0].id,
          email: user[0].email,
          name: user[0].name,
        }
      },
    }),
  ],
  session: {
    strategy: 'jwt',
  },
  pages: {
    signIn: '/login',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.email = user.email
        token.name = user.name
      }
      return token
    },
    async session({ session, token }) {
      if (session.user && token) {
        session.user.id = token.id as string
        session.user.email = token.email as string
        session.user.name = token.name as string
      }
      return session
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
})

export const { handlers, signIn, signOut, auth } = authConfig as any
