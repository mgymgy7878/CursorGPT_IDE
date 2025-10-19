import { NextResponse } from "next/server";
import { getVersionInfo, validateSchemaHash } from "@/lib/ml/versionInfo";

export async function GET() {
  const versionInfo = getVersionInfo();
  const validation = validateSchemaHash();
  
  return NextResponse.json({
    ...versionInfo,
    schemaValidation: validation
  }, {
    headers: {
      "X-Feature-Version": versionInfo.featureVersion,
      "X-Model-Version": versionInfo.modelVersion,
      "X-Schema-Hash": versionInfo.schemaHash,
      "X-Build-SHA": versionInfo.buildSha
    }
  });
}
