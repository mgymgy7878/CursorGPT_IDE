// S3 evidence storage adapter
// Production: import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
// import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

type UploadResult = {
  ok: boolean;
  url?: string;
  key?: string;
  bucket?: string;
  expiresAt?: number;
  _err?: string;
};

export async function generatePresignedUpload(
  runId: string, 
  contentType = "application/zip"
): Promise<UploadResult> {
  // Production implementation:
  /*
  const bucket = process.env.S3_BUCKET;
  const region = process.env.S3_REGION || 'eu-central-1';
  
  if (!bucket) {
    console.warn("[S3] S3_BUCKET not configured");
    return { ok: false, _err: "s3_not_configured" };
  }
  
  try {
    const s3Client = new S3Client({ region });
    const key = `evidence/${runId}-${Date.now()}.zip`;
    
    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      ContentType: contentType,
      Metadata: {
        'build-sha': process.env.BUILD_SHA || 'unknown',
        'environment': process.env.NODE_ENV || 'development',
        'run-id': runId
      }
    });
    
    const presignedUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 }); // 1h
    
    return {
      ok: true,
      url: presignedUrl,
      key,
      bucket,
      expiresAt: Date.now() + (3600 * 1000)
    };
  } catch (e: any) {
    console.error("[S3] Presigned URL generation failed:", e.message);
    return { ok: false, _err: e.message };
  }
  */
  
  // Mock implementation
  return {
    ok: false,
    _err: "s3_not_configured",
    url: `https://mock-s3.example.com/${runId}.zip`
  };
}

export async function getDownloadUrl(key: string, expiresIn = 3600): Promise<UploadResult> {
  // Production implementation:
  /*
  const bucket = process.env.S3_BUCKET;
  const region = process.env.S3_REGION || 'eu-central-1';
  
  if (!bucket) {
    return { ok: false, _err: "s3_not_configured" };
  }
  
  try {
    const s3Client = new S3Client({ region });
    const command = new GetObjectCommand({ Bucket: bucket, Key: key });
    const presignedUrl = await getSignedUrl(s3Client, command, { expiresIn });
    
    return {
      ok: true,
      url: presignedUrl,
      key,
      bucket,
      expiresAt: Date.now() + (expiresIn * 1000)
    };
  } catch (e: any) {
    return { ok: false, _err: e.message };
  }
  */
  
  return {
    ok: false,
    _err: "s3_not_configured",
    url: `https://mock-s3.example.com/${key}`
  };
}

