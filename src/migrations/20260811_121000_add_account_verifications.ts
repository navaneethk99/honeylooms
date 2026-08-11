import { type MigrateDownArgs, type MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "account_verifications" (
      "id" serial PRIMARY KEY,
      "email" varchar NOT NULL,
      "name" varchar NOT NULL,
      "encrypted_password" varchar NOT NULL,
      "encrypted_otp" varchar NOT NULL,
      "otp_hash" varchar NOT NULL,
      "expires_at" timestamp(3) with time zone NOT NULL,
      "updated_at" timestamp(3) with time zone NOT NULL DEFAULT now(),
      "created_at" timestamp(3) with time zone NOT NULL DEFAULT now()
    );
    CREATE UNIQUE INDEX IF NOT EXISTS "account_verifications_email_idx"
      ON "account_verifications" USING btree ("email");

    ALTER TABLE "users"
      DROP COLUMN IF EXISTS "email_verification_expires_at",
      DROP COLUMN IF EXISTS "email_verification_code_hash",
      DROP COLUMN IF EXISTS "email_verified";
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DROP INDEX IF EXISTS "account_verifications_email_idx";
    DROP TABLE IF EXISTS "account_verifications";

    ALTER TABLE "users"
      ADD COLUMN IF NOT EXISTS "email_verified" boolean NOT NULL DEFAULT true,
      ADD COLUMN IF NOT EXISTS "email_verification_code_hash" varchar,
      ADD COLUMN IF NOT EXISTS "email_verification_expires_at" timestamp(3) with time zone;
  `)
}
