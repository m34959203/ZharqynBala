import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth";

// Create handler at request time, not at module import time
// This is critical for App Router to work correctly with NextAuth
const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
