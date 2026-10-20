import { neon } from '@neondatabase/serverless';

const DEFAULT_NEON_URL =
  'postgresql://neondb_owner:npg_IcvsedoJ4fY6@ep-muddy-hill-b5ainoe0-pooler.c-7.us-east-2.aws.neon.tech/neondb?sslmode=require';

const rawUrl =
  (import.meta.env.VITE_DATABASE_URL as string | undefined) || DEFAULT_NEON_URL;

// Ensure channel_binding=require is stripped for HTTP serverless fetch driver
export const cleanDbUrl = rawUrl
  .replace(/([&?])channel_binding=require(&|$)/, '$1')
  .replace(/\?$/, '')
  .replace(/&$/, '');

export const sql = neon(cleanDbUrl);
