alter table "public"."search_log" drop constraint "search_log_property_id_fkey";

alter table "public"."properties" add column "location_id" text not null default 'ChIJ_YxioMIyZUcR6jsjK4JnnSU'::text;

alter table "public"."properties" disable row level security;

alter table "public"."search_log" drop column "property_id";


