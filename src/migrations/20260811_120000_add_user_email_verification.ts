import { type MigrateDownArgs, type MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "users"
      ADD COLUMN IF NOT EXISTS "email_verified" boolean NOT NULL DEFAULT true,
      ADD COLUMN IF NOT EXISTS "email_verification_code_hash" varchar,
      ADD COLUMN IF NOT EXISTS "email_verification_expires_at" timestamp(3) with time zone;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "users"
      DROP COLUMN IF EXISTS "email_verification_expires_at",
      DROP COLUMN IF EXISTS "email_verification_code_hash",
      DROP COLUMN IF EXISTS "email_verified";
  `)
}
