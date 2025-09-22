import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

const CONTENTSTACK_API_BASE = "https://api.contentstack.io/v3";
const CONTENTSTACK_CDN_BASE = "https://cdn.contentstack.io/v3";

export async function GET(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get("contentstack_token")?.value;

    if (!token) {
      return NextResponse.json(
        { error: "Not authenticated with Contentstack" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const endpoint = searchParams.get("endpoint");
    const stack = searchParams.get("stack");
    const environment = searchParams.get("environment") || "development";

    if (!endpoint || !stack) {
      return NextResponse.json(
        { error: "Missing required parameters" },
        { status: 400 }
      );
    }

    const apiUrl = `${CONTENTSTACK_CDN_BASE}/${endpoint}`;
    const response = await fetch(apiUrl, {
      headers: {
        Authorization: `Bearer ${token}`,
        api_key: stack,
        environment: environment,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Contentstack API error: ${response.statusText}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Contentstack proxy error:", error);
    return NextResponse.json(
      { error: "Failed to fetch from Contentstack" },
      { status: 500 }
    );
  }
}
