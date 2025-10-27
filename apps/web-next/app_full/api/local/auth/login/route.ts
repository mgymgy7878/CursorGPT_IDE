import { NextRequest, NextResponse } from "next/server";
import { createToken, setCookie } from "@/lib/auth-server";

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    // Demo credentials
    const validCredentials = {
      "admin@spark.local": "changeme",
      "trader@spark.local": "changeme", 
      "viewer@spark.local": "changeme"
    };

    if (validCredentials[email as keyof typeof validCredentials] === password) {
      const role = email.includes("admin") ? "admin" : 
                   email.includes("trader") ? "trader" : "viewer";
      
      const token = await createToken({ email, role });
      setCookie(token);

      return NextResponse.json({ 
        ok: true, 
        message: "Login successful",
        user: { email, role }
      });
    } else {
      return NextResponse.json(
        { ok: false, error: "invalid_credentials", message: "Invalid email or password" },
        { status: 401 }
      );
    }
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: "server_error", message: error.message },
      { status: 500 }
    );
  }
} 