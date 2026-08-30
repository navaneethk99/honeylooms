import { type MigrateDownArgs, type MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "_order" varchar;
    CREATE INDEX IF NOT EXISTS "products_order_idx" ON "products" USING btree ("_order");
    ALTER TABLE "_products_v" ADD COLUMN IF NOT EXISTS "version__order" varchar;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DROP INDEX IF EXISTS "products_order_idx";
    ALTER TABLE "_products_v" DROP COLUMN IF EXISTS "version__order";
    ALTER TABLE "products" DROP COLUMN IF EXISTS "_order";
  `)
}
