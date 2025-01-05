create extension if not exists "postgis" with schema "extensions";


drop policy "Each their own data" on "public"."users_data";

alter table "public"."properties" add column "location" text;

alter table "public"."properties" add column "location_point" geography(Point,4326);

alter table "public"."properties" add column "size" bigint;

alter table "public"."users_data" add column "latitude" double precision;

alter table "public"."users_data" add column "location" text;

alter table "public"."users_data" add column "longitude" double precision;

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.search_by_location(user_lat double precision, user_lon double precision, search_radius double precision)
 RETURNS SETOF properties
 LANGUAGE plpgsql
AS $function$
BEGIN
  RETURN QUERY
  SELECT *
  FROM properties
  WHERE ST_DWithin(
    location_point,
    ST_SetSRID(ST_MakePoint(user_lon, user_lat), 4326),
    search_radius
  );
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_location_point()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  NEW.geom = ST_SetSRID(ST_MakePoint(NEW.longitude, NEW.latitude), 4326);
  RETURN NEW;
END;
$function$
;

CREATE TRIGGER set_location_point BEFORE INSERT OR UPDATE ON public.properties FOR EACH ROW EXECUTE FUNCTION update_location_point();


