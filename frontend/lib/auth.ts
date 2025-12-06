import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import GitHubProvider from "next-auth/providers/github";
import CredentialsProvider from "next-auth/providers/credentials";
import type { AuthOptions } from "next-auth";
import { authApi } from "./api";

export const authOptions: AuthOptions = {
  providers: [
    // Google OAuth
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code",
        },
      },
    }),

    // GitHub OAuth
    GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID || "",
      clientSecret: process.env.GITHUB_CLIENT_SECRET || "",
    }),

    // Email/Password (Credentials)
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Требуется email и пароль");
        }

        try {
          const response = await authApi.login({
            email: credentials.email,
            password: credentials.password,
          });

          if (response && response.user) {
            return {
              id: response.user.id,
              email: response.user.email,
              name: `${response.user.firstName} ${response.user.lastName}`,
              image: response.user.avatarUrl,
              accessToken: response.accessToken,
              refreshToken: response.refreshToken,
            };
          }

          return null;
        } catch (error: any) {
          throw new Error(error.response?.data?.message || "Ошибка авторизации");
        }
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user, account }) {
      // Первоначальный вход
      if (account && user) {
        return {
          ...token,
          accessToken: account.access_token,
          refreshToken: account.refresh_token,
          user,
        };
      }

      return token;
    },

    async session({ session, token }) {
      session.user = token.user as any;
      session.accessToken = token.accessToken as string;
      return session;
    },

    async signIn({ account, profile }) {
      // OAuth вход (Google, GitHub)
      if (account?.provider === "google" || account?.provider === "github") {
        try {
          // TODO: Отправить OAuth данные на backend для создания/обновления пользователя
          // Пока что просто разрешаем вход
          return true;
        } catch (error) {
          console.error("OAuth sign in error:", error);
          return false;
        }
      }

      return true;
    },
  },

  pages: {
    signIn: "/login",
    error: "/login",
  },

  session: {
    strategy: "jwt",
  },

  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
