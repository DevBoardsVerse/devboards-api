import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { randomUUID } from 'crypto';
import * as path from 'path';

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private readonly client: S3Client;
  private readonly bucketName: string;
  private readonly publicUrl: string;

  constructor(private config: ConfigService) {
    const accountId = this.config.getOrThrow<string>('storage.accountId');
    

    // R2 endpoint format — specific to Cloudflare
    const endpoint = config.get('NODE_ENV') === 'development'
    ? 'http://minio:9000'   // inside Docker network
    : `https://${accountId}.r2.cloudflarestorage.com`;

    this.client = new S3Client({
      region: 'auto',   // R2 uses 'auto' as region
      endpoint,
      forcePathStyle: true,  // required for MinIO — R2 doesn't need this
      credentials: {
        accessKeyId: this.config.getOrThrow<string>('storage.accessKeyId'),
        secretAccessKey: this.config.getOrThrow<string>(
          'storage.secretAccessKey',
        ),
      },
    });

    this.bucketName = this.config.getOrThrow<string>('storage.bucketName');
    this.publicUrl = this.config.getOrThrow<string>('storage.publicUrl');
  }

  async uploadFile(params: {
    buffer: Buffer;
    originalName: string;
    mimeType: string;
    folder: string;  // e.g. 'tasks/attachments'
  }): Promise<{ key: string; url: string }> {
    const { buffer, originalName, mimeType, folder } = params;

    // Generate unique key — prevents filename collisions
    // format: tasks/attachments/uuid.ext
    const ext = path.extname(originalName).toLowerCase();
    const key = `${folder}/${randomUUID()}${ext}`;

    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucketName,
        Key: key,
        Body: buffer,
        ContentType: mimeType,
        // Makes file publicly readable
        // Required for direct URL access
        // Remove if you want signed URLs instead
      }),
    );

    // Public URL format: https://pub-xxx.r2.dev/tasks/attachments/uuid.ext
    const url = `${this.publicUrl}/${key}`;

    this.logger.log(`Uploaded file: ${key}`);

    return { key, url };
  }

  async deleteFile(key: string): Promise<void> {
    await this.client.send(
      new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      }),
    );

    this.logger.log(`Deleted file: ${key}`);
  }
}