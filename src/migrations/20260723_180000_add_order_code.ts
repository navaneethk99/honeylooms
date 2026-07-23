import { type MigrateDownArgs, type MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "order_code" varchar(8);

    UPDATE "orders"
    SET "order_code" = LPAD((10000000 + "id")::text, 8, '0')
    WHERE "order_code" IS NULL;

    ALTER TABLE "orders" ALTER COLUMN "order_code" SET NOT NULL;
    CREATE UNIQUE INDEX IF NOT EXISTS "orders_order_code_idx" ON "orders" USING btree ("order_code");
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DROP INDEX IF EXISTS "orders_order_code_idx";
    ALTER TABLE "orders" DROP COLUMN IF EXISTS "order_code";
  `)
}
