import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import type { AuthOptions, Provider } from "next-auth/providers/index";

// API URL для server-side вызовов (не используем api.ts т.к. он использует js-cookie)
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

// Debug logging
console.log("========== NextAuth Configuration ==========");
console.log("[NextAuth] API_URL:", API_URL);
console.log("[NextAuth] NEXTAUTH_URL:", process.env.NEXTAUTH_URL || "NOT SET");
console.log("[NextAuth] NEXTAUTH_SECRET:", process.env.NEXTAUTH_SECRET ? "SET (hidden)" : "NOT SET - using default");
console.log("[NextAuth] NODE_ENV:", process.env.NODE_ENV);
console.log("============================================");

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
console.log("[NextAuth] Adding CredentialsProvider...");
providers.push(
  CredentialsProvider({
    id: "credentials",
    name: "Credentials",
    credentials: {
      email: { label: "Email", type: "email" },
      password: { label: "Password", type: "password" },
    },
    async authorize(credentials) {
      console.log("[NextAuth:authorize] ========== Starting authorize ==========");
      console.log("[NextAuth:authorize] Credentials received:", credentials?.email ? "email present" : "NO EMAIL");

      if (!credentials?.email || !credentials?.password) {
        console.error("[NextAuth:authorize] Missing email or password");
        throw new Error("Требуется email и пароль");
      }

      const apiUrl = `${API_URL}/api/v1/auth/login`;
      console.log("[NextAuth:authorize] API URL:", apiUrl);
      console.log("[NextAuth:authorize] Email:", credentials.email);

      try {
        console.log("[NextAuth:authorize] Making fetch request...");
        const response = await fetch(apiUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: credentials.email,
            password: credentials.password,
          }),
        });

        console.log("[NextAuth:authorize] Response status:", response.status);
        console.log("[NextAuth:authorize] Response statusText:", response.statusText);
        console.log("[NextAuth:authorize] Response headers:", Object.fromEntries(response.headers.entries()));

        const responseText = await response.text();
        console.log("[NextAuth:authorize] Response body (first 500 chars):", responseText.substring(0, 500));

        if (!response.ok) {
          console.error("[NextAuth:authorize] Error response - status:", response.status);
          let errorMessage = "Неверный email или пароль";
          try {
            const errorData = JSON.parse(responseText);
            errorMessage = errorData.message || errorMessage;
            console.error("[NextAuth:authorize] Parsed error:", errorData);
          } catch {
            console.error("[NextAuth:authorize] Could not parse error as JSON");
          }
          throw new Error(errorMessage);
        }

        let data;
        try {
          data = JSON.parse(responseText);
          console.log("[NextAuth:authorize] Parsed data successfully");
          console.log("[NextAuth:authorize] User data:", JSON.stringify(data.user, null, 2));
          console.log("[NextAuth:authorize] Has accessToken:", !!data.accessToken);
          console.log("[NextAuth:authorize] Has refreshToken:", !!data.refreshToken);
        } catch (parseError) {
          console.error("[NextAuth:authorize] Failed to parse response as JSON:", parseError);
          throw new Error("Invalid response from server");
        }

        if (data && data.user) {
          const user = {
            id: data.user.id,
            email: data.user.email,
            name: `${data.user.firstName} ${data.user.lastName}`,
            image: data.user.avatarUrl,
            role: data.user.role,
            accessToken: data.accessToken,
            refreshToken: data.refreshToken,
          };
          console.log("[NextAuth:authorize] Returning user object:", { ...user, accessToken: "hidden", refreshToken: "hidden" });
          return user;
        }

        console.error("[NextAuth:authorize] No user in response data");
        return null;
      } catch (error: any) {
        console.error("[NextAuth:authorize] ========== ERROR ==========");
        console.error("[NextAuth:authorize] Error name:", error.name);
        console.error("[NextAuth:authorize] Error message:", error.message);
        console.error("[NextAuth:authorize] Error stack:", error.stack);
        throw new Error(error.message || "Ошибка авторизации");
      }
    },
  })
);

// Log all registered providers
console.log("[NextAuth] Total providers registered:", providers.length);
console.log("[NextAuth] Provider IDs:", providers.map(p => (p as any).id || (p as any).options?.id || 'unknown'));

export const authOptions: AuthOptions = {
  providers,

  // CRITICAL: Trust the host header from Railway proxy
  // Without this, CSRF validation fails silently
  // @ts-ignore - trustHost is valid in NextAuth v4.24+
  trustHost: true,

  callbacks: {
    async jwt({ token, user, account }) {
      console.log("[NextAuth:jwt] ========== JWT Callback ==========");
      console.log("[NextAuth:jwt] Has account:", !!account);
      console.log("[NextAuth:jwt] Has user:", !!user);
      console.log("[NextAuth:jwt] Account type:", account?.type);
      console.log("[NextAuth:jwt] Account provider:", account?.provider);

      // Первоначальный вход
      if (account && user) {
        console.log("[NextAuth:jwt] Initial sign in - processing user data");
        // Для Credentials провайдера токены приходят из user объекта
        if (account.type === "credentials") {
          const result = {
            ...token,
            accessToken: (user as any).accessToken,
            refreshToken: (user as any).refreshToken,
            user: {
              id: user.id,
              email: user.email,
              name: user.name,
              image: user.image,
              role: (user as any).role,
            },
          };
          console.log("[NextAuth:jwt] Credentials token created:", { ...result, accessToken: "hidden", refreshToken: "hidden" });
          return result;
        }

        // Для OAuth провайдеров (Google, Mail.ru) - роль по умолчанию PARENT
        const oauthResult = {
          ...token,
          accessToken: account.access_token,
          refreshToken: account.refresh_token,
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            image: user.image,
            role: "PARENT",
          },
        };
        console.log("[NextAuth:jwt] OAuth token created");
        return oauthResult;
      }

      console.log("[NextAuth:jwt] Returning existing token");
      return token;
    },

    async session({ session, token }) {
      console.log("[NextAuth:session] ========== Session Callback ==========");
      console.log("[NextAuth:session] Token user:", token.user);
      console.log("[NextAuth:session] Has accessToken:", !!token.accessToken);

      if (token.user) {
        session.user = token.user as any;
      }
      if (token.accessToken) {
        session.accessToken = token.accessToken as string;
      }
      console.log("[NextAuth:session] Final session user:", session.user);
      return session;
    },

    async signIn({ user, account, profile }) {
      console.log("[NextAuth:signIn] ========== SignIn Callback ==========");
      console.log("[NextAuth:signIn] User:", user);
      console.log("[NextAuth:signIn] Account provider:", account?.provider);
      console.log("[NextAuth:signIn] Account type:", account?.type);

      // OAuth вход (Google, Mail.ru)
      if (account?.provider === "google" || account?.provider === "mailru") {
        try {
          console.log("[NextAuth:signIn] OAuth sign in - allowing");
          return true;
        } catch (error) {
          console.error("[NextAuth:signIn] OAuth sign in error:", error);
          return false;
        }
      }

      console.log("[NextAuth:signIn] Credentials sign in - allowing");
      return true;
    },

    async redirect({ url, baseUrl }) {
      console.log("[NextAuth:redirect] ========== Redirect Callback ==========");
      console.log("[NextAuth:redirect] URL:", url);
      console.log("[NextAuth:redirect] Base URL:", baseUrl);

      // Helper to check if a URL points to auth pages (login, error, etc.)
      const isAuthPage = (urlString: string): boolean => {
        try {
          const parsedUrl = new URL(urlString, baseUrl);
          const pathname = parsedUrl.pathname;
          // Check if the path is an auth page that would cause a loop
          return pathname === "/login" || pathname === "/error" || pathname.startsWith("/login");
        } catch {
          // For relative URLs
          return urlString === "/login" || urlString === "/error" || urlString.startsWith("/login");
        }
      };

      // Default safe redirect destination
      const defaultRedirect = `${baseUrl}/dashboard`;

      // Allows relative callback URLs
      if (url.startsWith("/")) {
        // Prevent redirect loop to login page
        if (isAuthPage(url)) {
          console.log("[NextAuth:redirect] Auth page detected, redirecting to dashboard instead of:", url);
          return defaultRedirect;
        }
        const redirectUrl = `${baseUrl}${url}`;
        console.log("[NextAuth:redirect] Redirecting to:", redirectUrl);
        return redirectUrl;
      }

      // Allows callback URLs on the same origin
      if (new URL(url).origin === baseUrl) {
        // Prevent redirect loop to login page
        if (isAuthPage(url)) {
          console.log("[NextAuth:redirect] Auth page detected in full URL, redirecting to dashboard instead of:", url);
          return defaultRedirect;
        }
        console.log("[NextAuth:redirect] Same origin, redirecting to:", url);
        return url;
      }

      console.log("[NextAuth:redirect] Defaulting to baseUrl:", baseUrl);
      return baseUrl;
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

  // Use secure cookies in production (Railway uses HTTPS)
  useSecureCookies: process.env.NODE_ENV === "production",

  // Cookie configuration for Railway proxy
  cookies: {
    sessionToken: {
      name: process.env.NODE_ENV === "production"
        ? "__Secure-next-auth.session-token"
        : "next-auth.session-token",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
    callbackUrl: {
      name: process.env.NODE_ENV === "production"
        ? "__Secure-next-auth.callback-url"
        : "next-auth.callback-url",
      options: {
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
    csrfToken: {
      // Use __Secure- instead of __Host- prefix for Railway proxy compatibility
      // __Host- is too strict and fails with reverse proxies
      name: process.env.NODE_ENV === "production"
        ? "__Secure-next-auth.csrf-token"
        : "next-auth.csrf-token",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
  },

  // Enable debug mode always for troubleshooting
  debug: true,

  // Add redirect callback for debugging
  logger: {
    error(code, metadata) {
      console.error("[NextAuth:logger:error]", code, metadata);
    },
    warn(code) {
      console.warn("[NextAuth:logger:warn]", code);
    },
    debug(code, metadata) {
      console.log("[NextAuth:logger:debug]", code, metadata);
    },
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
