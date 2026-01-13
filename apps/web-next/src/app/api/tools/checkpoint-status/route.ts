import { NextResponse } from "next/server";
import { execFile } from "child_process";
import { promisify } from "util";
import { join } from "path";

const execFileAsync = promisify(execFile);

/**
 * Checkpoint Status API - Git status for checkpoint system
 * Returns: last checkpoint tag, dirty status, UI-touch status
 *
 * Security: Dev-only, local-only
 */
export async function GET() {
  try {
    // Security: Dev-only feature flag
    const enableLocalTools = process.env.ENABLE_LOCAL_TOOLS === "1";
    if (!enableLocalTools) {
      return NextResponse.json(
        { success: false, message: "Local tools disabled" },
        { status: 404 }
      );
    }

    const repoRoot = process.cwd();

    // Get last checkpoint tag
    const { stdout: tagOutput } = await execFileAsync(
      "git",
      ["describe", "--tags", "--match", "cp/*", "--abbrev=0"],
      { cwd: repoRoot, timeout: 5000 }
    ).catch(() => ({ stdout: "" }));

    const lastCheckpoint = tagOutput.trim() || null;

    // Get dirty status (uncommitted changes)
    const { stdout: statusOutput } = await execFileAsync(
      "git",
      ["status", "--porcelain"],
      { cwd: repoRoot, timeout: 5000 }
    ).catch(() => ({ stdout: "" }));

    const isDirty = statusOutput.trim().length > 0;

    // Check for UI-touch (if dirty)
    let hasUiTouch = false;
    if (isDirty) {
      const { stdout: diffOutput } = await execFileAsync(
        "git",
        ["diff", "--name-only", "HEAD"],
        { cwd: repoRoot, timeout: 5000 }
      ).catch(() => ({ stdout: "" }));

      const changedFiles = diffOutput.split("\n").filter(Boolean);
      const uiPatterns = [
        /apps\/web-next\/(src|app|components|styles|tokens|tests\/e2e)/,
        /\.(css|scss)$/,
        /tailwind|postcss|uiTokens/,
      ];

      hasUiTouch = changedFiles.some((file) =>
        uiPatterns.some((pattern) => pattern.test(file))
      );
    }

    return NextResponse.json({
      success: true,
      lastCheckpoint,
      isDirty,
      hasUiTouch,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        message: `Status check failed: ${error.message}`,
      },
      { status: 500 }
    );
  }
}
