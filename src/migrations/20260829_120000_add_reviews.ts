import { type MigrateDownArgs, type MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "reviews" (
      "id" serial PRIMARY KEY NOT NULL,
      "order_id" integer NOT NULL,
      "product_id" integer NOT NULL,
      "customer_id" integer,
      "customer_email" varchar NOT NULL,
      "rating" numeric NOT NULL,
      "review" varchar NOT NULL,
      "updated_at" timestamp(3) with time zone NOT NULL DEFAULT now(),
      "created_at" timestamp(3) with time zone NOT NULL DEFAULT now()
    );
    CREATE TABLE IF NOT EXISTS "reviews_images" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "id" serial PRIMARY KEY NOT NULL,
      "media_id" integer
    );
    ALTER TABLE "reviews" ADD CONSTRAINT "reviews_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE set null ON UPDATE no action;
    ALTER TABLE "reviews" ADD CONSTRAINT "reviews_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE set null ON UPDATE no action;
    ALTER TABLE "reviews" ADD CONSTRAINT "reviews_customer_id_users_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
    ALTER TABLE "reviews_images" ADD CONSTRAINT "reviews_images_parent_id_reviews_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."reviews"("id") ON DELETE cascade ON UPDATE no action;
    ALTER TABLE "reviews_images" ADD CONSTRAINT "reviews_images_media_id_media_id_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
    CREATE INDEX IF NOT EXISTS "reviews_order_idx" ON "reviews" USING btree ("order_id");
    CREATE INDEX IF NOT EXISTS "reviews_product_idx" ON "reviews" USING btree ("product_id");
    CREATE UNIQUE INDEX IF NOT EXISTS "reviews_order_product_unique" ON "reviews" USING btree ("order_id", "product_id");
    CREATE INDEX IF NOT EXISTS "reviews_images_order_idx" ON "reviews_images" USING btree ("_order");
    CREATE INDEX IF NOT EXISTS "reviews_images_parent_id_idx" ON "reviews_images" USING btree ("_parent_id");
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DROP TABLE IF EXISTS "reviews_images";
    DROP TABLE IF EXISTS "reviews";
  `)
}
