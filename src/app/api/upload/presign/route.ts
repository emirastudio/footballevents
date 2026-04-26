import { NextRequest, NextResponse } from "next/server";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { nanoid } from "nanoid";
import { auth } from "@/auth";
import { s3, ensureBucket, S3_BUCKET, publicUrl } from "@/lib/s3";
import { presignLimiter, consume } from "@/lib/ratelimit";

const ALLOWED_KINDS = new Set([
  "organizer-logo",
  "organizer-cover",
  "event-logo",
  "event-cover",
  "event-gallery",
]);

const ALLOWED_MIME = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_SIZE = 5 * 1024 * 1024; // 5MB after client-side compression

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rl = await consume(presignLimiter, `user:${session.user.id}`);
  if (!rl.ok) {
    return NextResponse.json({ error: "Too many uploads, slow down" }, { status: 429 });
  }

  const body = await req.json().catch(() => null);
  const { kind, contentType, size } = body ?? {};

  if (!ALLOWED_KINDS.has(kind)) {
    return NextResponse.json({ error: "Invalid kind" }, { status: 400 });
  }
  if (!ALLOWED_MIME.has(contentType)) {
    return NextResponse.json({ error: "Unsupported file type" }, { status: 400 });
  }
  if (typeof size !== "number" || size <= 0 || size > MAX_SIZE) {
    return NextResponse.json({ error: "File too large" }, { status: 400 });
  }

  await ensureBucket();

  const ext = contentType === "image/jpeg" ? "jpg" : contentType === "image/png" ? "png" : "webp";
  const key = `${kind}/${session.user.id}/${Date.now()}-${nanoid(8)}.${ext}`;

  const presignedUrl = await getSignedUrl(
    s3,
    new PutObjectCommand({
      Bucket: S3_BUCKET,
      Key: key,
      ContentType: contentType,
    }),
    { expiresIn: 60 },
  );

  return NextResponse.json({
    uploadUrl: presignedUrl,
    publicUrl: publicUrl(key),
    key,
  });
}
