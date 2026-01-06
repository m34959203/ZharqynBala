import { NextResponse } from "next/server";

export async function GET() {
  const config = {
    timestamp: new Date().toISOString(),
    environment: {
      NODE_ENV: process.env.NODE_ENV || "NOT SET",
      NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || "NOT SET",
      NEXTAUTH_URL: process.env.NEXTAUTH_URL || "NOT SET",
      NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET ? "SET (hidden)" : "NOT SET",

      // OAuth providers
      GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID ? "SET (hidden)" : "NOT SET",
      GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET ? "SET (hidden)" : "NOT SET",
      MAILRU_CLIENT_ID: process.env.MAILRU_CLIENT_ID ? "SET (hidden)" : "NOT SET",
      MAILRU_CLIENT_SECRET: process.env.MAILRU_CLIENT_SECRET ? "SET (hidden)" : "NOT SET",
    },
    computed: {
      apiUrl: process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001",
      authUrl: process.env.NEXTAUTH_URL || "not set - will use request URL",
    },
  };

  console.log("[Debug:config] Configuration check requested");
  console.log("[Debug:config]", JSON.stringify(config, null, 2));

  return NextResponse.json(config);
}
