import { NextRequest, NextResponse } from "next/server";
import { getCsrfToken, getProviders } from "next-auth/react";
import { headers } from "next/headers";

export async function GET(request: NextRequest) {
  console.log("[Debug:auth-test] ========== Auth Test Started ==========");

  try {
    // Get the host from headers
    const headersList = await headers();
    const host = headersList.get("host") || "localhost:3000";
    const protocol = host.includes("localhost") ? "http" : "https";
    const baseUrl = `${protocol}://${host}`;

    console.log("[Debug:auth-test] Base URL:", baseUrl);

    // Test 1: Check providers endpoint
    const providersResponse = await fetch(`${baseUrl}/api/auth/providers`);
    const providersData = await providersResponse.json();

    console.log("[Debug:auth-test] Providers response status:", providersResponse.status);
    console.log("[Debug:auth-test] Providers data:", JSON.stringify(providersData, null, 2));

    // Test 2: Check CSRF token endpoint
    const csrfResponse = await fetch(`${baseUrl}/api/auth/csrf`);
    const csrfData = await csrfResponse.json();

    console.log("[Debug:auth-test] CSRF response status:", csrfResponse.status);
    console.log("[Debug:auth-test] CSRF token exists:", !!csrfData?.csrfToken);

    // Test 3: Check session endpoint
    const sessionResponse = await fetch(`${baseUrl}/api/auth/session`);
    const sessionData = await sessionResponse.json();

    console.log("[Debug:auth-test] Session response status:", sessionResponse.status);
    console.log("[Debug:auth-test] Session data:", JSON.stringify(sessionData, null, 2));

    const result = {
      timestamp: new Date().toISOString(),
      baseUrl,
      providers: {
        status: providersResponse.status,
        count: Object.keys(providersData || {}).length,
        available: Object.keys(providersData || {}),
        data: providersData,
      },
      csrf: {
        status: csrfResponse.status,
        hasToken: !!csrfData?.csrfToken,
        tokenLength: csrfData?.csrfToken?.length || 0,
      },
      session: {
        status: sessionResponse.status,
        hasSession: Object.keys(sessionData || {}).length > 0,
        data: sessionData,
      },
    };

    console.log("[Debug:auth-test] ========== Auth Test Complete ==========");
    console.log("[Debug:auth-test] Result:", JSON.stringify(result, null, 2));

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("[Debug:auth-test] ========== ERROR ==========");
    console.error("[Debug:auth-test] Error name:", error.name);
    console.error("[Debug:auth-test] Error message:", error.message);
    console.error("[Debug:auth-test] Error stack:", error.stack);

    return NextResponse.json(
      {
        success: false,
        error: {
          name: error.name,
          message: error.message,
          cause: error.cause?.message,
        },
      },
      { status: 500 }
    );
  }
}
