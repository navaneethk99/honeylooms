import { type MigrateDownArgs, type MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "account_verifications"
      ADD COLUMN IF NOT EXISTS "encrypted_otp" varchar;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "account_verifications"
      DROP COLUMN IF EXISTS "encrypted_otp";
  `)
}
