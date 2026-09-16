import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Injectable, Logger } from '@nestjs/common';
import { env } from '../env.js';

/**
 * Cloudflare R2, through its S3-compatible API.
 *
 * Replaces UploadThing, and fixes the problem that made the old arrangement
 * unacceptable rather than merely inconvenient: UploadThing's free plan REFUSES
 * private files, so a mentor's government ID and a child's task photograph both
 * ended up at permanent, unauthenticated URLs — readable forever by anyone the
 * link reached. The code there tried to set a private ACL, was told no, and
 * carried on.
 *
 * R2 buckets are private by default. Nothing here makes an object public; reads
 * happen through short-lived signed URLs minted at view time. That is the
 * posture this platform needed all along.
 *
 * The bytes still never pass through this process: the client uploads straight
 * to R2 with a presigned URL. What changes is that the API authorizes BEFORE
 * issuing that URL, and verifies the stored object AFTER — see UploadsService.
 */
@Injectable()
export class R2Service {
  private readonly logger = new Logger(R2Service.name);
  private client: S3Client | null = null;

  private get s3(): S3Client | null {
    if (!env.r2AccountId || !env.r2AccessKeyId || !env.r2SecretAccessKey) {
      return null;
    }
    if (!this.client) {
      this.client = new S3Client({
        region: 'auto',
        endpoint: `https://${env.r2AccountId}.r2.cloudflarestorage.com`,
        credentials: {
          accessKeyId: env.r2AccessKeyId,
          secretAccessKey: env.r2SecretAccessKey,
        },
      });
    }
    return this.client;
  }

  /** True when R2 is configured. Unset credentials disable uploads cleanly. */
  get configured(): boolean {
    return this.s3 !== null;
  }

  private bucketFor(visibility: 'private' | 'public'): string {
    return visibility === 'public' ? env.r2PublicBucket : env.r2Bucket;
  }

  /**
   * A presigned PUT the client uploads to directly.
   *
   * contentType is SIGNED, so the object cannot be stored as something other
   * than what was authorized. Size is not signed — a presigned PUT cannot
   * enforce it — which is why every upload is verified with head() before it is
   * recorded, and deleted if it does not match.
   */
  async presignPut(
    key: string,
    contentType: string,
    visibility: 'private' | 'public',
    expiresIn = 300,
  ): Promise<string | null> {
    const s3 = this.s3;
    if (!s3) return null;
    return getSignedUrl(
      s3,
      new PutObjectCommand({
        Bucket: this.bucketFor(visibility),
        Key: key,
        ContentType: contentType,
      }),
      { expiresIn },
    );
  }

  /**
   * A short-lived signed URL for reading a private object.
   *
   * Five minutes by default: long enough for an admin to open a government ID,
   * short enough that a copied link is not a lasting credential.
   */
  async presignGet(key: string, expiresIn = 300): Promise<string | null> {
    const s3 = this.s3;
    if (!s3) return null;
    return getSignedUrl(
      s3,
      new GetObjectCommand({ Bucket: env.r2Bucket, Key: key }),
      { expiresIn },
    );
  }

  /** Size and content type of a stored object, or null if it is not there. */
  async head(
    key: string,
    visibility: 'private' | 'public' = 'private',
  ): Promise<{ size: number; contentType: string } | null> {
    const s3 = this.s3;
    if (!s3) return null;
    try {
      const res = await s3.send(
        new HeadObjectCommand({
          Bucket: this.bucketFor(visibility),
          Key: key,
        }),
      );
      return {
        size: res.ContentLength ?? 0,
        contentType: res.ContentType ?? 'application/octet-stream',
      };
    } catch {
      return null;
    }
  }

  async delete(
    key: string,
    visibility: 'private' | 'public' = 'private',
  ): Promise<void> {
    const s3 = this.s3;
    if (!s3) return;
    try {
      await s3.send(
        new DeleteObjectCommand({
          Bucket: this.bucketFor(visibility),
          Key: key,
        }),
      );
    } catch (error) {
      // Housekeeping. A failure here orphans an object; it must never fail the
      // operation that triggered it.
      this.logger.warn(`r2: could not delete ${key}`, error);
    }
  }

  /**
   * The public URL for an object in the public bucket.
   *
   * Public objects are served from a custom domain bound to the bucket, not
   * from the S3 endpoint — the S3 endpoint requires signing even for a public
   * bucket, so a URL built from it would expire.
   */
  publicUrl(key: string): string {
    return `${env.r2PublicBaseUrl.replace(/\/$/, '')}/${key}`;
  }
}
