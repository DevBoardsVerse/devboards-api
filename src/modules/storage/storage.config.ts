import { registerAs } from '@nestjs/config';

export default registerAs('storage', () => ({
  endpoint: process.env.STORAGE_ENDPOINT,
  region: process.env.STORAGE_REGION || 'us-east-1',
  accessKeyId: process.env.STORAGE_ACCESS_KEY,
  secretAccessKey: process.env.STORAGE_SECRET_KEY,
  bucketName: process.env.STORAGE_BUCKET_NAME,
  publicUrl: process.env.STORAGE_PUBLIC_URL,
  forcePathStyle: process.env.STORAGE_FORCE_PATH_STYLE === 'true',
}));