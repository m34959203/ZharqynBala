import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import type { AuthOptions, Provider } from "next-auth/providers/index";

// API URL для server-side вызовов (не используем api.ts т.к. он использует js-cookie)
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

// Check which OAuth providers are configured
const GOOGLE_CONFIGURED = !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
const MAILRU_CONFIGURED = !!(process.env.MAILRU_CLIENT_ID && process.env.MAILRU_CLIENT_SECRET);

// Export for use in API routes
export const availableProviders = {
  google: GOOGLE_CONFIGURED,
  mailru: MAILRU_CONFIGURED,
  credentials: true,
};

// Build providers array dynamically
const providers: Provider[] = [];

// Google OAuth - only if configured
if (GOOGLE_CONFIGURED) {
  providers.push(
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code",
        },
      },
    })
  );
}

// Mail.ru OAuth - only if configured
if (MAILRU_CONFIGURED) {
  providers.push({
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
    clientId: process.env.MAILRU_CLIENT_ID!,
    clientSecret: process.env.MAILRU_CLIENT_SECRET!,
    profile(profile) {
      return {
        id: profile.id || profile.email,
        name: `${profile.first_name || ""} ${profile.last_name || ""}`.trim(),
        email: profile.email,
        image: profile.image || profile.avatar || null,
      };
    },
  });
}

// Email/Password (Credentials) - always available
providers.push(
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
        // Используем native fetch для server-side вызова (не axios с js-cookie)
        const response = await fetch(`${API_URL}/api/v1/auth/login`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: credentials.email,
            password: credentials.password,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || "Неверный email или пароль");
        }

        const data = await response.json();

        if (data && data.user) {
          return {
            id: data.user.id,
            email: data.user.email,
            name: `${data.user.firstName} ${data.user.lastName}`,
            image: data.user.avatarUrl,
            role: data.user.role, // Добавляем роль пользователя
            accessToken: data.accessToken,
            refreshToken: data.refreshToken,
          };
        }

        return null;
      } catch (error: any) {
        console.error("Auth error:", error);
        throw new Error(error.message || "Ошибка авторизации");
      }
    },
  })
);

export const authOptions: AuthOptions = {
  providers,

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
              role: (user as any).role, // Сохраняем роль в токене
            },
          };
        }

        // Для OAuth провайдеров (Google, Mail.ru) - роль по умолчанию PARENT
        return {
          ...token,
          accessToken: account.access_token,
          refreshToken: account.refresh_token,
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            image: user.image,
            role: "PARENT", // OAuth пользователи по умолчанию родители
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

  secret: process.env.NEXTAUTH_SECRET || "zharqynbala-default-secret-change-in-production",

  debug: process.env.NODE_ENV === "development",
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
