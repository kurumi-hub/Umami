import "server-only";
import {
  DeleteObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const accountId = process.env.R2_ACCOUNT_ID!;
const bucket = process.env.R2_BUCKET_NAME!;
export const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL!;

const r2 = new S3Client({
  region: "auto",
  endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

export async function createUploadUrl(
  key: string,
  contentType: string,
  contentLength: number
) {
  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    ContentType: contentType,
    ContentLength: contentLength, // được ký → client không upload file lớn hơn khai báo
  });
  return getSignedUrl(r2, command, { expiresIn: 600 });
}

export function publicUrlFor(key: string) {
  return `${R2_PUBLIC_URL}/${key}`;
}

// Chuyển URL công khai ngược về key (dùng khi xóa file cũ)
export function keyFromPublicUrl(url: string) {
  return url.startsWith(`${R2_PUBLIC_URL}/`)
    ? url.slice(R2_PUBLIC_URL.length + 1)
    : null;
}

export async function deleteObject(key: string) {
  await r2.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
}