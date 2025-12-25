import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
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

    // Mail.ru OAuth
    {
      id: "mailru",
      name: "Mail.ru",
      type: "oauth",
      authorization: {
        url: "https://oauth.mail.ru/login",
        params: {
          scope: "userinfo",
          response_type: "code",
        },
      },
      token: "https://oauth.mail.ru/token",
      userinfo: "https://oauth.mail.ru/userinfo",
      clientId: process.env.MAILRU_CLIENT_ID || "",
      clientSecret: process.env.MAILRU_CLIENT_SECRET || "",
      profile(profile) {
        return {
          id: profile.id || profile.email,
          name: `${profile.first_name || ""} ${profile.last_name || ""}`.trim(),
          email: profile.email,
          image: profile.image || profile.avatar || null,
        };
      },
    },

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
        // Для Credentials провайдера токены приходят из user объекта
        if (account.type === "credentials") {
          return {
            ...token,
            accessToken: (user as any).accessToken,
            refreshToken: (user as any).refreshToken,
            user: {
              id: user.id,
              email: user.email,
              name: user.name,
              image: user.image,
            },
          };
        }

        // Для OAuth провайдеров (Google, Mail.ru)
        return {
          ...token,
          accessToken: account.access_token,
          refreshToken: account.refresh_token,
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            image: user.image,
          },
        };
      }

      return token;
    },

    async session({ session, token }) {
      if (token.user) {
        session.user = token.user as any;
      }
      if (token.accessToken) {
        session.accessToken = token.accessToken as string;
      }
      return session;
    },

    async signIn({ account, profile }) {
      // OAuth вход (Google, Mail.ru)
      if (account?.provider === "google" || account?.provider === "mailru") {
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
