import { type MigrateDownArgs, type MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "account_verifications"
      ADD COLUMN IF NOT EXISTS "otp_attempts" numeric DEFAULT 0 NOT NULL;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "account_verifications"
      DROP COLUMN IF EXISTS "otp_attempts";
  `)
}
