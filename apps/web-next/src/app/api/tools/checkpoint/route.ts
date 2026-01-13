import { NextRequest, NextResponse } from "next/server";
import { execFile } from "child_process";
import { promisify } from "util";
import { join } from "path";

const execFileAsync = promisify(execFile);

/**
 * Checkpoint API - PowerShell script execution
 * SSR-safe, Windows-focused, guardrail'li
 *
 * Security Features:
 * - Dev-only feature flag (ENABLE_LOCAL_TOOLS)
 * - Local-only (127.0.0.1 check)
 * - Allowlist actions only
 * - execFile (not exec) to prevent injection
 * - Input sanitization
 * - Timeout (30s)
 * - Output cap (50 lines)
 */
export async function POST(request: NextRequest) {
  try {
    // Security: Dev-only feature flag
    const enableLocalTools = process.env.ENABLE_LOCAL_TOOLS === "1";
    if (!enableLocalTools) {
      return NextResponse.json(
        { success: false, message: "Local tools disabled (ENABLE_LOCAL_TOOLS not set)" },
        { status: 404 }
      );
    }

    // Security: Local-only (127.0.0.1 check)
    const clientIp = request.headers.get("x-forwarded-for") ||
                     request.headers.get("x-real-ip") ||
                     "unknown";
    const isLocalhost = clientIp === "127.0.0.1" ||
                        clientIp === "::1" ||
                        clientIp.startsWith("127.") ||
                        request.url.includes("localhost") ||
                        request.url.includes("127.0.0.1");

    if (!isLocalhost) {
      return NextResponse.json(
        { success: false, message: "Local tools only available from localhost" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { action, message, verifyUi, daily } = body;

    // Security: Only allow specific actions (allowlist)
    const allowedActions = ["pre", "post", "rollback", "rollback-golden"];
    if (!allowedActions.includes(action)) {
      return NextResponse.json(
        { success: false, message: `Invalid action: ${action}` },
        { status: 400 }
      );
    }

    // Security: Input sanitization
    // Message: alphanumeric, spaces, dashes, underscores only; max 100 chars
    if (message) {
      if (typeof message !== "string") {
        return NextResponse.json(
          { success: false, message: "Invalid message format" },
          { status: 400 }
        );
      }
      if (message.length > 100) {
        return NextResponse.json(
          { success: false, message: "Message too long (max 100 chars)" },
          { status: 400 }
        );
      }
      // Whitelist: alphanumeric, spaces, dashes, underscores, Turkish chars
      const messagePattern = /^[a-zA-Z0-9\s\-_çğıöşüÇĞIİÖŞÜ]+$/;
      if (!messagePattern.test(message)) {
        return NextResponse.json(
          { success: false, message: "Invalid characters in message" },
          { status: 400 }
        );
      }
    }

    // Build PowerShell script path and arguments
    const repoRoot = process.cwd();
    const scriptPath = join(repoRoot, "tools", "windows");

    let scriptFile: string;
    let args: string[] = [];

    switch (action) {
      case "pre":
        scriptFile = join(scriptPath, "checkpoint.ps1");
        args = ["-NoProfile", "-ExecutionPolicy", "Bypass", "-File", scriptFile, "-Message", `PRE: ${message || "checkpoint"}`];
        break;
      case "post":
        scriptFile = join(scriptPath, "checkpoint.ps1");
        args = ["-NoProfile", "-ExecutionPolicy", "Bypass", "-File", scriptFile, "-Message", `POST: ${message || "checkpoint"}`];
        if (verifyUi) {
          args.push("-VerifyUi");
        }
        break;
      case "rollback":
        scriptFile = join(scriptPath, "rollback.ps1");
        args = ["-NoProfile", "-ExecutionPolicy", "Bypass", "-File", scriptFile];
        break;
      case "rollback-golden":
        scriptFile = join(scriptPath, "rollback.ps1");
        args = ["-NoProfile", "-ExecutionPolicy", "Bypass", "-File", scriptFile, "-Tag", "ui/golden-master/v1"];
        break;
      default:
        return NextResponse.json(
          { success: false, message: `Unknown action: ${action}` },
          { status: 400 }
        );
    }

    // Security: Timeout (30 seconds)
    const timeout = 30000;
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error("Execution timeout")), timeout);
    });

    // Execute PowerShell script using execFile (not exec) for security
    const execPromise = execFileAsync("powershell.exe", args, {
      cwd: repoRoot,
      maxBuffer: 10 * 1024 * 1024, // 10MB buffer
      timeout,
    });

    const { stdout, stderr } = await Promise.race([execPromise, timeoutPromise]);

    // Parse output
    const output = stdout || stderr || "";
    const success = !output.includes("❌") && !output.includes("failed") && !output.includes("error");

    return NextResponse.json({
      success,
      message: success
        ? `Checkpoint ${action} completed successfully`
        : `Checkpoint ${action} failed`,
      output: output.split("\n").slice(0, 50).join("\n"), // Security: Output cap (50 lines)
      action,
    });
  } catch (error: any) {
    // Handle timeout specifically
    if (error.message === "Execution timeout") {
      return NextResponse.json(
        {
          success: false,
          message: "Checkpoint execution timed out (30s limit)",
          error: "timeout",
        },
        { status: 504 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: `Checkpoint execution failed: ${error.message}`,
        error: error.toString().substring(0, 200), // Limit error message length
      },
      { status: 500 }
    );
  }
}
