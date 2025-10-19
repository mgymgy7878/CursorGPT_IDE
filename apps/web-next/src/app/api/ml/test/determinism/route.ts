import { NextResponse } from "next/server";
import { runDeterminismTests } from "@/lib/ml/determinism";

export async function GET() {
  try {
    const results = await runDeterminismTests();
    
    return NextResponse.json(results, {
      status: results.failed === 0 ? 200 : 400,
      headers: {
        "X-Test-Passed": results.passed.toString(),
        "X-Test-Failed": results.failed.toString(),
        "X-Test-Total": (results.passed + results.failed).toString()
      }
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message, passed: 0, failed: 1 },
      { status: 500 }
    );
  }
}
