import {
  S3Client,
  HeadBucketCommand,
  CreateBucketCommand,
  PutBucketPolicyCommand,
  PutBucketCorsCommand,
} from "@aws-sdk/client-s3";

export const S3_BUCKET = process.env.S3_BUCKET ?? "footballevents";
const endpoint = process.env.S3_ENDPOINT ?? "http://localhost:9000";
const region = process.env.S3_REGION ?? "us-east-1";

export const s3 = new S3Client({
  endpoint,
  region,
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY ?? "",
    secretAccessKey: process.env.S3_SECRET_KEY ?? "",
  },
  forcePathStyle: true, // required for MinIO
});

let bootstrapped = false;
export async function ensureBucket() {
  if (bootstrapped) return;
  try {
    await s3.send(new HeadBucketCommand({ Bucket: S3_BUCKET }));
  } catch {
    await s3.send(new CreateBucketCommand({ Bucket: S3_BUCKET }));
    // Public-read policy so uploaded images are accessible by URL.
    const policy = {
      Version: "2012-10-17",
      Statement: [
        {
          Effect: "Allow",
          Principal: { AWS: ["*"] },
          Action: ["s3:GetObject"],
          Resource: [`arn:aws:s3:::${S3_BUCKET}/*`],
        },
      ],
    };
    await s3.send(
      new PutBucketPolicyCommand({
        Bucket: S3_BUCKET,
        Policy: JSON.stringify(policy),
      }),
    );
  }

  // Allow direct browser PUT from any origin (presigned uploads).
  try {
    await s3.send(
      new PutBucketCorsCommand({
        Bucket: S3_BUCKET,
        CORSConfiguration: {
          CORSRules: [
            {
              AllowedMethods: ["GET", "PUT", "HEAD"],
              AllowedOrigins: ["*"],
              AllowedHeaders: ["*"],
              ExposeHeaders: ["ETag"],
              MaxAgeSeconds: 3000,
            },
          ],
        },
      }),
    );
  } catch {
    // best-effort: some S3 implementations may not support this command pattern
  }

  bootstrapped = true;
}

export function publicUrl(key: string) {
  const base = process.env.S3_PUBLIC_URL ?? `${endpoint}/${S3_BUCKET}`;
  return `${base.replace(/\/$/, "")}/${key.replace(/^\//, "")}`;
}
