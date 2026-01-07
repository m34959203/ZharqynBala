import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth";
import type { NextRequest } from "next/server";

// Create handler at request time, not at module import time
// This is critical for App Router to work correctly with NextAuth
const handler = NextAuth(authOptions);

// Wrapper to add logging
async function wrappedHandler(req: NextRequest, context: { params: Promise<{ nextauth: string[] }> }) {
  const params = await context.params;
  const url = req.url;
  const method = req.method;

  console.log(`[NextAuth:route] ========== ${method} Request ==========`);
  console.log(`[NextAuth:route] URL: ${url}`);
  console.log(`[NextAuth:route] Path: ${params.nextauth?.join('/')}`);

  try {
    // @ts-ignore - NextAuth handler types are complex
    const response = await handler(req, context);
    console.log(`[NextAuth:route] Response status: ${response?.status}`);
    return response;
  } catch (error: any) {
    console.error(`[NextAuth:route] ERROR: ${error.message}`);
    console.error(`[NextAuth:route] Stack: ${error.stack}`);
    throw error;
  }
}

export { wrappedHandler as GET, wrappedHandler as POST };
