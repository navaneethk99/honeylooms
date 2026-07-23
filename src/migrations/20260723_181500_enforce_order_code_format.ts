import { type MigrateDownArgs, type MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "orders"
      DROP CONSTRAINT IF EXISTS "orders_order_code_format",
      ADD CONSTRAINT "orders_order_code_format"
        CHECK ("order_code" ~ '^[0-9]{8}$');
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "orders" DROP CONSTRAINT IF EXISTS "orders_order_code_format";
  `)
}
