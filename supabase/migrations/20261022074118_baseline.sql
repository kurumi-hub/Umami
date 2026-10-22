--
-- PostgreSQL database dump
--

-- \restrict rwaecw4k5YWWwit3ZIeMJ5uStDnKKRNdQCtRMJ2gaxfpgnWmgdR5Q8zOee83lwQ

-- Dumped from database version 17.6
-- Dumped by pg_dump version 17.6

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
-- SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

-- Supabase's schema-only dump excludes extension installation. These
-- extensions are part of the existing public schema and are required by the
-- trigram indexes and search functions restored below.
CREATE EXTENSION IF NOT EXISTS "pg_trgm" SCHEMA "public";
CREATE EXTENSION IF NOT EXISTS "unaccent" SCHEMA "public";

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: postgres
--

CREATE SCHEMA IF NOT EXISTS "public";


ALTER SCHEMA "public" OWNER TO "postgres";

--
-- Name: activity_type; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE "public"."activity_type" AS ENUM (
    'published_recipe',
    'rated_recipe',
    'tipped_recipe',
    'saved_recipe',
    'created_collection',
    'followed_user'
);


ALTER TYPE "public"."activity_type" OWNER TO "postgres";

--
-- Name: app_role; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE "public"."app_role" AS ENUM (
    'user',
    'moderator',
    'admin'
);


ALTER TYPE "public"."app_role" OWNER TO "postgres";

--
-- Name: difficulty_lvl; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE "public"."difficulty_lvl" AS ENUM (
    'easy',
    'medium',
    'hard'
);


ALTER TYPE "public"."difficulty_lvl" OWNER TO "postgres";

--
-- Name: follow_state; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE "public"."follow_state" AS ENUM (
    'pending',
    'accepted'
);


ALTER TYPE "public"."follow_state" OWNER TO "postgres";

--
-- Name: meal_slot; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE "public"."meal_slot" AS ENUM (
    'breakfast',
    'lunch',
    'dinner',
    'snack',
    'dessert'
);


ALTER TYPE "public"."meal_slot" OWNER TO "postgres";

--
-- Name: media_type; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE "public"."media_type" AS ENUM (
    'image',
    'video'
);


ALTER TYPE "public"."media_type" OWNER TO "postgres";

--
-- Name: notif_type; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE "public"."notif_type" AS ENUM (
    'new_follower',
    'follow_request',
    'follow_accepted',
    'recipe_rated',
    'recipe_tip',
    'tip_liked',
    'tip_replied',
    'recipe_approved',
    'recipe_rejected',
    'recipe_featured',
    'content_hidden',
    'account_suspended',
    'collection_followed',
    'system'
);


ALTER TYPE "public"."notif_type" OWNER TO "postgres";

--
-- Name: platform_type; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE "public"."platform_type" AS ENUM (
    'ios',
    'android',
    'web'
);


ALTER TYPE "public"."platform_type" OWNER TO "postgres";

--
-- Name: recipe_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE "public"."recipe_status" AS ENUM (
    'draft',
    'pending_review',
    'published',
    'rejected',
    'archived'
);


ALTER TYPE "public"."recipe_status" OWNER TO "postgres";

--
-- Name: report_reason; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE "public"."report_reason" AS ENUM (
    'spam',
    'inappropriate',
    'copyright',
    'dangerous',
    'harassment',
    'other'
);


ALTER TYPE "public"."report_reason" OWNER TO "postgres";

--
-- Name: report_state; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE "public"."report_state" AS ENUM (
    'open',
    'reviewing',
    'resolved',
    'dismissed'
);


ALTER TYPE "public"."report_state" OWNER TO "postgres";

--
-- Name: tag_type; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE "public"."tag_type" AS ENUM (
    'cuisine',
    'meal_type',
    'diet',
    'occasion',
    'technique',
    'main_ingredient'
);


ALTER TYPE "public"."tag_type" OWNER TO "postgres";

--
-- Name: target_type; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE "public"."target_type" AS ENUM (
    'recipe',
    'tip',
    'reply',
    'profile',
    'collection'
);


ALTER TYPE "public"."target_type" OWNER TO "postgres";

--
-- Name: unit_system; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE "public"."unit_system" AS ENUM (
    'metric',
    'imperial'
);


ALTER TYPE "public"."unit_system" OWNER TO "postgres";

--
-- Name: add_recipe_tip("uuid", "text", "text"); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION "public"."add_recipe_tip"("p_recipe_id" "uuid", "p_body" "text", "p_image_url" "text" DEFAULT NULL::"text") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare v_tip recipe_tips;
begin
  if not is_active() then raise exception 'Tài khoản đang bị khoá'; end if;
  if coalesce(trim(p_body), '') = '' then raise exception 'Nội dung bình luận không được để trống'; end if;
  if not can_view_recipe(p_recipe_id) then raise exception 'Không tìm thấy công thức'; end if;

  insert into recipe_tips (recipe_id, user_id, body, image_url)
  values (p_recipe_id, auth.uid(), p_body, p_image_url)
  returning * into v_tip;

  return jsonb_build_object(
    'id', v_tip.id, 'body', v_tip.body, 'image_url', v_tip.image_url,
    'like_count', v_tip.like_count, 'reply_count', v_tip.reply_count,
    'created_at', v_tip.created_at
  );
end $$;


ALTER FUNCTION "public"."add_recipe_tip"("p_recipe_id" "uuid", "p_body" "text", "p_image_url" "text") OWNER TO "postgres";

--
-- Name: add_recipe_to_my_shopping_list("uuid", numeric); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION "public"."add_recipe_to_my_shopping_list"("p_recipe_id" "uuid", "p_target_servings" numeric DEFAULT NULL::numeric) RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare v_list_id uuid;
begin
  if not is_active() then raise exception 'Tài khoản đang bị khoá'; end if;

  select id into v_list_id from shopping_lists
  where user_id = auth.uid()
  order by created_at asc
  limit 1;

  if v_list_id is null then
    insert into shopping_lists (user_id) values (auth.uid()) returning id into v_list_id;
  end if;

  perform add_recipe_to_shopping_list(p_recipe_id, v_list_id, p_target_servings);
end $$;


ALTER FUNCTION "public"."add_recipe_to_my_shopping_list"("p_recipe_id" "uuid", "p_target_servings" numeric) OWNER TO "postgres";

--
-- Name: add_recipe_to_shopping_list("uuid", "uuid", numeric); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION "public"."add_recipe_to_shopping_list"("p_recipe_id" "uuid", "p_list_id" "uuid", "p_target_servings" numeric DEFAULT NULL::numeric) RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  v_original_servings numeric;
  v_scale numeric;
begin
  if not exists (select 1 from shopping_lists where id = p_list_id and user_id = auth.uid()) then
    raise exception 'Không có quyền với danh sách này';
  end if;

  select servings into v_original_servings from recipes where id = p_recipe_id;

  v_scale := case
    when p_target_servings is null or v_original_servings is null or v_original_servings = 0
      then 1
    else p_target_servings / v_original_servings
  end;

  insert into shopping_list_items (list_id, ingredient_id, recipe_id, quantity, unit, custom_name)
  select
    p_list_id, ri.ingredient_id, p_recipe_id,
    case when ri.quantity is null then null
         else round(ri.quantity * v_scale, 2)
    end,
    ri.unit,
    ri.raw_text
  from recipe_ingredients ri
  where ri.recipe_id = p_recipe_id and ri.is_optional = false;
end $$;


ALTER FUNCTION "public"."add_recipe_to_shopping_list"("p_recipe_id" "uuid", "p_list_id" "uuid", "p_target_servings" numeric) OWNER TO "postgres";

--
-- Name: add_tip_reply("uuid", "text"); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION "public"."add_tip_reply"("p_tip_id" "uuid", "p_body" "text") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare v_reply tip_replies;
begin
  if not is_active() then raise exception 'Tài khoản đang bị khoá'; end if;
  if coalesce(trim(p_body), '') = '' then raise exception 'Nội dung trả lời không được để trống'; end if;

  insert into tip_replies (tip_id, user_id, body)
  values (p_tip_id, auth.uid(), p_body)
  returning * into v_reply;

  return jsonb_build_object(
    'id', v_reply.id, 'body', v_reply.body, 'created_at', v_reply.created_at
  );
end $$;


ALTER FUNCTION "public"."add_tip_reply"("p_tip_id" "uuid", "p_body" "text") OWNER TO "postgres";

--
-- Name: add_to_collection("uuid", "uuid"); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION "public"."add_to_collection"("p_collection_id" "uuid", "p_recipe_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare next_pos integer;
begin
  if not can_edit_collection(p_collection_id) then
    raise exception 'Không có quyền với bộ sưu tập này';
  end if;
  if not can_view_recipe(p_recipe_id) then
    raise exception 'Không tìm thấy công thức';
  end if;

  select coalesce(max(position), -1) + 1 into next_pos
  from collection_recipes where collection_id = p_collection_id;

  insert into collection_recipes (collection_id, recipe_id, position)
  values (p_collection_id, p_recipe_id, next_pos)
  on conflict (collection_id, recipe_id) do nothing;

  update collections c
  set cover_url = r.thumbnail_url
  from recipes r
  where c.id = p_collection_id and c.cover_url is null and r.id = p_recipe_id;
end $$;


ALTER FUNCTION "public"."add_to_collection"("p_collection_id" "uuid", "p_recipe_id" "uuid") OWNER TO "postgres";

--
-- Name: admin_delete_recipe("uuid", "text"); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION "public"."admin_delete_recipe"("p_recipe_id" "uuid", "p_reason" "text") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare snap jsonb;
begin
  perform require_admin();
  if coalesce(trim(p_reason), '') = '' then raise exception 'Phải nêu lý do'; end if;

  -- Lưu ảnh chụp trước khi xoá, vì hành động này không hoàn tác được
  select to_jsonb(r) into snap from recipes r where r.id = p_recipe_id;
  if snap is null then raise exception 'Không tìm thấy công thức'; end if;

  perform log_action('delete_recipe', 'recipe', p_recipe_id, p_reason,
                            jsonb_build_object('snapshot', snap));
  delete from recipes where id = p_recipe_id;
end $$;


ALTER FUNCTION "public"."admin_delete_recipe"("p_recipe_id" "uuid", "p_reason" "text") OWNER TO "postgres";

--
-- Name: admin_engagement_stats(integer, integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION "public"."admin_engagement_stats"("p_days" integer DEFAULT 30, "lim" integer DEFAULT 8) RETURNS "jsonb"
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  result jsonb;
begin
  perform require_admin();

  select jsonb_build_object(
    'top_recipes', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', id, 'title', title, 'slug', slug,
        'view_count', view_count, 'save_count', save_count, 'avg_rating', avg_rating
      ))
      from (
        select id, title, slug, view_count, save_count, avg_rating
        from recipes
        where status = 'published' and not is_hidden
        order by view_count desc
        limit lim
      ) x
    ), '[]'::jsonb),

    'top_tags', coalesce((
      select jsonb_agg(jsonb_build_object('name', name, 'count', cnt) order by cnt desc)
      from (
        select t.name, count(*) as cnt
        from recipe_tags rt
        join tags t on t.id = rt.tag_id
        join recipes r on r.id = rt.recipe_id
        where r.status = 'published' and not r.is_hidden
        group by t.name
        order by cnt desc
        limit lim
      ) x
    ), '[]'::jsonb),

    'dead_recipes_count', (
      select count(*) from recipes
      where status = 'published' and not is_hidden
        and view_count = 0
        and created_at < now() - (p_days || ' days')::interval
    )
  ) into result;

  return result;
end $$;


ALTER FUNCTION "public"."admin_engagement_stats"("p_days" integer, "lim" integer) OWNER TO "postgres";

--
-- Name: admin_grant_role("uuid", "public"."app_role"); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION "public"."admin_grant_role"("p_user_id" "uuid", "p_role" "public"."app_role") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
begin
  perform require_admin();
  if p_role = 'user' then raise exception 'user là mặc định, không cần cấp'; end if;

  insert into user_roles (user_id, role, granted_by)
  values (p_user_id, p_role, auth.uid())
  on conflict (user_id, role) do nothing;

  perform log_action('grant_role', 'profile', p_user_id, null,
                            jsonb_build_object('role', p_role));
end $$;


ALTER FUNCTION "public"."admin_grant_role"("p_user_id" "uuid", "p_role" "public"."app_role") OWNER TO "postgres";

--
-- Name: admin_growth_stats(integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION "public"."admin_growth_stats"("p_days" integer DEFAULT 30) RETURNS TABLE("day" "date", "new_users" bigint, "new_recipes" bigint, "new_follows" bigint)
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
begin
  perform require_admin();

  return query
  select
    d::date,
    coalesce((select count(*) from profiles where created_at::date = d), 0),
    coalesce((select count(*) from recipes where created_at::date = d), 0),
    coalesce((select count(*) from follows where created_at::date = d), 0)
  from generate_series(
    current_date - (p_days - 1),
    current_date,
    interval '1 day'
  ) d
  order by d;
end $$;


ALTER FUNCTION "public"."admin_growth_stats"("p_days" integer) OWNER TO "postgres";

--
-- Name: admin_moderation_stats(integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION "public"."admin_moderation_stats"("p_days" integer DEFAULT 30) RETURNS "jsonb"
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  result jsonb;
begin
  perform require_admin();

  select jsonb_build_object(
    'reports_per_day', coalesce((
      select jsonb_agg(jsonb_build_object('day', d::date, 'count', cnt) order by d)
      from (
        select gs.d, count(r.id) as cnt
        from generate_series(current_date - (p_days - 1), current_date, interval '1 day') gs(d)
        left join reports r on r.created_at::date = gs.d
        group by gs.d
      ) x
    ), '[]'::jsonb),

    'reports_by_reason', coalesce((
      select jsonb_agg(jsonb_build_object('reason', reason, 'count', cnt) order by cnt desc)
      from (
        select reason, count(*) as cnt
        from reports
        where created_at >= now() - (p_days || ' days')::interval
        group by reason
      ) x
    ), '[]'::jsonb),

    'approved_count', (
      select count(*) from audit_log
      where action = 'approve_recipe' and created_at >= now() - (p_days || ' days')::interval
    ),
    'rejected_count', (
      select count(*) from audit_log
      where action = 'reject_recipe' and created_at >= now() - (p_days || ' days')::interval
    ),
    'open_reports_count', (
      select count(*) from reports where state = 'open'
    ),
    'pending_recipes_count', (
      select count(*) from recipes where status = 'pending_review'
    ),
    'oldest_pending_days', (
      select extract(day from now() - min(created_at))::int
      from recipes where status = 'pending_review'
    ),
    'suspended_users_count', (
      select count(*) from profiles
      where suspended_until is not null and suspended_until > now()
    )
  ) into result;

  return result;
end $$;


ALTER FUNCTION "public"."admin_moderation_stats"("p_days" integer) OWNER TO "postgres";

--
-- Name: admin_revoke_role("uuid", "public"."app_role"); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION "public"."admin_revoke_role"("p_user_id" "uuid", "p_role" "public"."app_role") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
begin
  perform require_admin();
  if p_user_id = auth.uid() and p_role = 'admin' then
    raise exception 'Không thể tự thu hồi quyền admin của mình';
  end if;
  -- Luôn phải còn ít nhất một admin
  if p_role = 'admin' and
     (select count(*) from user_roles where role = 'admin') <= 1 then
    raise exception 'Không thể thu hồi admin cuối cùng';
  end if;

  delete from user_roles where user_id = p_user_id and role = p_role;
  perform log_action('revoke_role', 'profile', p_user_id, null,
                            jsonb_build_object('role', p_role));
end $$;


ALTER FUNCTION "public"."admin_revoke_role"("p_user_id" "uuid", "p_role" "public"."app_role") OWNER TO "postgres";

--
-- Name: admin_search_recipes("text", integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION "public"."admin_search_recipes"("q" "text", "lim" integer DEFAULT 8) RETURNS TABLE("recipe_id" "uuid", "title" "text", "slug" "text", "status" "public"."recipe_status", "created_at" timestamp with time zone, "author_id" "uuid", "author_name" "text", "author_username" "text")
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
begin
  perform require_admin();

  return query
  select r.id, r.title, r.slug, r.status, r.created_at,
         p.id, coalesce(p.display_name, p.username), p.username
  from recipes r
  left join profiles p on p.id = r.author_id
  where r.title ilike '%' || q || '%'
  order by r.created_at desc
  limit lim;
end $$;


ALTER FUNCTION "public"."admin_search_recipes"("q" "text", "lim" integer) OWNER TO "postgres";

--
-- Name: admin_update_moderation_settings(integer, integer, boolean); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION "public"."admin_update_moderation_settings"("p_auto_hide_threshold" integer DEFAULT NULL::integer, "p_reports_per_day_limit" integer DEFAULT NULL::integer, "p_require_first_post_review" boolean DEFAULT NULL::boolean) RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
begin
  perform require_admin();
  update moderation_settings
  set auto_hide_threshold       = coalesce(p_auto_hide_threshold, auto_hide_threshold),
      reports_per_day_limit     = coalesce(p_reports_per_day_limit, reports_per_day_limit),
      require_first_post_review = coalesce(p_require_first_post_review, require_first_post_review)
  where id = true;
  perform log_action('update_moderation_settings', null, null, null,
    jsonb_build_object('threshold', p_auto_hide_threshold,
                       'daily_limit', p_reports_per_day_limit,
                       'first_post_review', p_require_first_post_review));
end $$;


ALTER FUNCTION "public"."admin_update_moderation_settings"("p_auto_hide_threshold" integer, "p_reports_per_day_limit" integer, "p_require_first_post_review" boolean) OWNER TO "postgres";

--
-- Name: after_block(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION "public"."after_block"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
begin
  delete from follows
  where (follower_id = new.blocker_id and followee_id = new.blocked_id)
     or (follower_id = new.blocked_id and followee_id = new.blocker_id);
  return null;
end $$;


ALTER FUNCTION "public"."after_block"() OWNER TO "postgres";

--
-- Name: after_collection_created(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION "public"."after_collection_created"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
begin
  if new.is_public then
    insert into activity_events (actor_id, type, target_type, target_id, payload)
    values (new.user_id, 'created_collection', 'collection', new.id,
            jsonb_build_object('name', new.name, 'cover_url', new.cover_url));
  end if;
  return null;
end $$;


ALTER FUNCTION "public"."after_collection_created"() OWNER TO "postgres";

--
-- Name: after_collection_follow(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION "public"."after_collection_follow"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare owner uuid;
begin
  if tg_op = 'INSERT' then
    update collections set follower_count = follower_count + 1 where id = new.collection_id
    returning user_id into owner;
    if owner is not null and owner <> new.user_id then
      insert into notifications (user_id, actor_id, type, target_type, target_id)
      values (owner, new.user_id, 'collection_followed', 'collection', new.collection_id);
    end if;
  else
    update collections set follower_count = greatest(follower_count - 1, 0) where id = old.collection_id;
  end if;
  return null;
end $$;


ALTER FUNCTION "public"."after_collection_follow"() OWNER TO "postgres";

--
-- Name: after_collection_recipe(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION "public"."after_collection_recipe"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
begin
  if tg_op = 'INSERT' then
    update collections set recipe_count = recipe_count + 1 where id = new.collection_id;
  else
    update collections set recipe_count = greatest(recipe_count - 1, 0) where id = old.collection_id;
  end if;
  return null;
end $$;


ALTER FUNCTION "public"."after_collection_recipe"() OWNER TO "postgres";

--
-- Name: after_follow_change(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION "public"."after_follow_change"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
begin
  if tg_op = 'INSERT' then
    if new.state = 'accepted' then
      update profiles set follower_count  = follower_count  + 1 where id = new.followee_id;
      update profiles set following_count = following_count + 1 where id = new.follower_id;
      insert into activity_events (actor_id, type, target_type, target_id)
      values (new.follower_id, 'followed_user', 'profile', new.followee_id);
    end if;

    insert into notifications (user_id, actor_id, type, target_type, target_id)
    values (new.followee_id, new.follower_id,
            -- FIX v3: case trả về text, phải cast sang notif_type
            (case when new.state = 'pending' then 'follow_request' else 'new_follower' end)::notif_type,
            'profile', new.follower_id);

  elsif tg_op = 'UPDATE' then
    if old.state = 'pending' and new.state = 'accepted' then
      update profiles set follower_count  = follower_count  + 1 where id = new.followee_id;
      update profiles set following_count = following_count + 1 where id = new.follower_id;
      -- FIX v3: trước đây duyệt follow không sinh thông báo/hoạt động nào.
      insert into notifications (user_id, actor_id, type, target_type, target_id)
      values (new.follower_id, new.followee_id, 'follow_accepted', 'profile', new.followee_id);
      insert into activity_events (actor_id, type, target_type, target_id)
      values (new.follower_id, 'followed_user', 'profile', new.followee_id);
    end if;

  elsif tg_op = 'DELETE' then
    if old.state = 'accepted' then
      update profiles set follower_count  = greatest(follower_count  - 1, 0) where id = old.followee_id;
      update profiles set following_count = greatest(following_count - 1, 0) where id = old.follower_id;
    end if;
  end if;

  return null;
end $$;


ALTER FUNCTION "public"."after_follow_change"() OWNER TO "postgres";

--
-- Name: after_rating_change(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION "public"."after_rating_change"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare rid uuid; author uuid;
begin
  rid := coalesce(new.recipe_id, old.recipe_id);

  update recipes r
  set avg_rating = s.avg_r, rating_count = s.cnt
  from (
    select coalesce(avg(rating), 0)::numeric(3,2) as avg_r, count(*) as cnt
    from recipe_ratings where recipe_id = rid
  ) s
  where r.id = rid;

  if tg_op = 'INSERT' then
    select author_id into author from recipes where id = rid;
    if author is not null and author <> new.user_id then
      insert into notifications (user_id, actor_id, type, target_type, target_id, payload)
      values (author, new.user_id, 'recipe_rated', 'recipe', rid,
              jsonb_build_object('rating', new.rating));
    end if;
    insert into activity_events (actor_id, type, target_type, target_id, payload)
    values (new.user_id, 'rated_recipe', 'recipe', rid, jsonb_build_object('rating', new.rating));
  end if;

  return null;
end $$;


ALTER FUNCTION "public"."after_rating_change"() OWNER TO "postgres";

--
-- Name: after_recipe_change(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION "public"."after_recipe_change"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
begin
  -- FIX v3: user trusted insert thẳng status='published' (gate cho qua)
  -- thì trước đây không được đếm và không có activity event.
  if tg_op = 'INSERT' and new.status = 'published' then
    update profiles set recipe_count = recipe_count + 1 where id = new.author_id;
    insert into activity_events (actor_id, type, target_type, target_id, payload)
    values (new.author_id, 'published_recipe', 'recipe', new.id,
            jsonb_build_object('title', new.title, 'thumbnail_url', new.thumbnail_url));
  elsif tg_op = 'UPDATE' and old.status is distinct from 'published' and new.status = 'published' then
    update profiles set recipe_count = recipe_count + 1 where id = new.author_id;
    insert into activity_events (actor_id, type, target_type, target_id, payload)
    values (new.author_id, 'published_recipe', 'recipe', new.id,
            jsonb_build_object('title', new.title, 'thumbnail_url', new.thumbnail_url));
  elsif tg_op = 'UPDATE' and old.status = 'published' and new.status is distinct from 'published' then
    update profiles set recipe_count = greatest(recipe_count - 1, 0) where id = new.author_id;
  elsif tg_op = 'DELETE' and old.status = 'published' then
    update profiles set recipe_count = greatest(recipe_count - 1, 0) where id = old.author_id;
  end if;
  return null;
end $$;


ALTER FUNCTION "public"."after_recipe_change"() OWNER TO "postgres";

--
-- Name: after_report_insert(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION "public"."after_report_insert"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  threshold integer;
  daily_cap integer;
  today_cnt integer;
  open_cnt  integer;
begin
  select auto_hide_threshold, reports_per_day_limit
  into threshold, daily_cap from moderation_settings limit 1;

  -- Chống lạm dụng report
  select count(*) into today_cnt from reports
  where reporter_id = new.reporter_id and created_at > now() - interval '1 day';
  if today_cnt > coalesce(daily_cap, 20) then
    raise exception 'Bạn đã báo cáo quá nhiều trong 24 giờ qua';
  end if;

  select count(*) into open_cnt from reports
  where target_type = new.target_type and target_id = new.target_id and state = 'open';

  if new.target_type = 'recipe' then
    update recipes set report_count = open_cnt where id = new.target_id;
    if open_cnt >= coalesce(threshold, 3) then
      update recipes set is_hidden = true where id = new.target_id and not is_hidden;
    end if;
  elsif new.target_type = 'tip' then
    update recipe_tips set report_count = open_cnt where id = new.target_id;
    if open_cnt >= coalesce(threshold, 3) then
      update recipe_tips set is_hidden = true where id = new.target_id and not is_hidden;
    end if;
  elsif new.target_type = 'reply' then
    update tip_replies set report_count = open_cnt where id = new.target_id;
    if open_cnt >= coalesce(threshold, 3) then
      update tip_replies set is_hidden = true where id = new.target_id and not is_hidden;
    end if;
  end if;

  return null;
end $$;


ALTER FUNCTION "public"."after_report_insert"() OWNER TO "postgres";

--
-- Name: after_save_change(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION "public"."after_save_change"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
begin
  if tg_op = 'INSERT' then
    update recipes set save_count = save_count + 1 where id = new.recipe_id;
    insert into activity_events (actor_id, type, target_type, target_id)
    values (new.user_id, 'saved_recipe', 'recipe', new.recipe_id);
  else
    update recipes set save_count = greatest(save_count - 1, 0) where id = old.recipe_id;
  end if;
  return null;
end $$;


ALTER FUNCTION "public"."after_save_change"() OWNER TO "postgres";

--
-- Name: after_tip_change(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION "public"."after_tip_change"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare author uuid;
begin
  if tg_op = 'INSERT' then
    update recipes  set tip_count = tip_count + 1 where id = new.recipe_id;
    update profiles set tip_count = tip_count + 1 where id = new.user_id;

    select author_id into author from recipes where id = new.recipe_id;
    if author is not null and author <> new.user_id then
      insert into notifications (user_id, actor_id, type, target_type, target_id)
      values (author, new.user_id, 'recipe_tip', 'tip', new.id);
    end if;

    insert into activity_events (actor_id, type, target_type, target_id)
    values (new.user_id, 'tipped_recipe', 'tip', new.id);

  elsif tg_op = 'DELETE' then
    update recipes  set tip_count = greatest(tip_count - 1, 0) where id = old.recipe_id;
    update profiles set tip_count = greatest(tip_count - 1, 0) where id = old.user_id;
  end if;
  return null;
end $$;


ALTER FUNCTION "public"."after_tip_change"() OWNER TO "postgres";

--
-- Name: after_tip_like(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION "public"."after_tip_like"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare owner uuid;
begin
  if tg_op = 'INSERT' then
    update recipe_tips set like_count = like_count + 1 where id = new.tip_id
    returning user_id into owner;
    if owner is not null and owner <> new.user_id then
      insert into notifications (user_id, actor_id, type, target_type, target_id)
      values (owner, new.user_id, 'tip_liked', 'tip', new.tip_id);
    end if;
  else
    update recipe_tips set like_count = greatest(like_count - 1, 0) where id = old.tip_id;
  end if;
  return null;
end $$;


ALTER FUNCTION "public"."after_tip_like"() OWNER TO "postgres";

--
-- Name: after_tip_reply(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION "public"."after_tip_reply"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare owner uuid;
begin
  if tg_op = 'INSERT' then
    update recipe_tips set reply_count = reply_count + 1 where id = new.tip_id
    returning user_id into owner;
    if owner is not null and owner <> new.user_id then
      insert into notifications (user_id, actor_id, type, target_type, target_id)
      values (owner, new.user_id, 'tip_replied', 'reply', new.id);
    end if;
  else
    update recipe_tips set reply_count = greatest(reply_count - 1, 0) where id = old.tip_id;
  end if;
  return null;
end $$;


ALTER FUNCTION "public"."after_tip_reply"() OWNER TO "postgres";

--
-- Name: after_view_insert(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION "public"."after_view_insert"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
begin
  update recipes set view_count = view_count + 1 where id = new.recipe_id;
  return null;
end $$;


ALTER FUNCTION "public"."after_view_insert"() OWNER TO "postgres";

--
-- Name: before_follow(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION "public"."before_follow"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
begin
  if exists (
    select 1 from blocks
    where (blocker_id = new.followee_id and blocked_id = new.follower_id)
       or (blocker_id = new.follower_id and blocked_id = new.followee_id)
  ) then
    raise exception 'Không thể theo dõi: quan hệ đã bị chặn';
  end if;

  if tg_op = 'INSERT' then
    select case when p.is_private then 'pending'::follow_state else 'accepted'::follow_state end
    into new.state
    from profiles p where p.id = new.followee_id;
  end if;

  return new;
end $$;


ALTER FUNCTION "public"."before_follow"() OWNER TO "postgres";

--
-- Name: can_edit_collection("uuid"); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION "public"."can_edit_collection"("cid" "uuid") RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  select exists (select 1 from collections where id = cid and user_id = auth.uid());
$$;


ALTER FUNCTION "public"."can_edit_collection"("cid" "uuid") OWNER TO "postgres";

--
-- Name: can_view_collection("uuid"); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION "public"."can_view_collection"("cid" "uuid") RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  select exists (
    select 1 from collections c
    where c.id = cid
      and (c.user_id = auth.uid() or is_moderator()
           or (c.is_public and not c.is_hidden and not is_blocked_with(c.user_id)))
  );
$$;


ALTER FUNCTION "public"."can_view_collection"("cid" "uuid") OWNER TO "postgres";

--
-- Name: can_view_profile("uuid"); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION "public"."can_view_profile"("pid" "uuid") RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  select case
    when pid = auth.uid() then true
    when is_moderator() then true
    when is_blocked_with(pid) then false
    when (select is_private from profiles where id = pid) = false then true
    else exists (select 1 from follows
                 where follower_id = auth.uid() and followee_id = pid and state = 'accepted')
  end;
$$;


ALTER FUNCTION "public"."can_view_profile"("pid" "uuid") OWNER TO "postgres";

--
-- Name: can_view_recipe("uuid"); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION "public"."can_view_recipe"("rid" "uuid") RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  select exists (
    select 1 from recipes r
    where r.id = rid
      and (r.author_id = auth.uid()
           or is_moderator()
           or (r.status = 'published' and not r.is_hidden
               and (r.author_id is null or not is_blocked_with(r.author_id))))
  );
$$;


ALTER FUNCTION "public"."can_view_recipe"("rid" "uuid") OWNER TO "postgres";

--
-- Name: community_feed(integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION "public"."community_feed"("lim" integer DEFAULT 21) RETURNS TABLE("event_id" bigint, "actor_id" "uuid", "actor_name" "text", "actor_username" "text", "actor_avatar" "text", "type" "public"."activity_type", "created_at" timestamp with time zone, "recipe_id" "uuid", "recipe_slug" "text", "recipe_title" "text", "recipe_thumbnail_url" "text", "tip_id" "uuid", "tip_body" "text", "tip_like_count" integer, "tip_reply_count" integer, "liked_by_me" boolean, "is_discover" boolean)
    LANGUAGE "sql" STABLE
    AS $$
  with follow_ids as (
    select followee_id from follows
    where follower_id = auth.uid() and state = 'accepted'
  ),
  base as (
    select e.id, e.actor_id, e.type, e.target_type, e.target_id, e.created_at
    from activity_events e
    where e.type in ('published_recipe', 'tipped_recipe')
      and e.actor_id <> auth.uid()
      and (
        e.actor_id in (select followee_id from follow_ids)
        or (
          e.created_at > now() - interval '14 days'
          and e.actor_id not in (select followee_id from follow_ids)
        )
      )
  ),
  following_part as (
    select b.*, row_number() over (order by b.created_at desc) as rn
    from base b
    where b.actor_id in (select followee_id from follow_ids)
  ),
  discover_part as (
    select b.*, row_number() over (order by random()) as rn
    from base b
    where b.actor_id not in (select followee_id from follow_ids)
  ),
  -- Trộn xen kẽ 2:1 bằng công thức vị trí — không cần vòng lặp thủ tục:
  -- 2 mục theo dõi liên tiếp rồi tới 1 mục khám phá, lặp lại.
  mixed as (
    select id, actor_id, type, target_type, target_id, created_at, false as is_discover,
           ((rn - 1) / 2) * 3 + ((rn - 1) % 2) + 1 as slot
    from following_part
    union all
    select id, actor_id, type, target_type, target_id, created_at, true as is_discover,
           rn * 3 as slot
    from discover_part
  )
  select
    m.id, p.id, p.display_name, p.username, p.avatar_url,
    m.type, m.created_at,
    case when m.target_type = 'recipe' then r1.id else r2.id end,
    case when m.target_type = 'recipe' then r1.slug else r2.slug end,
    case when m.target_type = 'recipe' then r1.title else r2.title end,
    case when m.target_type = 'recipe' then r1.thumbnail_url else r2.thumbnail_url end,
    case when m.target_type = 'tip' then t.id end,
    case when m.target_type = 'tip' then t.body end,
    case when m.target_type = 'tip' then t.like_count end,
    case when m.target_type = 'tip' then t.reply_count end,
    case when m.target_type = 'tip'
         then exists (select 1 from tip_likes tl where tl.tip_id = t.id and tl.user_id = auth.uid())
         else null end,
    m.is_discover
  from mixed m
  join profiles p on p.id = m.actor_id
  left join recipes r1
         on m.target_type = 'recipe' and r1.id = m.target_id
        and r1.status = 'published' and not r1.is_hidden
  left join recipe_tips t
         on m.target_type = 'tip' and t.id = m.target_id and not t.is_hidden
  left join recipes r2
         on m.target_type = 'tip' and r2.id = t.recipe_id
        and r2.status = 'published' and not r2.is_hidden
  where (m.target_type = 'recipe' and r1.id is not null)
     or (m.target_type = 'tip' and t.id is not null and r2.id is not null)
  order by m.slot
  limit lim;
$$;


ALTER FUNCTION "public"."community_feed"("lim" integer) OWNER TO "postgres";

--
-- Name: custom_access_token_hook("jsonb"); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION "public"."custom_access_token_hook"("event" "jsonb") RETURNS "jsonb"
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  claims    jsonb;
  user_role text;
begin
  select r.role::text into user_role
  from public.user_roles r
  where r.user_id = (event->>'user_id')::uuid
  order by case r.role when 'admin' then 3 when 'moderator' then 2 else 1 end desc
  limit 1;

  claims := coalesce(event->'claims', '{}'::jsonb);
  claims := jsonb_set(claims, '{app_role}', to_jsonb(coalesce(user_role, 'user')));

  return jsonb_set(event, '{claims}', claims);
exception when others then
  -- Không bao giờ để hook làm sập việc phát token:
  -- có lỗi gì thì cứ trả về event gốc (role mặc định 'user').
  return event;
end;
$$;


ALTER FUNCTION "public"."custom_access_token_hook"("event" "jsonb") OWNER TO "postgres";

--
-- Name: featured_collections(integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION "public"."featured_collections"("lim" integer DEFAULT 6) RETURNS TABLE("collection_id" "uuid", "name" "text", "cover_url" "text", "recipe_count" integer, "follower_count" integer, "owner_id" "uuid", "owner_name" "text", "owner_username" "text")
    LANGUAGE "sql" STABLE
    AS $$
  select c.id, c.name, c.cover_url, c.recipe_count, c.follower_count,
         p.id, p.display_name, p.username
  from collections c
  join profiles p on p.id = c.user_id
  where c.is_public and not c.is_hidden
  order by c.follower_count desc, c.recipe_count desc
  limit lim;
$$;


ALTER FUNCTION "public"."featured_collections"("lim" integer) OWNER TO "postgres";

--
-- Name: following_feed(integer, timestamp with time zone); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION "public"."following_feed"("lim" integer DEFAULT 30, "before_ts" timestamp with time zone DEFAULT "now"()) RETURNS TABLE("event_id" bigint, "actor_id" "uuid", "actor_name" "text", "actor_avatar" "text", "type" "public"."activity_type", "target_type" "public"."target_type", "target_id" "uuid", "payload" "jsonb", "created_at" timestamp with time zone)
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  select e.id, e.actor_id, p.display_name, p.avatar_url,
         e.type, e.target_type, e.target_id, e.payload, e.created_at
  from activity_events e
  join profiles p on p.id = e.actor_id
  join follows f  on f.followee_id = e.actor_id
  where f.follower_id = auth.uid() and f.state = 'accepted'
    and e.created_at < before_ts
    and (p.suspended_until is null or p.suspended_until < now())
    and not is_blocked_with(e.actor_id)
  order by e.created_at desc
  limit lim;
$$;


ALTER FUNCTION "public"."following_feed"("lim" integer, "before_ts" timestamp with time zone) OWNER TO "postgres";

--
-- Name: gate_recipe_publish(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION "public"."gate_recipe_publish"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  trusted boolean;
  gate_on boolean;
  author_is_mod boolean;
begin
  if new.status = 'published' and (tg_op = 'INSERT' or old.status is distinct from 'published') then
    select require_first_post_review into gate_on from moderation_settings limit 1;
    select is_trusted into trusted from profiles where id = new.author_id;

    select exists (
      select 1 from user_roles
      where user_id = new.author_id and role in ('moderator', 'admin')
    ) into author_is_mod;

    if coalesce(gate_on, true)
       and not coalesce(trusted, false)
       and not author_is_mod
       and not is_moderator() then
      new.status := 'pending_review';
      new.published_at := null;
    else
      new.published_at := coalesce(new.published_at, now());
    end if;
  end if;
  return new;
end $$;


ALTER FUNCTION "public"."gate_recipe_publish"() OWNER TO "postgres";

--
-- Name: get_email_by_username("text"); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION "public"."get_email_by_username"("p_username" "text") RETURNS "text"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'auth'
    AS $$
declare
  v_email text;
begin
  select u.email into v_email
  from auth.users u
  join profiles p on p.id = u.id
  where p.username = lower(trim(p_username));

  return v_email;
end $$;


ALTER FUNCTION "public"."get_email_by_username"("p_username" "text") OWNER TO "postgres";

--
-- Name: get_my_notifications(integer, timestamp with time zone); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION "public"."get_my_notifications"("lim" integer DEFAULT 30, "before_ts" timestamp with time zone DEFAULT "now"()) RETURNS TABLE("id" "uuid", "type" "public"."notif_type", "target_type" "public"."target_type", "target_id" "uuid", "payload" "jsonb", "is_read" boolean, "created_at" timestamp with time zone, "actor_id" "uuid", "actor_name" "text", "actor_username" "text", "actor_avatar" "text", "link" "text")
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  select
    n.id, n.type, n.target_type, n.target_id, n.payload, n.is_read, n.created_at,
    p.id, p.display_name, p.username, p.avatar_url,
    case n.target_type
      when 'recipe' then (
        select '/cong-thuc/' || r.slug from recipes r where r.id = n.target_id
      )
      when 'tip' then (
        select '/cong-thuc/' || r.slug
        from recipe_tips t join recipes r on r.id = t.recipe_id
        where t.id = n.target_id
      )
      when 'reply' then (
        select '/cong-thuc/' || r.slug
        from tip_replies rep
        join recipe_tips t on t.id = rep.tip_id
        join recipes r on r.id = t.recipe_id
        where rep.id = n.target_id
      )
      when 'collection' then '/account/collections/' || n.target_id::text
      when 'profile' then (
        select '/u/' || pr.username from profiles pr where pr.id = n.actor_id
      )
      else null
    end as link
  from notifications n
  left join profiles p on p.id = n.actor_id
  where n.user_id = auth.uid() and n.created_at <= before_ts
  order by n.created_at desc
  limit lim;
$$;


ALTER FUNCTION "public"."get_my_notifications"("lim" integer, "before_ts" timestamp with time zone) OWNER TO "postgres";

--
-- Name: get_public_profile("text"); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION "public"."get_public_profile"("p_username" "text") RETURNS "jsonb"
    LANGUAGE "sql" STABLE
    AS $$
  select case
    when not can_view_profile(p.id) then jsonb_build_object(
      'id', p.id, 'username', p.username, 'display_name', p.display_name,
      'avatar_url', p.avatar_url, 'is_private', p.is_private,
      'can_view', false,
      'is_own', p.id = auth.uid(),
      'follow_state', (
        select state::text from follows
        where follower_id = auth.uid() and followee_id = p.id
      ),
      'is_blocked_by_me', exists (
        select 1 from blocks where blocker_id = auth.uid() and blocked_id = p.id
      )
    )
    else jsonb_build_object(
      'id', p.id, 'username', p.username, 'display_name', p.display_name,
      'bio', p.bio, 'avatar_url', p.avatar_url, 'is_private', p.is_private,
      'recipe_count', p.recipe_count, 'follower_count', p.follower_count,
      'following_count', p.following_count,
      'can_view', true,
      'is_own', p.id = auth.uid(),
      'follow_state', (
        select state::text from follows
        where follower_id = auth.uid() and followee_id = p.id
      ),
      'is_blocked_by_me', exists (
        select 1 from blocks where blocker_id = auth.uid() and blocked_id = p.id
      ),
      'recipes', coalesce((
        select jsonb_agg(jsonb_build_object(
          'id', r.id, 'title', r.title, 'slug', r.slug,
          'thumbnail_url', r.thumbnail_url, 'total_time_min', r.total_time_min,
          'difficulty', r.difficulty
        ) order by r.published_at desc)
        from (
          select * from recipes
          where author_id = p.id and status = 'published' and not is_hidden
          order by published_at desc
          limit 8
        ) r
      ), '[]'::jsonb),
      'collections', coalesce((
        select jsonb_agg(jsonb_build_object(
          'id', c.id, 'name', c.name, 'cover_url', c.cover_url,
          'recipe_count', c.recipe_count
        ) order by c.follower_count desc)
        from (
          select * from collections
          where user_id = p.id and is_public and not is_hidden
          order by follower_count desc
          limit 6
        ) c
      ), '[]'::jsonb)
    )
  end
  from profiles p
  where p.username = p_username
  limit 1;
$$;


ALTER FUNCTION "public"."get_public_profile"("p_username" "text") OWNER TO "postgres";

--
-- Name: get_recipe_detail("text"); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION "public"."get_recipe_detail"("p_slug" "text") RETURNS "jsonb"
    LANGUAGE "sql" STABLE
    AS $$
  select jsonb_build_object(
    'id',               r.id,
    'title',            r.title,
    'slug',             r.slug,
    'description',      r.description,
    'thumbnail_url',     r.thumbnail_url,
    'video_url',        r.video_url,
    'prep_time_min',    r.prep_time_min,
    'cook_time_min',    r.cook_time_min,
    'total_time_min',   r.total_time_min,
    'servings',         r.servings,
    'servings_unit',    r.servings_unit,
    'difficulty',       r.difficulty,
    'status',           r.status,
    'is_hidden',        r.is_hidden,
    'avg_rating',       r.avg_rating,
    'rating_count',     r.rating_count,
    'save_count',       r.save_count,
    'tip_count',        r.tip_count,
    'view_count',       r.view_count,
    'published_at',     r.published_at,
    'is_own_recipe',    r.author_id = auth.uid(),

    'author', case when p.id is null then null else jsonb_build_object(
      'id', p.id, 'username', p.username, 'display_name', p.display_name,
      'avatar_url', p.avatar_url
    ) end,

    'follow_state', (
      select state::text from follows
      where follower_id = auth.uid() and followee_id = r.author_id
    ),

    'ingredients', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', ri.id, 'name', i.name, 'quantity', ri.quantity, 'unit', ri.unit,
        'note', ri.note, 'raw_text', ri.raw_text, 'is_optional', ri.is_optional,
        'position', ri.position, 'section_id', ri.section_id,
        'in_pantry', exists (
          select 1 from user_pantry up
          where up.user_id = auth.uid() and up.ingredient_id = ri.ingredient_id
        ),
        'is_allergen', exists (
          select 1 from user_allergens ua
          where ua.user_id = auth.uid() and ua.ingredient_id = ri.ingredient_id
        )
      ) order by ri.position)
      from recipe_ingredients ri
      join ingredients i on i.id = ri.ingredient_id
      where ri.recipe_id = r.id
    ), '[]'::jsonb),

    'unit_conversions', coalesce((
      select jsonb_agg(jsonb_build_object(
        'from_unit', uc.from_unit, 'to_unit', uc.to_unit, 'factor', uc.factor
      ))
      from unit_conversions uc
      where uc.from_unit in (
        select distinct ri.unit from recipe_ingredients ri
        where ri.recipe_id = r.id and ri.unit is not null
      )
    ), '[]'::jsonb),

    'sections', coalesce((
      select jsonb_agg(jsonb_build_object('id', s.id, 'name', s.name, 'position', s.position)
                        order by s.position)
      from recipe_sections s
      where s.recipe_id = r.id
    ), '[]'::jsonb),

    'steps', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', st.id, 'position', st.position, 'content', st.content,
        'image_url', st.image_url, 'timer_seconds', st.timer_seconds
      ) order by st.position)
      from recipe_steps st
      where st.recipe_id = r.id
    ), '[]'::jsonb),

    'tags', coalesce((
      select jsonb_agg(jsonb_build_object('id', t.id, 'type', t.type, 'name', t.name, 'slug', t.slug))
      from recipe_tags rt
      join tags t on t.id = rt.tag_id
      where rt.recipe_id = r.id
    ), '[]'::jsonb),

    'nutrition', (
      select jsonb_build_object(
        'calories', n.calories, 'protein_g', n.protein_g, 'fat_g', n.fat_g,
        'carbs_g', n.carbs_g, 'fiber_g', n.fiber_g, 'sugar_g', n.sugar_g,
        'sodium_mg', n.sodium_mg, 'per_serving', n.per_serving
      )
      from recipe_nutrition n
      where n.recipe_id = r.id
    ),

    'recent_tips', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', rt2.id, 'body', rt2.body, 'image_url', rt2.image_url,
        'like_count', rt2.like_count, 'reply_count', rt2.reply_count,
        'created_at', rt2.created_at,
        'author_id', pu.id, 'author_name', pu.display_name,
        'author_username', pu.username, 'author_avatar', pu.avatar_url,
        'liked_by_me', exists (
          select 1 from tip_likes tl where tl.tip_id = rt2.id and tl.user_id = auth.uid()
        )
      ) order by rt2.created_at desc)
      from (
        select * from recipe_tips
        where recipe_id = r.id and not is_hidden
        order by created_at desc
        limit 20
      ) rt2
      join profiles pu on pu.id = rt2.user_id
    ), '[]'::jsonb),

    'my_rating', (
      select rating from recipe_ratings
      where recipe_id = r.id and user_id = auth.uid()
    ),
    'is_saved', exists (
      select 1 from saved_recipes
      where recipe_id = r.id and user_id = auth.uid()
    ),
    'has_allergen_conflict', exists (
      select 1 from recipe_ingredients ri3
      join user_allergens ua3 on ua3.ingredient_id = ri3.ingredient_id
      where ri3.recipe_id = r.id and ua3.user_id = auth.uid()
    )
  )
  from recipes r
  left join profiles p on p.id = r.author_id
  where r.slug = p_slug
    and (
      r.author_id = auth.uid()
      or is_moderator()
      or (r.status = 'published' and not r.is_hidden)
    )
  limit 1;
$$;


ALTER FUNCTION "public"."get_recipe_detail"("p_slug" "text") OWNER TO "postgres";

--
-- Name: get_tag_by_slug("text", "public"."tag_type"); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION "public"."get_tag_by_slug"("p_slug" "text", "p_type" "public"."tag_type" DEFAULT NULL::"public"."tag_type") RETURNS TABLE("tag_id" "uuid", "type" "public"."tag_type", "name" "text", "slug" "text", "image_url" "text", "recipe_count" bigint)
    LANGUAGE "sql" STABLE
    AS $$
  select t.id, t.type, t.name, t.slug, t.image_url,
         (
           select count(*) from recipe_tags rt
           join recipes r on r.id = rt.recipe_id
           where rt.tag_id = t.id and r.status = 'published' and not r.is_hidden
         )
  from tags t
  where t.slug = p_slug
    and (p_type is null or t.type = p_type)
  order by t.position asc
  limit 1;
$$;


ALTER FUNCTION "public"."get_tag_by_slug"("p_slug" "text", "p_type" "public"."tag_type") OWNER TO "postgres";

--
-- Name: get_tip_replies("uuid"); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION "public"."get_tip_replies"("p_tip_id" "uuid") RETURNS TABLE("id" "uuid", "body" "text", "created_at" timestamp with time zone, "author_id" "uuid", "author_name" "text", "author_username" "text", "author_avatar" "text")
    LANGUAGE "sql" STABLE
    AS $$
  select tr.id, tr.body, tr.created_at,
         p.id, p.display_name, p.username, p.avatar_url
  from tip_replies tr
  join profiles p on p.id = tr.user_id
  where tr.tip_id = p_tip_id and not tr.is_hidden
  order by tr.created_at asc;
$$;


ALTER FUNCTION "public"."get_tip_replies"("p_tip_id" "uuid") OWNER TO "postgres";

--
-- Name: handle_new_user(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
begin
  -- FIX v3: username trong metadata có thể trùng -> nếu vỡ unique thì
  -- fallback sang 'user_<8 ký tự uuid>' thay vì làm fail toàn bộ signup.
  begin
    insert into profiles (id, username, display_name, avatar_url)
    values (
      new.id,
      coalesce(new.raw_user_meta_data->>'username', 'user_' || substr(new.id::text, 1, 8)),
      new.raw_user_meta_data->>'full_name',
      new.raw_user_meta_data->>'avatar_url'
    );
  exception when unique_violation then
    insert into profiles (id, username, display_name, avatar_url)
    values (
      new.id,
      'user_' || substr(new.id::text, 1, 8),
      new.raw_user_meta_data->>'full_name',
      new.raw_user_meta_data->>'avatar_url'
    );
  end;
  insert into notification_settings (user_id) values (new.id);
  insert into user_preferences     (user_id) values (new.id);
  insert into shopping_lists       (user_id) values (new.id);
  return new;
end $$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";

--
-- Name: is_active(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION "public"."is_active"() RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  select coalesce(
    (select suspended_until is null or suspended_until < now()
     from profiles where id = auth.uid()),
    false);
$$;


ALTER FUNCTION "public"."is_active"() OWNER TO "postgres";

--
-- Name: is_admin(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION "public"."is_admin"() RETURNS boolean
    LANGUAGE "sql" STABLE
    AS $$
  select my_role() = 'admin';
$$;


ALTER FUNCTION "public"."is_admin"() OWNER TO "postgres";

--
-- Name: is_blocked_with("uuid"); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION "public"."is_blocked_with"("other" "uuid") RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  select exists (
    select 1 from blocks
    where (blocker_id = auth.uid() and blocked_id = other)
       or (blocker_id = other and blocked_id = auth.uid())
  );
$$;


ALTER FUNCTION "public"."is_blocked_with"("other" "uuid") OWNER TO "postgres";

--
-- Name: is_moderator(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION "public"."is_moderator"() RETURNS boolean
    LANGUAGE "sql" STABLE
    AS $$
  select my_role() in ('moderator', 'admin');
$$;


ALTER FUNCTION "public"."is_moderator"() OWNER TO "postgres";

--
-- Name: log_action("text", "public"."target_type", "uuid", "text", "jsonb"); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION "public"."log_action"("p_action" "text", "p_target_type" "public"."target_type", "p_target_id" "uuid", "p_reason" "text" DEFAULT NULL::"text", "p_metadata" "jsonb" DEFAULT '{}'::"jsonb") RETURNS "void"
    LANGUAGE "sql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  insert into audit_log (actor_id, actor_role, action, target_type, target_id, reason, metadata)
  values (auth.uid(), my_role(), p_action, p_target_type, p_target_id, p_reason, p_metadata);
$$;


ALTER FUNCTION "public"."log_action"("p_action" "text", "p_target_type" "public"."target_type", "p_target_id" "uuid", "p_reason" "text", "p_metadata" "jsonb") OWNER TO "postgres";

--
-- Name: log_recipe_view("uuid", "text"); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION "public"."log_recipe_view"("p_recipe_id" "uuid", "p_source" "text" DEFAULT 'detail_page'::"text") RETURNS "void"
    LANGUAGE "sql"
    AS $$
  insert into recipe_views (recipe_id, user_id, source)
  values (p_recipe_id, auth.uid(), p_source);
$$;


ALTER FUNCTION "public"."log_recipe_view"("p_recipe_id" "uuid", "p_source" "text") OWNER TO "postgres";

--
-- Name: mark_all_notifications_read(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION "public"."mark_all_notifications_read"() RETURNS "void"
    LANGUAGE "sql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  update notifications set is_read = true
  where user_id = auth.uid() and not is_read;
$$;


ALTER FUNCTION "public"."mark_all_notifications_read"() OWNER TO "postgres";

--
-- Name: mark_notification_read("uuid"); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION "public"."mark_notification_read"("p_id" "uuid") RETURNS "void"
    LANGUAGE "sql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  update notifications set is_read = true
  where id = p_id and user_id = auth.uid();
$$;


ALTER FUNCTION "public"."mark_notification_read"("p_id" "uuid") OWNER TO "postgres";

--
-- Name: mod_approve_recipe("uuid", boolean); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION "public"."mod_approve_recipe"("p_recipe_id" "uuid", "p_trust_author" boolean DEFAULT true) RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare author uuid;
begin
  perform require_moderator();

  update recipes
  set status = 'published', published_at = coalesce(published_at, now()),
      rejection_reason = null
  where id = p_recipe_id and status = 'pending_review'
  returning author_id into author;

  if author is null then raise exception 'Không tìm thấy bài chờ duyệt'; end if;

  if p_trust_author then
    update profiles set is_trusted = true where id = author;
  end if;

  insert into notifications (user_id, actor_id, type, target_type, target_id)
  values (author, auth.uid(), 'recipe_approved', 'recipe', p_recipe_id);

  perform log_action('approve_recipe', 'recipe', p_recipe_id, null,
                            jsonb_build_object('trusted_author', p_trust_author));
end $$;


ALTER FUNCTION "public"."mod_approve_recipe"("p_recipe_id" "uuid", "p_trust_author" boolean) OWNER TO "postgres";

--
-- Name: mod_reject_recipe("uuid", "text"); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION "public"."mod_reject_recipe"("p_recipe_id" "uuid", "p_reason" "text") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare author uuid;
begin
  perform require_moderator();
  if coalesce(trim(p_reason), '') = '' then raise exception 'Phải nêu lý do từ chối'; end if;

  update recipes
  set status = 'rejected', rejection_reason = p_reason
  where id = p_recipe_id and status = 'pending_review'
  returning author_id into author;

  if author is null then raise exception 'Không tìm thấy bài chờ duyệt'; end if;

  insert into notifications (user_id, actor_id, type, target_type, target_id, payload)
  values (author, auth.uid(), 'recipe_rejected', 'recipe', p_recipe_id,
          jsonb_build_object('reason', p_reason));

  perform log_action('reject_recipe', 'recipe', p_recipe_id, p_reason);
end $$;


ALTER FUNCTION "public"."mod_reject_recipe"("p_recipe_id" "uuid", "p_reason" "text") OWNER TO "postgres";

--
-- Name: mod_report_queue("public"."report_state", integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION "public"."mod_report_queue"("p_state" "public"."report_state" DEFAULT 'open'::"public"."report_state", "lim" integer DEFAULT 50) RETURNS TABLE("report_id" "uuid", "target_type" "public"."target_type", "target_id" "uuid", "reason" "public"."report_reason", "detail" "text", "reporter_id" "uuid", "open_count" bigint, "created_at" timestamp with time zone)
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  select r.id, r.target_type, r.target_id, r.reason, r.detail, r.reporter_id,
         count(*) over (partition by r.target_type, r.target_id),
         r.created_at
  from reports r
  where r.state = p_state and is_moderator()
  order by r.created_at
  limit lim;
$$;


ALTER FUNCTION "public"."mod_report_queue"("p_state" "public"."report_state", "lim" integer) OWNER TO "postgres";

--
-- Name: mod_resolve_report("uuid", "public"."report_state", "text"); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION "public"."mod_resolve_report"("p_report_id" "uuid", "p_state" "public"."report_state", "p_resolution" "text" DEFAULT NULL::"text") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare t_type target_type; t_id uuid; open_cnt integer;
begin
  perform require_moderator();
  if p_state not in ('resolved', 'dismissed', 'reviewing') then
    raise exception 'Trạng thái không hợp lệ';
  end if;

  update reports
  set state = p_state, resolver_id = auth.uid(),
      resolution = p_resolution,
      resolved_at = case when p_state in ('resolved','dismissed') then now() end
  where id = p_report_id
  returning target_type, target_id into t_type, t_id;

  if t_id is null then raise exception 'Không tìm thấy báo cáo'; end if;

  -- Cập nhật lại số report đang mở trên đối tượng
  select count(*) into open_cnt from reports
  where target_type = t_type and target_id = t_id and state = 'open';

  if t_type = 'recipe' then
    update recipes set report_count = open_cnt where id = t_id;
  elsif t_type = 'tip' then
    update recipe_tips set report_count = open_cnt where id = t_id;
  elsif t_type = 'reply' then
    update tip_replies set report_count = open_cnt where id = t_id;
  end if;

  perform log_action('resolve_report', t_type, t_id, p_resolution,
                            jsonb_build_object('report_id', p_report_id, 'state', p_state));
end $$;


ALTER FUNCTION "public"."mod_resolve_report"("p_report_id" "uuid", "p_state" "public"."report_state", "p_resolution" "text") OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";

--
-- Name: recipes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS "public"."recipes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "author_id" "uuid",
    "title" "text" NOT NULL,
    "slug" "text" NOT NULL,
    "description" "text",
    "thumbnail_url" "text",
    "video_url" "text",
    "video_duration_s" integer,
    "prep_time_min" integer,
    "cook_time_min" integer,
    "total_time_min" integer GENERATED ALWAYS AS ((COALESCE("prep_time_min", 0) + COALESCE("cook_time_min", 0))) STORED,
    "servings" integer,
    "servings_unit" "text" DEFAULT 'phần'::"text",
    "difficulty" "public"."difficulty_lvl" DEFAULT 'easy'::"public"."difficulty_lvl",
    "status" "public"."recipe_status" DEFAULT 'draft'::"public"."recipe_status" NOT NULL,
    "is_featured" boolean DEFAULT false NOT NULL,
    "is_official" boolean DEFAULT false NOT NULL,
    "is_hidden" boolean DEFAULT false NOT NULL,
    "rejection_reason" "text",
    "avg_rating" numeric(3,2) DEFAULT 0 NOT NULL,
    "rating_count" integer DEFAULT 0 NOT NULL,
    "save_count" integer DEFAULT 0 NOT NULL,
    "tip_count" integer DEFAULT 0 NOT NULL,
    "view_count" bigint DEFAULT 0 NOT NULL,
    "report_count" integer DEFAULT 0 NOT NULL,
    "search_vector" "tsvector" GENERATED ALWAYS AS (("setweight"("to_tsvector"('"simple"'::"regconfig", COALESCE("title", ''::"text")), 'A'::"char") || "setweight"("to_tsvector"('"simple"'::"regconfig", COALESCE("description", ''::"text")), 'B'::"char"))) STORED,
    "published_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "recipes_cook_time_min_check" CHECK (("cook_time_min" >= 0)),
    CONSTRAINT "recipes_prep_time_min_check" CHECK (("prep_time_min" >= 0)),
    CONSTRAINT "recipes_servings_check" CHECK (("servings" > 0))
);


ALTER TABLE "public"."recipes" OWNER TO "postgres";

--
-- Name: mod_review_queue(integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION "public"."mod_review_queue"("lim" integer DEFAULT 50) RETURNS SETOF "public"."recipes"
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  select * from recipes
  where status = 'pending_review' and is_moderator()
  order by created_at
  limit lim;
$$;


ALTER FUNCTION "public"."mod_review_queue"("lim" integer) OWNER TO "postgres";

--
-- Name: mod_search_hidden_recipes("text", integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION "public"."mod_search_hidden_recipes"("q" "text" DEFAULT NULL::"text", "lim" integer DEFAULT 20) RETURNS TABLE("recipe_id" "uuid", "title" "text", "slug" "text", "created_at" timestamp with time zone, "author_id" "uuid", "author_name" "text", "author_username" "text")
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
begin
  perform require_moderator();

  return query
  select r.id, r.title, r.slug, r.created_at,
         p.id, coalesce(p.display_name, p.username), p.username
  from recipes r
  left join profiles p on p.id = r.author_id
  where r.is_hidden
    and (q is null or q = '' or r.title ilike '%' || q || '%')
  order by r.created_at desc
  limit lim;
end $$;


ALTER FUNCTION "public"."mod_search_hidden_recipes"("q" "text", "lim" integer) OWNER TO "postgres";

--
-- Name: mod_set_collection_hidden("uuid", boolean, "text"); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION "public"."mod_set_collection_hidden"("p_collection_id" "uuid", "p_hidden" boolean, "p_reason" "text" DEFAULT NULL::"text") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
begin
  perform require_moderator();
  update collections set is_hidden = p_hidden where id = p_collection_id;
  perform log_action(
    case when p_hidden then 'hide_collection' else 'unhide_collection' end,
    'collection', p_collection_id, p_reason);
end $$;


ALTER FUNCTION "public"."mod_set_collection_hidden"("p_collection_id" "uuid", "p_hidden" boolean, "p_reason" "text") OWNER TO "postgres";

--
-- Name: mod_set_featured("uuid", boolean); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION "public"."mod_set_featured"("p_recipe_id" "uuid", "p_featured" boolean) RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare author uuid;
begin
  perform require_moderator();
  update recipes set is_featured = p_featured
  where id = p_recipe_id and status = 'published'
  returning author_id into author;
  if author is null then raise exception 'Chỉ gắn nổi bật được cho bài đã xuất bản'; end if;

  if p_featured then
    insert into notifications (user_id, actor_id, type, target_type, target_id)
    values (author, auth.uid(), 'recipe_featured', 'recipe', p_recipe_id);
  end if;

  perform log_action(
    case when p_featured then 'feature_recipe' else 'unfeature_recipe' end,
    'recipe', p_recipe_id);
end $$;


ALTER FUNCTION "public"."mod_set_featured"("p_recipe_id" "uuid", "p_featured" boolean) OWNER TO "postgres";

--
-- Name: mod_set_recipe_hidden("uuid", boolean, "text"); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION "public"."mod_set_recipe_hidden"("p_recipe_id" "uuid", "p_hidden" boolean, "p_reason" "text" DEFAULT NULL::"text") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare author uuid;
begin
  perform require_moderator();
  update recipes set is_hidden = p_hidden where id = p_recipe_id
  returning author_id into author;
  if author is null then raise exception 'Không tìm thấy công thức'; end if;

  if p_hidden and author is not null then
    insert into notifications (user_id, actor_id, type, target_type, target_id, payload)
    values (author, auth.uid(), 'content_hidden', 'recipe', p_recipe_id,
            jsonb_build_object('reason', p_reason));
  end if;

  perform log_action(
    case when p_hidden then 'hide_recipe' else 'unhide_recipe' end,
    'recipe', p_recipe_id, p_reason);
end $$;


ALTER FUNCTION "public"."mod_set_recipe_hidden"("p_recipe_id" "uuid", "p_hidden" boolean, "p_reason" "text") OWNER TO "postgres";

--
-- Name: mod_set_reply_hidden("uuid", boolean, "text"); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION "public"."mod_set_reply_hidden"("p_reply_id" "uuid", "p_hidden" boolean, "p_reason" "text" DEFAULT NULL::"text") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
begin
  perform require_moderator();
  update tip_replies set is_hidden = p_hidden where id = p_reply_id;
  perform log_action(
    case when p_hidden then 'hide_reply' else 'unhide_reply' end, 'reply', p_reply_id, p_reason);
end $$;


ALTER FUNCTION "public"."mod_set_reply_hidden"("p_reply_id" "uuid", "p_hidden" boolean, "p_reason" "text") OWNER TO "postgres";

--
-- Name: mod_set_tip_hidden("uuid", boolean, "text"); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION "public"."mod_set_tip_hidden"("p_tip_id" "uuid", "p_hidden" boolean, "p_reason" "text" DEFAULT NULL::"text") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
begin
  perform require_moderator();
  update recipe_tips set is_hidden = p_hidden where id = p_tip_id;
  perform log_action(
    case when p_hidden then 'hide_tip' else 'unhide_tip' end, 'tip', p_tip_id, p_reason);
end $$;


ALTER FUNCTION "public"."mod_set_tip_hidden"("p_tip_id" "uuid", "p_hidden" boolean, "p_reason" "text") OWNER TO "postgres";

--
-- Name: mod_set_trusted("uuid", boolean, "text"); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION "public"."mod_set_trusted"("p_user_id" "uuid", "p_trusted" boolean, "p_reason" "text" DEFAULT NULL::"text") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
begin
  perform require_moderator();
  update profiles set is_trusted = p_trusted where id = p_user_id;
  perform log_action(
    case when p_trusted then 'grant_trusted' else 'revoke_trusted' end,
    'profile', p_user_id, p_reason);
end $$;


ALTER FUNCTION "public"."mod_set_trusted"("p_user_id" "uuid", "p_trusted" boolean, "p_reason" "text") OWNER TO "postgres";

--
-- Name: mod_suspend_user("uuid", integer, "text"); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION "public"."mod_suspend_user"("p_user_id" "uuid", "p_days" integer, "p_reason" "text") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare until timestamptz;
begin
  perform require_moderator();
  if coalesce(trim(p_reason), '') = '' then raise exception 'Phải nêu lý do'; end if;
  if p_user_id = auth.uid() then raise exception 'Không thể tự khoá tài khoản của mình'; end if;

  -- Moderator không được khoá moderator/admin khác
  if exists (select 1 from user_roles where user_id = p_user_id)
     and not is_admin() then
    raise exception 'Chỉ admin mới xử lý được tài khoản có quyền';
  end if;

  until := case when p_days is null then 'infinity'::timestamptz
                else now() + make_interval(days => p_days) end;

  update profiles set suspended_until = until where id = p_user_id;

  insert into suspensions (user_id, moderator_id, reason, expires_at)
  values (p_user_id, auth.uid(), p_reason,
          case when p_days is null then null else until end);

  insert into notifications (user_id, actor_id, type, target_type, target_id, payload)
  values (p_user_id, auth.uid(), 'account_suspended', 'profile', p_user_id,
          jsonb_build_object('reason', p_reason, 'until', until));

  perform log_action('suspend_user', 'profile', p_user_id, p_reason,
                            jsonb_build_object('days', p_days, 'until', until));
end $$;


ALTER FUNCTION "public"."mod_suspend_user"("p_user_id" "uuid", "p_days" integer, "p_reason" "text") OWNER TO "postgres";

--
-- Name: mod_unsuspend_user("uuid", "text"); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION "public"."mod_unsuspend_user"("p_user_id" "uuid", "p_reason" "text" DEFAULT NULL::"text") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
begin
  perform require_moderator();
  update profiles set suspended_until = null where id = p_user_id;
  update suspensions set lifted_at = now(), lifted_by = auth.uid()
  where user_id = p_user_id and lifted_at is null;
  perform log_action('unsuspend_user', 'profile', p_user_id, p_reason);
end $$;


ALTER FUNCTION "public"."mod_unsuspend_user"("p_user_id" "uuid", "p_reason" "text") OWNER TO "postgres";

--
-- Name: mod_upsert_ingredient("text", "text", "text", boolean, "text"); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION "public"."mod_upsert_ingredient"("p_name" "text", "p_slug" "text", "p_aisle" "text" DEFAULT NULL::"text", "p_is_allergen" boolean DEFAULT false, "p_image_url" "text" DEFAULT NULL::"text") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare iid uuid;
begin
  perform require_moderator();
  insert into ingredients (name, slug, aisle, is_allergen, image_url, created_by)
  values (p_name, p_slug, p_aisle, p_is_allergen, p_image_url, auth.uid())
  on conflict (slug) do update
    set name = excluded.name, aisle = excluded.aisle,
        is_allergen = excluded.is_allergen, image_url = excluded.image_url
  returning id into iid;

  perform log_action('upsert_ingredient', null, iid, null,
                            jsonb_build_object('slug', p_slug, 'name', p_name));
  return iid;
end $$;


ALTER FUNCTION "public"."mod_upsert_ingredient"("p_name" "text", "p_slug" "text", "p_aisle" "text", "p_is_allergen" boolean, "p_image_url" "text") OWNER TO "postgres";

--
-- Name: mod_upsert_tag("public"."tag_type", "text", "text", "text", integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION "public"."mod_upsert_tag"("p_type" "public"."tag_type", "p_name" "text", "p_slug" "text", "p_image_url" "text" DEFAULT NULL::"text", "p_position" integer DEFAULT 0) RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare tid uuid;
begin
  perform require_moderator();
  insert into tags (type, name, slug, image_url, position)
  values (p_type, p_name, p_slug, p_image_url, p_position)
  on conflict (type, slug) do update
    set name = excluded.name, image_url = excluded.image_url, position = excluded.position
  returning id into tid;

  perform log_action('upsert_tag', null, tid, null,
                            jsonb_build_object('type', p_type, 'slug', p_slug));
  return tid;
end $$;


ALTER FUNCTION "public"."mod_upsert_tag"("p_type" "public"."tag_type", "p_name" "text", "p_slug" "text", "p_image_url" "text", "p_position" integer) OWNER TO "postgres";

--
-- Name: my_account_status(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION "public"."my_account_status"() RETURNS TABLE("role" "public"."app_role", "is_trusted" boolean, "suspended_until" timestamp with time zone, "reason" "text")
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  select my_role(), p.is_trusted, p.suspended_until,
         (select s.reason from suspensions s
          where s.user_id = p.id and s.lifted_at is null
          order by s.created_at desc limit 1)
  from profiles p where p.id = auth.uid();
$$;


ALTER FUNCTION "public"."my_account_status"() OWNER TO "postgres";

--
-- Name: my_collections_for_recipe("uuid"); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION "public"."my_collections_for_recipe"("p_recipe_id" "uuid") RETURNS TABLE("id" "uuid", "name" "text", "cover_url" "text", "recipe_count" integer, "is_public" boolean, "contains" boolean)
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  select c.id, c.name, c.cover_url, c.recipe_count, c.is_public,
         exists (select 1 from collection_recipes cr
                 where cr.collection_id = c.id and cr.recipe_id = p_recipe_id)
  from collections c
  where c.user_id = auth.uid()
  order by c.updated_at desc;
$$;


ALTER FUNCTION "public"."my_collections_for_recipe"("p_recipe_id" "uuid") OWNER TO "postgres";

--
-- Name: my_role(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION "public"."my_role"() RETURNS "public"."app_role"
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  cached   text := current_setting('app.my_role_cache', true);
  computed app_role;
begin
  if cached is not null and cached <> '' then
    return cached::app_role;
  end if;

  select coalesce(
    (select role from user_roles
     where user_id = auth.uid()
     order by case role
       when 'admin'     then 2
       when 'moderator' then 1
       else 0
     end desc
     limit 1),
    'user'
  ) into computed;

  perform set_config('app.my_role_cache', computed::text, true);
  return computed;
end;
$$;


ALTER FUNCTION "public"."my_role"() OWNER TO "postgres";

--
-- Name: new_from_following_recipes(integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION "public"."new_from_following_recipes"("lim" integer DEFAULT 20) RETURNS TABLE("recipe_id" "uuid", "title" "text", "slug" "text", "thumbnail_url" "text", "author_id" "uuid", "author_name" "text", "author_avatar" "text", "published_at" timestamp with time zone)
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  select r.id, r.title, r.slug, r.thumbnail_url,
         p.id, p.display_name, p.avatar_url, r.published_at
  from activity_events e
  join follows f on f.followee_id = e.actor_id
  join recipes r on r.id = e.target_id and e.target_type = 'recipe'
  join profiles p on p.id = e.actor_id
  where f.follower_id = auth.uid() and f.state = 'accepted'
    and e.type = 'published_recipe'
    and r.status = 'published' and not r.is_hidden
    and (p.suspended_until is null or p.suspended_until < now())
    and not is_blocked_with(e.actor_id)
  order by e.created_at desc
  limit lim;
$$;


ALTER FUNCTION "public"."new_from_following_recipes"("lim" integer) OWNER TO "postgres";

--
-- Name: owns_recipe("uuid"); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION "public"."owns_recipe"("rid" "uuid") RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  select exists (select 1 from recipes where id = rid and author_id = auth.uid());
$$;


ALTER FUNCTION "public"."owns_recipe"("rid" "uuid") OWNER TO "postgres";

--
-- Name: popular_tags("public"."tag_type", integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION "public"."popular_tags"("p_type" "public"."tag_type" DEFAULT NULL::"public"."tag_type", "lim" integer DEFAULT 8) RETURNS TABLE("tag_id" "uuid", "type" "public"."tag_type", "name" "text", "slug" "text", "image_url" "text", "recipe_count" bigint)
    LANGUAGE "sql" STABLE
    AS $$
  select t.id, t.type, t.name, t.slug, t.image_url, count(rt.recipe_id)
  from tags t
  join recipe_tags rt on rt.tag_id = t.id
  join recipes r on r.id = rt.recipe_id
  where (p_type is null or t.type = p_type)
    and r.status = 'published' and not r.is_hidden
  group by t.id
  having count(rt.recipe_id) > 0
  order by count(rt.recipe_id) desc, t.position asc
  limit lim;
$$;


ALTER FUNCTION "public"."popular_tags"("p_type" "public"."tag_type", "lim" integer) OWNER TO "postgres";

--
-- Name: protect_collection_columns(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION "public"."protect_collection_columns"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
begin
  if pg_trigger_depth() = 1 and not is_moderator() then
    if tg_op = 'INSERT' then
      new.is_hidden := false; new.recipe_count := 0; new.follower_count := 0;
    else
      new.is_hidden := old.is_hidden;
      new.recipe_count := old.recipe_count;
      new.follower_count := old.follower_count;
    end if;
  end if;
  return new;
end $$;


ALTER FUNCTION "public"."protect_collection_columns"() OWNER TO "postgres";

--
-- Name: protect_profile_columns(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION "public"."protect_profile_columns"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
begin
  if pg_trigger_depth() = 1 and not is_moderator() then
    new.is_verified     := old.is_verified;
    new.is_trusted      := old.is_trusted;
    new.suspended_until := old.suspended_until;
    new.recipe_count    := old.recipe_count;
    new.follower_count  := old.follower_count;
    new.following_count := old.following_count;
    new.tip_count       := old.tip_count;
  end if;
  return new;
end $$;


ALTER FUNCTION "public"."protect_profile_columns"() OWNER TO "postgres";

--
-- Name: protect_recipe_columns(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION "public"."protect_recipe_columns"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
begin
  if pg_trigger_depth() = 1 and not is_moderator() then
    if tg_op = 'INSERT' then
      new.is_featured  := false;  new.is_official := false;
      new.is_hidden    := false;  new.avg_rating  := 0;
      new.rating_count := 0;      new.save_count  := 0;
      new.tip_count    := 0;      new.view_count  := 0;
      new.report_count := 0;
    else
      new.is_featured  := old.is_featured;  new.is_official := old.is_official;
      new.is_hidden    := old.is_hidden;    new.avg_rating  := old.avg_rating;
      new.rating_count := old.rating_count; new.save_count  := old.save_count;
      new.tip_count    := old.tip_count;    new.view_count  := old.view_count;
      new.report_count := old.report_count;
    end if;
  end if;
  return new;
end $$;


ALTER FUNCTION "public"."protect_recipe_columns"() OWNER TO "postgres";

--
-- Name: protect_reply_columns(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION "public"."protect_reply_columns"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
begin
  if pg_trigger_depth() = 1 and not is_moderator() then
    if tg_op = 'INSERT' then
      new.report_count := 0; new.is_hidden := false;
    else
      new.report_count := old.report_count; new.is_hidden := old.is_hidden;
    end if;
  end if;
  return new;
end $$;


ALTER FUNCTION "public"."protect_reply_columns"() OWNER TO "postgres";

--
-- Name: protect_tip_columns(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION "public"."protect_tip_columns"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
begin
  if pg_trigger_depth() = 1 and not is_moderator() then
    if tg_op = 'INSERT' then
      new.like_count := 0; new.reply_count := 0;
      new.report_count := 0; new.is_hidden := false;
    else
      new.like_count := old.like_count; new.reply_count := old.reply_count;
      new.report_count := old.report_count; new.is_hidden := old.is_hidden;
    end if;
  end if;
  return new;
end $$;


ALTER FUNCTION "public"."protect_tip_columns"() OWNER TO "postgres";

--
-- Name: quick_recipes(integer, integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION "public"."quick_recipes"("max_minutes" integer DEFAULT 30, "lim" integer DEFAULT 20) RETURNS TABLE("recipe_id" "uuid", "title" "text", "slug" "text", "thumbnail_url" "text", "avg_rating" numeric, "total_time_min" integer, "difficulty" "public"."difficulty_lvl", "author_id" "uuid", "author_name" "text", "author_avatar" "text")
    LANGUAGE "sql" STABLE
    AS $$
  select r.id, r.title, r.slug, r.thumbnail_url, r.avg_rating,
         r.total_time_min, r.difficulty, p.id, p.display_name, p.avatar_url
  from recipes r
  left join profiles p on p.id = r.author_id
  where r.status = 'published' and not r.is_hidden
    and r.total_time_min is not null
    and r.total_time_min <= max_minutes
  order by r.avg_rating desc, r.save_count desc
  limit lim;
$$;


ALTER FUNCTION "public"."quick_recipes"("max_minutes" integer, "lim" integer) OWNER TO "postgres";

--
-- Name: random_recipes(integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION "public"."random_recipes"("lim" integer DEFAULT 8) RETURNS TABLE("recipe_id" "uuid", "title" "text", "slug" "text", "thumbnail_url" "text", "avg_rating" numeric, "total_time_min" integer, "difficulty" "public"."difficulty_lvl", "author_id" "uuid", "author_name" "text", "author_avatar" "text")
    LANGUAGE "sql" STABLE
    AS $$
  select r.id, r.title, r.slug, r.thumbnail_url, r.avg_rating,
         r.total_time_min, r.difficulty, p.id, p.display_name, p.avatar_url
  from recipes r
  left join profiles p on p.id = r.author_id
  where r.status = 'published' and not r.is_hidden
  order by random()
  limit lim;
$$;


ALTER FUNCTION "public"."random_recipes"("lim" integer) OWNER TO "postgres";

--
-- Name: rate_recipe("uuid", smallint); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION "public"."rate_recipe"("p_recipe_id" "uuid", "p_rating" smallint) RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
begin
  if not is_active() then raise exception 'Tài khoản đang bị khoá'; end if;
  if p_rating < 1 or p_rating > 5 then raise exception 'Điểm đánh giá phải từ 1-5'; end if;
  if not can_view_recipe(p_recipe_id) then raise exception 'Không tìm thấy công thức'; end if;

  insert into recipe_ratings (recipe_id, user_id, rating)
  values (p_recipe_id, auth.uid(), p_rating)
  on conflict (recipe_id, user_id)
  do update set rating = excluded.rating, updated_at = now();
end $$;


ALTER FUNCTION "public"."rate_recipe"("p_recipe_id" "uuid", "p_rating" smallint) OWNER TO "postgres";

--
-- Name: recipes_by_tag("text", "public"."tag_type", integer, integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION "public"."recipes_by_tag"("p_slug" "text", "p_type" "public"."tag_type" DEFAULT NULL::"public"."tag_type", "lim" integer DEFAULT 24, "off" integer DEFAULT 0) RETURNS TABLE("recipe_id" "uuid", "title" "text", "slug" "text", "thumbnail_url" "text", "avg_rating" numeric, "total_time_min" integer, "difficulty" "public"."difficulty_lvl", "author_id" "uuid", "author_name" "text", "author_avatar" "text")
    LANGUAGE "sql" STABLE
    AS $$
  select r.id, r.title, r.slug, r.thumbnail_url, r.avg_rating,
         r.total_time_min, r.difficulty, p.id, p.display_name, p.avatar_url
  from recipe_tags rt
  join tags t on t.id = rt.tag_id
  join recipes r on r.id = rt.recipe_id
  left join profiles p on p.id = r.author_id
  where t.slug = p_slug
    and (p_type is null or t.type = p_type)
    and r.status = 'published' and not r.is_hidden
  order by r.published_at desc nulls last, r.created_at desc
  limit lim offset off;
$$;


ALTER FUNCTION "public"."recipes_by_tag"("p_slug" "text", "p_type" "public"."tag_type", "lim" integer, "off" integer) OWNER TO "postgres";

--
-- Name: recipes_from_pantry(numeric, integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION "public"."recipes_from_pantry"("min_match_pct" numeric DEFAULT 0.7, "lim" integer DEFAULT 20) RETURNS TABLE("recipe_id" "uuid", "title" "text", "thumbnail_url" "text", "match_pct" numeric, "missing_count" bigint)
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  with checked as (
    select
      r.id as recipe_id, r.title, r.thumbnail_url, r.save_count,
      case
        when up.ingredient_id is null then false
        when up.expires_on is not null and up.expires_on < current_date then false
        when ri.quantity is null then true
        when up.quantity is null then true
        when up.unit is not distinct from ri.unit then up.quantity >= ri.quantity
        when uc.factor is not null then up.quantity * uc.factor >= ri.quantity
        else false
      end as satisfied
    from recipes r
    join recipe_ingredients ri on ri.recipe_id = r.id and ri.is_optional = false
    left join user_pantry up
           on up.ingredient_id = ri.ingredient_id and up.user_id = auth.uid()
    left join unit_conversions uc
           on uc.from_unit = up.unit and uc.to_unit = ri.unit
    where r.status = 'published' and not r.is_hidden
      and not exists (
        select 1 from recipe_ingredients ri2
        join user_allergens ua
          on ua.ingredient_id = ri2.ingredient_id and ua.user_id = auth.uid()
        where ri2.recipe_id = r.id
      )
  )
  select recipe_id, title, thumbnail_url,
         round(count(*) filter (where satisfied)::numeric / nullif(count(*), 0), 2),
         count(*) filter (where not satisfied)
  from checked
  group by recipe_id, title, thumbnail_url, save_count
  having count(*) filter (where satisfied)::numeric / nullif(count(*), 0) >= min_match_pct
  order by 4 desc, save_count desc
  limit lim;
$$;


ALTER FUNCTION "public"."recipes_from_pantry"("min_match_pct" numeric, "lim" integer) OWNER TO "postgres";

--
-- Name: recipes_from_pantry_for_home(numeric, integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION "public"."recipes_from_pantry_for_home"("min_match_pct" numeric DEFAULT 0.5, "lim" integer DEFAULT 8) RETURNS TABLE("recipe_id" "uuid", "title" "text", "slug" "text", "thumbnail_url" "text", "total_time_min" integer, "difficulty" "public"."difficulty_lvl", "match_pct" numeric, "missing_count" bigint)
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  with checked as (
    select
      r.id as recipe_id, r.title, r.slug, r.thumbnail_url,
      r.total_time_min, r.difficulty, r.save_count,
      case
        when up.ingredient_id is null then false
        when up.expires_on is not null and up.expires_on < current_date then false
        when ri.quantity is null then true
        when up.quantity is null then true
        when up.unit is not distinct from ri.unit then up.quantity >= ri.quantity
        when uc.factor is not null then up.quantity * uc.factor >= ri.quantity
        else false
      end as satisfied
    from recipes r
    join recipe_ingredients ri on ri.recipe_id = r.id and ri.is_optional = false
    left join user_pantry up
           on up.ingredient_id = ri.ingredient_id and up.user_id = auth.uid()
    left join unit_conversions uc
           on uc.from_unit = up.unit and uc.to_unit = ri.unit
    where r.status = 'published' and not r.is_hidden
      and not exists (
        select 1 from recipe_ingredients ri2
        join user_allergens ua
          on ua.ingredient_id = ri2.ingredient_id and ua.user_id = auth.uid()
        where ri2.recipe_id = r.id
      )
  )
  select recipe_id, title, slug, thumbnail_url, total_time_min, difficulty,
         round(count(*) filter (where satisfied)::numeric / nullif(count(*), 0), 2),
         count(*) filter (where not satisfied)
  from checked
  group by recipe_id, title, slug, thumbnail_url, total_time_min, difficulty, save_count
  having count(*) filter (where satisfied)::numeric / nullif(count(*), 0) >= min_match_pct
  order by 7 desc, save_count desc
  limit lim;
$$;


ALTER FUNCTION "public"."recipes_from_pantry_for_home"("min_match_pct" numeric, "lim" integer) OWNER TO "postgres";

--
-- Name: recommended_for_you(integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION "public"."recommended_for_you"("lim" integer DEFAULT 20) RETURNS TABLE("recipe_id" "uuid", "title" "text", "slug" "text", "thumbnail_url" "text", "avg_rating" numeric, "save_count" integer, "author_id" "uuid", "author_name" "text", "author_avatar" "text", "match_score" numeric)
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  v_user uuid := auth.uid();
begin
  if v_user is null then
    -- Chưa đăng nhập: không có gì để cá nhân hoá, trả rỗng để phía
    -- client tự fallback sang trending_recipes().
    return;
  end if;

  return query
  with my_tag_weights as (
    -- Tag từ công thức đã lưu (trọng số 1) + đánh giá >=4 sao (trọng số 2)
    select rt.tag_id, sum(w) as weight
    from (
      select sr.recipe_id, 1 as w from saved_recipes sr where sr.user_id = v_user
      union all
      select rr.recipe_id, 2 as w from recipe_ratings rr
      where rr.user_id = v_user and rr.rating >= 4
    ) activity
    join recipe_tags rt on rt.recipe_id = activity.recipe_id
    group by rt.tag_id
  ),
  prefs as (
    select diet_tag_ids, excluded_tag_ids, max_cook_time_min
    from user_preferences where user_id = v_user
  )
  select
    r.id, r.title, r.slug, r.thumbnail_url, r.avg_rating, r.save_count,
    p.id, p.display_name, p.avatar_url,
    coalesce(sum(mtw.weight), 0)
      + case when rt_diet.tag_id is not null then 3 else 0 end as match_score
  from recipes r
  left join profiles p on p.id = r.author_id
  join recipe_tags rt on rt.recipe_id = r.id
  left join my_tag_weights mtw on mtw.tag_id = rt.tag_id
  left join recipe_tags rt_diet
         on rt_diet.recipe_id = r.id
        and rt_diet.tag_id = any (
              coalesce((select diet_tag_ids from prefs), '{}')
            )
  where r.status = 'published' and not r.is_hidden
    and not exists (select 1 from saved_recipes sr2
                    where sr2.user_id = v_user and sr2.recipe_id = r.id)
    and not exists (
      select 1 from recipe_tags rt_ex
      where rt_ex.recipe_id = r.id
        and rt_ex.tag_id = any (coalesce((select excluded_tag_ids from prefs), '{}'))
    )
    and not exists (
      select 1 from recipe_ingredients ri
      join user_allergens ua on ua.ingredient_id = ri.ingredient_id
      where ri.recipe_id = r.id and ua.user_id = v_user
    )
    and (
      (select max_cook_time_min from prefs) is null
      or r.total_time_min <= (select max_cook_time_min from prefs)
    )
  group by r.id, p.id, rt_diet.tag_id
  order by match_score desc, r.avg_rating desc, r.save_count desc
  limit lim;
end $$;


ALTER FUNCTION "public"."recommended_for_you"("lim" integer) OWNER TO "postgres";

--
-- Name: remove_from_collection("uuid", "uuid"); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION "public"."remove_from_collection"("p_collection_id" "uuid", "p_recipe_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
begin
  if not can_edit_collection(p_collection_id) then
    raise exception 'Không có quyền với bộ sưu tập này';
  end if;
  delete from collection_recipes
  where collection_id = p_collection_id and recipe_id = p_recipe_id;
end $$;


ALTER FUNCTION "public"."remove_from_collection"("p_collection_id" "uuid", "p_recipe_id" "uuid") OWNER TO "postgres";

--
-- Name: reorder_collection("uuid", "uuid"[]); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION "public"."reorder_collection"("p_collection_id" "uuid", "p_recipe_ids" "uuid"[]) RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
begin
  if not can_edit_collection(p_collection_id) then
    raise exception 'Không có quyền với bộ sưu tập này';
  end if;
  update collection_recipes cr
  set position = t.ord - 1
  from unnest(p_recipe_ids) with ordinality as t(rid, ord)
  where cr.collection_id = p_collection_id and cr.recipe_id = t.rid;
end $$;


ALTER FUNCTION "public"."reorder_collection"("p_collection_id" "uuid", "p_recipe_ids" "uuid"[]) OWNER TO "postgres";

--
-- Name: report_content("public"."target_type", "uuid", "public"."report_reason", "text"); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION "public"."report_content"("p_target_type" "public"."target_type", "p_target_id" "uuid", "p_reason" "public"."report_reason", "p_detail" "text" DEFAULT NULL::"text") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
begin
  if not is_active() then raise exception 'Tài khoản đang bị khoá'; end if;

  insert into reports (reporter_id, target_type, target_id, reason, detail)
  values (auth.uid(), p_target_type, p_target_id, p_reason, p_detail)
  on conflict (reporter_id, target_type, target_id) do nothing;
end $$;


ALTER FUNCTION "public"."report_content"("p_target_type" "public"."target_type", "p_target_id" "uuid", "p_reason" "public"."report_reason", "p_detail" "text") OWNER TO "postgres";

--
-- Name: require_admin(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION "public"."require_admin"() RETURNS "void"
    LANGUAGE "plpgsql" STABLE
    AS $$
begin
  if not is_admin() then
    raise exception 'Yêu cầu quyền quản trị' using errcode = '42501';
  end if;
end $$;


ALTER FUNCTION "public"."require_admin"() OWNER TO "postgres";

--
-- Name: require_moderator(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION "public"."require_moderator"() RETURNS "void"
    LANGUAGE "plpgsql" STABLE
    AS $$
begin
  if not is_moderator() then
    raise exception 'Yêu cầu quyền kiểm duyệt viên' using errcode = '42501';
  end if;
end $$;


ALTER FUNCTION "public"."require_moderator"() OWNER TO "postgres";

--
-- Name: search_all("text", integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION "public"."search_all"("q" "text", "lim" integer DEFAULT 8) RETURNS "jsonb"
    LANGUAGE "sql" STABLE
    AS $$
  with text_matches as (
    select
      r.id, r.title, r.slug, r.thumbnail_url, r.avg_rating,
      r.total_time_min, r.difficulty,
      null::text as matched_ingredient,
      ts_rank(r.search_vector, plainto_tsquery('simple', q)) + similarity(r.title, q) as rank
    from recipes r
    where r.status = 'published' and not r.is_hidden
      and (r.search_vector @@ plainto_tsquery('simple', q) or r.title % q)
  ),
  ingredient_matches as (
    select distinct on (r.id)
      r.id, r.title, r.slug, r.thumbnail_url, r.avg_rating,
      r.total_time_min, r.difficulty,
      i.name as matched_ingredient,
      0.5::real as rank
    from recipes r
    join recipe_ingredients ri on ri.recipe_id = r.id
    join ingredients i on i.id = ri.ingredient_id
    where r.status = 'published' and not r.is_hidden
      and i.name ilike '%' || q || '%'
      and r.id not in (select id from text_matches)
    order by r.id, r.save_count desc
  ),
  combined_recipes as (
    select * from text_matches
    union all
    select * from ingredient_matches
  )
  select jsonb_build_object(
    'recipes', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', c.id, 'title', c.title, 'slug', c.slug, 'thumbnail_url', c.thumbnail_url,
        'avg_rating', c.avg_rating, 'total_time_min', c.total_time_min,
        'difficulty', c.difficulty, 'matched_ingredient', c.matched_ingredient
      ))
      from (
        select * from combined_recipes order by rank desc limit lim
      ) c
    ), '[]'::jsonb),

    'authors', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', p.id, 'username', p.username, 'display_name', p.display_name,
        'recipe_count', p.recipe_count
      ))
      from (
        select *
        from profiles
        where username ilike '%' || q || '%'
           or display_name ilike '%' || q || '%'
        order by
          greatest(similarity(username, q), similarity(coalesce(display_name, ''), q)) desc,
          recipe_count desc
        limit lim
      ) p
    ), '[]'::jsonb),

    'collections', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', c.id, 'name', c.name, 'cover_url', c.cover_url, 'recipe_count', c.recipe_count
      ))
      from (
        select * from collections
        where is_public and not is_hidden and name ilike '%' || q || '%'
        order by follower_count desc
        limit lim
      ) c
    ), '[]'::jsonb),

    'tags', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', t.id, 'type', t.type, 'name', t.name, 'slug', t.slug
      ))
      from (
        select distinct t.id, t.type, t.name, t.slug
        from tags t
        join recipe_tags rt on rt.tag_id = t.id
        join recipes r on r.id = rt.recipe_id
        where t.name ilike '%' || q || '%'
          and r.status = 'published' and not r.is_hidden
        limit lim
      ) t
    ), '[]'::jsonb)
  );
$$;


ALTER FUNCTION "public"."search_all"("q" "text", "lim" integer) OWNER TO "postgres";

--
-- Name: search_public_collections("text", integer, integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION "public"."search_public_collections"("q" "text" DEFAULT NULL::"text", "lim" integer DEFAULT 24, "off" integer DEFAULT 0) RETURNS TABLE("collection_id" "uuid", "name" "text", "description" "text", "cover_url" "text", "recipe_count" integer, "follower_count" integer, "owner_id" "uuid", "owner_name" "text", "owner_username" "text", "total_count" bigint)
    LANGUAGE "sql" STABLE
    AS $$
  select c.id, c.name, c.description, c.cover_url, c.recipe_count,
         c.follower_count, p.id, p.display_name, p.username,
         count(*) over ()
  from collections c
  join profiles p on p.id = c.user_id
  where c.is_public and not c.is_hidden
    and (q is null or q = '' or c.name ilike '%' || q || '%')
  order by c.follower_count desc, c.recipe_count desc
  limit lim offset off;
$$;


ALTER FUNCTION "public"."search_public_collections"("q" "text", "lim" integer, "off" integer) OWNER TO "postgres";

--
-- Name: search_recipes("text", integer, integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION "public"."search_recipes"("q" "text", "lim" integer DEFAULT 20, "off" integer DEFAULT 0) RETURNS SETOF "public"."recipes"
    LANGUAGE "sql" STABLE
    AS $$
  select *
  from recipes
  where status = 'published' and not is_hidden
    and (search_vector @@ plainto_tsquery('simple', q) or title % q)
  order by ts_rank(search_vector, plainto_tsquery('simple', q)) desc,
           similarity(title, q) desc, save_count desc
  limit lim offset off;
$$;


ALTER FUNCTION "public"."search_recipes"("q" "text", "lim" integer, "off" integer) OWNER TO "postgres";

--
-- Name: suggested_users(integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION "public"."suggested_users"("lim" integer DEFAULT 10) RETURNS TABLE("user_id" "uuid", "username" "text", "display_name" "text", "avatar_url" "text", "mutual_count" bigint)
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  select p.id, p.username, p.display_name, p.avatar_url, count(*) as mutual_count
  from follows f1
  join follows f2 on f2.follower_id = f1.followee_id
  join profiles p on p.id = f2.followee_id
  where f1.follower_id = auth.uid()
    and f1.state = 'accepted' and f2.state = 'accepted'
    and p.id <> auth.uid()
    and (p.suspended_until is null or p.suspended_until < now())
    and not exists (select 1 from follows f3
                    where f3.follower_id = auth.uid() and f3.followee_id = p.id)
    and not is_blocked_with(p.id)
  group by p.id
  order by mutual_count desc, p.follower_count desc
  limit lim;
$$;


ALTER FUNCTION "public"."suggested_users"("lim" integer) OWNER TO "postgres";

--
-- Name: toggle_follow("uuid"); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION "public"."toggle_follow"("p_user_id" "uuid") RETURNS "text"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare v_state follow_state;
begin
  if not is_active() then raise exception 'Tài khoản đang bị khoá'; end if;
  if p_user_id = auth.uid() then raise exception 'Không thể tự theo dõi chính mình'; end if;

  if exists (select 1 from follows where follower_id = auth.uid() and followee_id = p_user_id) then
    delete from follows where follower_id = auth.uid() and followee_id = p_user_id;
    return null;
  else
    insert into follows (follower_id, followee_id) values (auth.uid(), p_user_id)
    returning state into v_state;
    return v_state::text;
  end if;
end $$;


ALTER FUNCTION "public"."toggle_follow"("p_user_id" "uuid") OWNER TO "postgres";

--
-- Name: toggle_save_recipe("uuid"); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION "public"."toggle_save_recipe"("p_recipe_id" "uuid") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
begin
  if not is_active() then raise exception 'Tài khoản đang bị khoá'; end if;

  if exists (select 1 from saved_recipes
             where user_id = auth.uid() and recipe_id = p_recipe_id) then
    delete from saved_recipes where user_id = auth.uid() and recipe_id = p_recipe_id;
    return false;
  else
    if not can_view_recipe(p_recipe_id) then
      raise exception 'Không tìm thấy công thức';
    end if;
    insert into saved_recipes (user_id, recipe_id) values (auth.uid(), p_recipe_id);
    return true;
  end if;
end $$;


ALTER FUNCTION "public"."toggle_save_recipe"("p_recipe_id" "uuid") OWNER TO "postgres";

--
-- Name: toggle_tip_like("uuid"); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION "public"."toggle_tip_like"("p_tip_id" "uuid") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
begin
  if not is_active() then raise exception 'Tài khoản đang bị khoá'; end if;

  if exists (select 1 from tip_likes where tip_id = p_tip_id and user_id = auth.uid()) then
    delete from tip_likes where tip_id = p_tip_id and user_id = auth.uid();
    return false;
  else
    insert into tip_likes (tip_id, user_id) values (p_tip_id, auth.uid());
    return true;
  end if;
end $$;


ALTER FUNCTION "public"."toggle_tip_like"("p_tip_id" "uuid") OWNER TO "postgres";

--
-- Name: touch_updated_at(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION "public"."touch_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin new.updated_at = now(); return new; end $$;


ALTER FUNCTION "public"."touch_updated_at"() OWNER TO "postgres";

--
-- Name: trending_recipes(integer, integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION "public"."trending_recipes"("lim" integer DEFAULT 20, "days" integer DEFAULT 7) RETURNS TABLE("recipe_id" "uuid", "title" "text", "slug" "text", "thumbnail_url" "text", "avg_rating" numeric, "rating_count" integer, "save_count" integer, "total_time_min" integer, "difficulty" "public"."difficulty_lvl", "author_id" "uuid", "author_name" "text", "author_avatar" "text", "recent_score" numeric)
    LANGUAGE "sql" STABLE
    AS $$
  select
    r.id, r.title, r.slug, r.thumbnail_url,
    r.avg_rating, r.rating_count, r.save_count, r.total_time_min, r.difficulty,
    p.id, p.display_name, p.avatar_url,
    -- điểm gần đây: view*1 + save*4 + rating*6, cùng khung thời gian
    coalesce(v.recent_views, 0) * 1
      + coalesce(s.recent_saves, 0) * 4
      + coalesce(rt.recent_ratings, 0) * 6 as recent_score
  from recipes r
  left join profiles p on p.id = r.author_id
  left join (
    select recipe_id, count(*) as recent_views
    from recipe_views
    where viewed_at > now() - (days || ' days')::interval
    group by recipe_id
  ) v on v.recipe_id = r.id
  left join (
    select recipe_id, count(*) as recent_saves
    from saved_recipes
    where created_at > now() - (days || ' days')::interval
    group by recipe_id
  ) s on s.recipe_id = r.id
  left join (
    select recipe_id, count(*) as recent_ratings
    from recipe_ratings
    where created_at > now() - (days || ' days')::interval
    group by recipe_id
  ) rt on rt.recipe_id = r.id
  where r.status = 'published' and not r.is_hidden
  order by recent_score desc, r.avg_rating desc, r.save_count desc
  limit lim;
$$;


ALTER FUNCTION "public"."trending_recipes"("lim" integer, "days" integer) OWNER TO "postgres";

--
-- Name: unread_notification_count(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION "public"."unread_notification_count"() RETURNS integer
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  select count(*)::integer from notifications
  where user_id = auth.uid() and is_read = false;
$$;


ALTER FUNCTION "public"."unread_notification_count"() OWNER TO "postgres";

--
-- Name: activity_events; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS "public"."activity_events" (
    "id" bigint NOT NULL,
    "actor_id" "uuid" NOT NULL,
    "type" "public"."activity_type" NOT NULL,
    "target_type" "public"."target_type" NOT NULL,
    "target_id" "uuid" NOT NULL,
    "payload" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."activity_events" OWNER TO "postgres";

--
-- Name: activity_events_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE IF NOT EXISTS "public"."activity_events_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."activity_events_id_seq" OWNER TO "postgres";

--
-- Name: activity_events_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE "public"."activity_events_id_seq" OWNED BY "public"."activity_events"."id";


--
-- Name: audit_log; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS "public"."audit_log" (
    "id" bigint NOT NULL,
    "actor_id" "uuid",
    "actor_role" "public"."app_role",
    "action" "text" NOT NULL,
    "target_type" "public"."target_type",
    "target_id" "uuid",
    "reason" "text",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."audit_log" OWNER TO "postgres";

--
-- Name: audit_log_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE IF NOT EXISTS "public"."audit_log_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."audit_log_id_seq" OWNER TO "postgres";

--
-- Name: audit_log_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE "public"."audit_log_id_seq" OWNED BY "public"."audit_log"."id";


--
-- Name: blocks; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS "public"."blocks" (
    "blocker_id" "uuid" NOT NULL,
    "blocked_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "blocks_check" CHECK (("blocker_id" <> "blocked_id"))
);


ALTER TABLE "public"."blocks" OWNER TO "postgres";

--
-- Name: collection_followers; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS "public"."collection_followers" (
    "collection_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."collection_followers" OWNER TO "postgres";

--
-- Name: collection_recipes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS "public"."collection_recipes" (
    "collection_id" "uuid" NOT NULL,
    "recipe_id" "uuid" NOT NULL,
    "position" integer DEFAULT 0 NOT NULL,
    "added_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."collection_recipes" OWNER TO "postgres";

--
-- Name: collections; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS "public"."collections" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "cover_url" "text",
    "is_public" boolean DEFAULT false NOT NULL,
    "is_hidden" boolean DEFAULT false NOT NULL,
    "recipe_count" integer DEFAULT 0 NOT NULL,
    "follower_count" integer DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "collections_name_check" CHECK ((("char_length"("name") >= 1) AND ("char_length"("name") <= 100)))
);


ALTER TABLE "public"."collections" OWNER TO "postgres";

--
-- Name: follows; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS "public"."follows" (
    "follower_id" "uuid" NOT NULL,
    "followee_id" "uuid" NOT NULL,
    "state" "public"."follow_state" DEFAULT 'accepted'::"public"."follow_state" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "follows_check" CHECK (("follower_id" <> "followee_id"))
);


ALTER TABLE "public"."follows" OWNER TO "postgres";

--
-- Name: ingredient_substitutes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS "public"."ingredient_substitutes" (
    "ingredient_id" "uuid" NOT NULL,
    "substitute_id" "uuid" NOT NULL,
    "ratio" numeric(6,3) DEFAULT 1 NOT NULL,
    "note" "text",
    CONSTRAINT "ingredient_substitutes_check" CHECK (("ingredient_id" <> "substitute_id"))
);


ALTER TABLE "public"."ingredient_substitutes" OWNER TO "postgres";

--
-- Name: ingredients; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS "public"."ingredients" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "slug" "text" NOT NULL,
    "aisle" "text",
    "image_url" "text",
    "is_allergen" boolean DEFAULT false NOT NULL,
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."ingredients" OWNER TO "postgres";

--
-- Name: meal_plans; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS "public"."meal_plans" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "recipe_id" "uuid" NOT NULL,
    "plan_date" "date" NOT NULL,
    "slot" "public"."meal_slot" NOT NULL,
    "servings" integer,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."meal_plans" OWNER TO "postgres";

--
-- Name: moderation_settings; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS "public"."moderation_settings" (
    "id" boolean DEFAULT true NOT NULL,
    "auto_hide_threshold" integer DEFAULT 3 NOT NULL,
    "reports_per_day_limit" integer DEFAULT 20 NOT NULL,
    "require_first_post_review" boolean DEFAULT true NOT NULL,
    CONSTRAINT "moderation_settings_id_check" CHECK ("id")
);


ALTER TABLE "public"."moderation_settings" OWNER TO "postgres";

--
-- Name: notification_settings; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS "public"."notification_settings" (
    "user_id" "uuid" NOT NULL,
    "push_new_follower" boolean DEFAULT true NOT NULL,
    "push_recipe_tip" boolean DEFAULT true NOT NULL,
    "push_tip_reply" boolean DEFAULT true NOT NULL,
    "push_moderation" boolean DEFAULT true NOT NULL,
    "push_weekly_digest" boolean DEFAULT true NOT NULL,
    "email_enabled" boolean DEFAULT false NOT NULL
);


ALTER TABLE "public"."notification_settings" OWNER TO "postgres";

--
-- Name: notifications; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS "public"."notifications" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "actor_id" "uuid",
    "type" "public"."notif_type" NOT NULL,
    "target_type" "public"."target_type",
    "target_id" "uuid",
    "payload" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "is_read" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."notifications" OWNER TO "postgres";

--
-- Name: profiles; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "uuid" NOT NULL,
    "username" "text" NOT NULL,
    "display_name" "text",
    "avatar_url" "text",
    "cover_url" "text",
    "bio" "text",
    "website" "text",
    "location" "text",
    "is_verified" boolean DEFAULT false NOT NULL,
    "is_private" boolean DEFAULT false NOT NULL,
    "is_trusted" boolean DEFAULT false NOT NULL,
    "suspended_until" timestamp with time zone,
    "recipe_count" integer DEFAULT 0 NOT NULL,
    "follower_count" integer DEFAULT 0 NOT NULL,
    "following_count" integer DEFAULT 0 NOT NULL,
    "tip_count" integer DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "profiles_bio_check" CHECK (("char_length"("bio") <= 500)),
    CONSTRAINT "profiles_username_check" CHECK ((("char_length"("username") >= 3) AND ("char_length"("username") <= 30)))
);


ALTER TABLE "public"."profiles" OWNER TO "postgres";

--
-- Name: push_tokens; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS "public"."push_tokens" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "token" "text" NOT NULL,
    "platform" "public"."platform_type" NOT NULL,
    "last_seen" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."push_tokens" OWNER TO "postgres";

--
-- Name: recipe_ingredients; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS "public"."recipe_ingredients" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "recipe_id" "uuid" NOT NULL,
    "section_id" "uuid",
    "ingredient_id" "uuid",
    "quantity" numeric(10,3),
    "unit" "text",
    "note" "text",
    "raw_text" "text",
    "is_optional" boolean DEFAULT false NOT NULL,
    "position" integer DEFAULT 0 NOT NULL
);


ALTER TABLE "public"."recipe_ingredients" OWNER TO "postgres";

--
-- Name: recipe_media; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS "public"."recipe_media" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "recipe_id" "uuid" NOT NULL,
    "type" "public"."media_type" NOT NULL,
    "url" "text" NOT NULL,
    "width" integer,
    "height" integer,
    "position" integer DEFAULT 0 NOT NULL
);


ALTER TABLE "public"."recipe_media" OWNER TO "postgres";

--
-- Name: recipe_nutrition; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS "public"."recipe_nutrition" (
    "recipe_id" "uuid" NOT NULL,
    "calories" numeric(8,2),
    "protein_g" numeric(8,2),
    "fat_g" numeric(8,2),
    "carbs_g" numeric(8,2),
    "fiber_g" numeric(8,2),
    "sugar_g" numeric(8,2),
    "sodium_mg" numeric(8,2),
    "per_serving" boolean DEFAULT true NOT NULL
);


ALTER TABLE "public"."recipe_nutrition" OWNER TO "postgres";

--
-- Name: recipe_ratings; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS "public"."recipe_ratings" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "recipe_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "rating" smallint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "recipe_ratings_rating_check" CHECK ((("rating" >= 1) AND ("rating" <= 5)))
);


ALTER TABLE "public"."recipe_ratings" OWNER TO "postgres";

--
-- Name: recipe_sections; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS "public"."recipe_sections" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "recipe_id" "uuid" NOT NULL,
    "name" "text",
    "position" integer DEFAULT 0 NOT NULL
);


ALTER TABLE "public"."recipe_sections" OWNER TO "postgres";

--
-- Name: recipe_steps; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS "public"."recipe_steps" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "recipe_id" "uuid" NOT NULL,
    "section_id" "uuid",
    "position" integer NOT NULL,
    "content" "text" NOT NULL,
    "image_url" "text",
    "video_timestamp_s" integer,
    "timer_seconds" integer
);


ALTER TABLE "public"."recipe_steps" OWNER TO "postgres";

--
-- Name: recipe_tags; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS "public"."recipe_tags" (
    "recipe_id" "uuid" NOT NULL,
    "tag_id" "uuid" NOT NULL
);


ALTER TABLE "public"."recipe_tags" OWNER TO "postgres";

--
-- Name: recipe_tips; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS "public"."recipe_tips" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "recipe_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "body" "text" NOT NULL,
    "image_url" "text",
    "like_count" integer DEFAULT 0 NOT NULL,
    "reply_count" integer DEFAULT 0 NOT NULL,
    "report_count" integer DEFAULT 0 NOT NULL,
    "is_hidden" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "recipe_tips_body_check" CHECK ((("char_length"("body") >= 1) AND ("char_length"("body") <= 2000)))
);


ALTER TABLE "public"."recipe_tips" OWNER TO "postgres";

--
-- Name: recipe_views; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS "public"."recipe_views" (
    "id" bigint NOT NULL,
    "recipe_id" "uuid" NOT NULL,
    "user_id" "uuid",
    "source" "text",
    "viewed_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."recipe_views" OWNER TO "postgres";

--
-- Name: recipe_views_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE IF NOT EXISTS "public"."recipe_views_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."recipe_views_id_seq" OWNER TO "postgres";

--
-- Name: recipe_views_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE "public"."recipe_views_id_seq" OWNED BY "public"."recipe_views"."id";


--
-- Name: reports; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS "public"."reports" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "reporter_id" "uuid",
    "target_type" "public"."target_type" NOT NULL,
    "target_id" "uuid" NOT NULL,
    "reason" "public"."report_reason" NOT NULL,
    "detail" "text",
    "state" "public"."report_state" DEFAULT 'open'::"public"."report_state" NOT NULL,
    "resolver_id" "uuid",
    "resolution" "text",
    "resolved_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."reports" OWNER TO "postgres";

--
-- Name: saved_recipes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS "public"."saved_recipes" (
    "user_id" "uuid" NOT NULL,
    "recipe_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."saved_recipes" OWNER TO "postgres";

--
-- Name: search_history; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS "public"."search_history" (
    "id" bigint NOT NULL,
    "user_id" "uuid" NOT NULL,
    "query" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."search_history" OWNER TO "postgres";

--
-- Name: search_history_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE IF NOT EXISTS "public"."search_history_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."search_history_id_seq" OWNER TO "postgres";

--
-- Name: search_history_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE "public"."search_history_id_seq" OWNED BY "public"."search_history"."id";


--
-- Name: shopping_list_items; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS "public"."shopping_list_items" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "list_id" "uuid" NOT NULL,
    "ingredient_id" "uuid",
    "custom_name" "text",
    "recipe_id" "uuid",
    "quantity" numeric(10,3),
    "unit" "text",
    "is_checked" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "shopping_list_items_check" CHECK ((("ingredient_id" IS NOT NULL) OR ("custom_name" IS NOT NULL)))
);


ALTER TABLE "public"."shopping_list_items" OWNER TO "postgres";

--
-- Name: shopping_lists; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS "public"."shopping_lists" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "name" "text" DEFAULT 'Danh sách của tôi'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."shopping_lists" OWNER TO "postgres";

--
-- Name: suspensions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS "public"."suspensions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "moderator_id" "uuid",
    "reason" "text" NOT NULL,
    "starts_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "expires_at" timestamp with time zone,
    "lifted_at" timestamp with time zone,
    "lifted_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."suspensions" OWNER TO "postgres";

--
-- Name: tags; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS "public"."tags" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "type" "public"."tag_type" NOT NULL,
    "name" "text" NOT NULL,
    "slug" "text" NOT NULL,
    "image_url" "text",
    "position" integer DEFAULT 0 NOT NULL
);


ALTER TABLE "public"."tags" OWNER TO "postgres";

--
-- Name: tip_likes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS "public"."tip_likes" (
    "tip_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."tip_likes" OWNER TO "postgres";

--
-- Name: tip_replies; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS "public"."tip_replies" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "tip_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "body" "text" NOT NULL,
    "report_count" integer DEFAULT 0 NOT NULL,
    "is_hidden" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "tip_replies_body_check" CHECK ((("char_length"("body") >= 1) AND ("char_length"("body") <= 1000)))
);


ALTER TABLE "public"."tip_replies" OWNER TO "postgres";

--
-- Name: unit_conversions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS "public"."unit_conversions" (
    "from_unit" "text" NOT NULL,
    "to_unit" "text" NOT NULL,
    "factor" numeric(14,6) NOT NULL
);


ALTER TABLE "public"."unit_conversions" OWNER TO "postgres";

--
-- Name: user_allergens; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS "public"."user_allergens" (
    "user_id" "uuid" NOT NULL,
    "ingredient_id" "uuid" NOT NULL,
    "severity" smallint DEFAULT 1 NOT NULL,
    CONSTRAINT "user_allergens_severity_check" CHECK ((("severity" >= 1) AND ("severity" <= 3)))
);


ALTER TABLE "public"."user_allergens" OWNER TO "postgres";

--
-- Name: user_pantry; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS "public"."user_pantry" (
    "user_id" "uuid" NOT NULL,
    "ingredient_id" "uuid" NOT NULL,
    "quantity" numeric(10,3),
    "unit" "text",
    "expires_on" "date",
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."user_pantry" OWNER TO "postgres";

--
-- Name: user_preferences; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS "public"."user_preferences" (
    "user_id" "uuid" NOT NULL,
    "units" "public"."unit_system" DEFAULT 'metric'::"public"."unit_system" NOT NULL,
    "locale" "text" DEFAULT 'vi'::"text" NOT NULL,
    "diet_tag_ids" "uuid"[] DEFAULT '{}'::"uuid"[] NOT NULL,
    "excluded_tag_ids" "uuid"[] DEFAULT '{}'::"uuid"[] NOT NULL,
    "max_cook_time_min" integer,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."user_preferences" OWNER TO "postgres";

--
-- Name: user_roles; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS "public"."user_roles" (
    "user_id" "uuid" NOT NULL,
    "role" "public"."app_role" NOT NULL,
    "granted_by" "uuid",
    "granted_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."user_roles" OWNER TO "postgres";

--
-- Name: activity_events id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."activity_events" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."activity_events_id_seq"'::"regclass");


--
-- Name: audit_log id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."audit_log" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."audit_log_id_seq"'::"regclass");


--
-- Name: recipe_views id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."recipe_views" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."recipe_views_id_seq"'::"regclass");


--
-- Name: search_history id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."search_history" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."search_history_id_seq"'::"regclass");


--
-- Name: activity_events activity_events_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."activity_events"
    ADD CONSTRAINT "activity_events_pkey" PRIMARY KEY ("id");


--
-- Name: audit_log audit_log_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."audit_log"
    ADD CONSTRAINT "audit_log_pkey" PRIMARY KEY ("id");


--
-- Name: blocks blocks_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."blocks"
    ADD CONSTRAINT "blocks_pkey" PRIMARY KEY ("blocker_id", "blocked_id");


--
-- Name: collection_followers collection_followers_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."collection_followers"
    ADD CONSTRAINT "collection_followers_pkey" PRIMARY KEY ("collection_id", "user_id");


--
-- Name: collection_recipes collection_recipes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."collection_recipes"
    ADD CONSTRAINT "collection_recipes_pkey" PRIMARY KEY ("collection_id", "recipe_id");


--
-- Name: collections collections_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."collections"
    ADD CONSTRAINT "collections_pkey" PRIMARY KEY ("id");


--
-- Name: collections collections_user_id_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."collections"
    ADD CONSTRAINT "collections_user_id_name_key" UNIQUE ("user_id", "name");


--
-- Name: follows follows_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."follows"
    ADD CONSTRAINT "follows_pkey" PRIMARY KEY ("follower_id", "followee_id");


--
-- Name: ingredient_substitutes ingredient_substitutes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."ingredient_substitutes"
    ADD CONSTRAINT "ingredient_substitutes_pkey" PRIMARY KEY ("ingredient_id", "substitute_id");


--
-- Name: ingredients ingredients_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."ingredients"
    ADD CONSTRAINT "ingredients_pkey" PRIMARY KEY ("id");


--
-- Name: ingredients ingredients_slug_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."ingredients"
    ADD CONSTRAINT "ingredients_slug_key" UNIQUE ("slug");


--
-- Name: meal_plans meal_plans_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."meal_plans"
    ADD CONSTRAINT "meal_plans_pkey" PRIMARY KEY ("id");


--
-- Name: meal_plans meal_plans_user_id_plan_date_slot_recipe_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."meal_plans"
    ADD CONSTRAINT "meal_plans_user_id_plan_date_slot_recipe_id_key" UNIQUE ("user_id", "plan_date", "slot", "recipe_id");


--
-- Name: moderation_settings moderation_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."moderation_settings"
    ADD CONSTRAINT "moderation_settings_pkey" PRIMARY KEY ("id");


--
-- Name: notification_settings notification_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."notification_settings"
    ADD CONSTRAINT "notification_settings_pkey" PRIMARY KEY ("user_id");


--
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_pkey" PRIMARY KEY ("id");


--
-- Name: profiles profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");


--
-- Name: profiles profiles_username_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_username_key" UNIQUE ("username");


--
-- Name: push_tokens push_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."push_tokens"
    ADD CONSTRAINT "push_tokens_pkey" PRIMARY KEY ("id");


--
-- Name: push_tokens push_tokens_token_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."push_tokens"
    ADD CONSTRAINT "push_tokens_token_key" UNIQUE ("token");


--
-- Name: recipe_ingredients recipe_ingredients_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."recipe_ingredients"
    ADD CONSTRAINT "recipe_ingredients_pkey" PRIMARY KEY ("id");


--
-- Name: recipe_media recipe_media_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."recipe_media"
    ADD CONSTRAINT "recipe_media_pkey" PRIMARY KEY ("id");


--
-- Name: recipe_nutrition recipe_nutrition_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."recipe_nutrition"
    ADD CONSTRAINT "recipe_nutrition_pkey" PRIMARY KEY ("recipe_id");


--
-- Name: recipe_ratings recipe_ratings_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."recipe_ratings"
    ADD CONSTRAINT "recipe_ratings_pkey" PRIMARY KEY ("id");


--
-- Name: recipe_ratings recipe_ratings_recipe_id_user_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."recipe_ratings"
    ADD CONSTRAINT "recipe_ratings_recipe_id_user_id_key" UNIQUE ("recipe_id", "user_id");


--
-- Name: recipe_sections recipe_sections_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."recipe_sections"
    ADD CONSTRAINT "recipe_sections_pkey" PRIMARY KEY ("id");


--
-- Name: recipe_steps recipe_steps_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."recipe_steps"
    ADD CONSTRAINT "recipe_steps_pkey" PRIMARY KEY ("id");


--
-- Name: recipe_steps recipe_steps_recipe_id_position_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."recipe_steps"
    ADD CONSTRAINT "recipe_steps_recipe_id_position_key" UNIQUE ("recipe_id", "position");


--
-- Name: recipe_tags recipe_tags_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."recipe_tags"
    ADD CONSTRAINT "recipe_tags_pkey" PRIMARY KEY ("recipe_id", "tag_id");


--
-- Name: recipe_tips recipe_tips_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."recipe_tips"
    ADD CONSTRAINT "recipe_tips_pkey" PRIMARY KEY ("id");


--
-- Name: recipe_views recipe_views_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."recipe_views"
    ADD CONSTRAINT "recipe_views_pkey" PRIMARY KEY ("id");


--
-- Name: recipes recipes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."recipes"
    ADD CONSTRAINT "recipes_pkey" PRIMARY KEY ("id");


--
-- Name: recipes recipes_slug_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."recipes"
    ADD CONSTRAINT "recipes_slug_key" UNIQUE ("slug");


--
-- Name: reports reports_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."reports"
    ADD CONSTRAINT "reports_pkey" PRIMARY KEY ("id");


--
-- Name: reports reports_reporter_id_target_type_target_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."reports"
    ADD CONSTRAINT "reports_reporter_id_target_type_target_id_key" UNIQUE ("reporter_id", "target_type", "target_id");


--
-- Name: saved_recipes saved_recipes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."saved_recipes"
    ADD CONSTRAINT "saved_recipes_pkey" PRIMARY KEY ("user_id", "recipe_id");


--
-- Name: search_history search_history_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."search_history"
    ADD CONSTRAINT "search_history_pkey" PRIMARY KEY ("id");


--
-- Name: shopping_list_items shopping_list_items_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."shopping_list_items"
    ADD CONSTRAINT "shopping_list_items_pkey" PRIMARY KEY ("id");


--
-- Name: shopping_lists shopping_lists_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."shopping_lists"
    ADD CONSTRAINT "shopping_lists_pkey" PRIMARY KEY ("id");


--
-- Name: suspensions suspensions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."suspensions"
    ADD CONSTRAINT "suspensions_pkey" PRIMARY KEY ("id");


--
-- Name: tags tags_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."tags"
    ADD CONSTRAINT "tags_pkey" PRIMARY KEY ("id");


--
-- Name: tags tags_type_slug_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."tags"
    ADD CONSTRAINT "tags_type_slug_key" UNIQUE ("type", "slug");


--
-- Name: tip_likes tip_likes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."tip_likes"
    ADD CONSTRAINT "tip_likes_pkey" PRIMARY KEY ("tip_id", "user_id");


--
-- Name: tip_replies tip_replies_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."tip_replies"
    ADD CONSTRAINT "tip_replies_pkey" PRIMARY KEY ("id");


--
-- Name: unit_conversions unit_conversions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."unit_conversions"
    ADD CONSTRAINT "unit_conversions_pkey" PRIMARY KEY ("from_unit", "to_unit");


--
-- Name: user_allergens user_allergens_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."user_allergens"
    ADD CONSTRAINT "user_allergens_pkey" PRIMARY KEY ("user_id", "ingredient_id");


--
-- Name: user_pantry user_pantry_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."user_pantry"
    ADD CONSTRAINT "user_pantry_pkey" PRIMARY KEY ("user_id", "ingredient_id");


--
-- Name: user_preferences user_preferences_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."user_preferences"
    ADD CONSTRAINT "user_preferences_pkey" PRIMARY KEY ("user_id");


--
-- Name: user_roles user_roles_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."user_roles"
    ADD CONSTRAINT "user_roles_pkey" PRIMARY KEY ("user_id", "role");


--
-- Name: activity_events_actor_id_created_at_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "activity_events_actor_id_created_at_idx" ON "public"."activity_events" USING "btree" ("actor_id", "created_at" DESC);


--
-- Name: activity_recent_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "activity_recent_idx" ON "public"."activity_events" USING "btree" ("created_at" DESC);


--
-- Name: audit_log_actor_id_created_at_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "audit_log_actor_id_created_at_idx" ON "public"."audit_log" USING "btree" ("actor_id", "created_at" DESC);


--
-- Name: audit_log_created_at_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "audit_log_created_at_idx" ON "public"."audit_log" USING "btree" ("created_at" DESC);


--
-- Name: audit_log_target_type_target_id_created_at_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "audit_log_target_type_target_id_created_at_idx" ON "public"."audit_log" USING "btree" ("target_type", "target_id", "created_at" DESC);


--
-- Name: blocks_blocked_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "blocks_blocked_id_idx" ON "public"."blocks" USING "btree" ("blocked_id");


--
-- Name: collection_followers_user_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "collection_followers_user_id_idx" ON "public"."collection_followers" USING "btree" ("user_id");


--
-- Name: collection_recipes_collection_id_position_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "collection_recipes_collection_id_position_idx" ON "public"."collection_recipes" USING "btree" ("collection_id", "position");


--
-- Name: collection_recipes_recipe_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "collection_recipes_recipe_id_idx" ON "public"."collection_recipes" USING "btree" ("recipe_id");


--
-- Name: collections_is_public_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "collections_is_public_idx" ON "public"."collections" USING "btree" ("is_public") WHERE "is_public";


--
-- Name: collections_user_id_updated_at_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "collections_user_id_updated_at_idx" ON "public"."collections" USING "btree" ("user_id", "updated_at" DESC);


--
-- Name: follows_followee_id_state_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "follows_followee_id_state_idx" ON "public"."follows" USING "btree" ("followee_id", "state");


--
-- Name: follows_follower_id_state_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "follows_follower_id_state_idx" ON "public"."follows" USING "btree" ("follower_id", "state");


--
-- Name: ingredients_name_trgm; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "ingredients_name_trgm" ON "public"."ingredients" USING "gin" ("name" "public"."gin_trgm_ops");


--
-- Name: meal_plans_user_id_plan_date_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "meal_plans_user_id_plan_date_idx" ON "public"."meal_plans" USING "btree" ("user_id", "plan_date");


--
-- Name: notifications_user_id_created_at_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "notifications_user_id_created_at_idx" ON "public"."notifications" USING "btree" ("user_id", "created_at" DESC);


--
-- Name: notifications_user_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "notifications_user_id_idx" ON "public"."notifications" USING "btree" ("user_id") WHERE ("is_read" = false);


--
-- Name: profiles_display_trgm; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "profiles_display_trgm" ON "public"."profiles" USING "gin" ("display_name" "public"."gin_trgm_ops");


--
-- Name: profiles_suspended_until_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "profiles_suspended_until_idx" ON "public"."profiles" USING "btree" ("suspended_until") WHERE ("suspended_until" IS NOT NULL);


--
-- Name: profiles_username_trgm; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "profiles_username_trgm" ON "public"."profiles" USING "gin" ("username" "public"."gin_trgm_ops");


--
-- Name: push_tokens_user_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "push_tokens_user_id_idx" ON "public"."push_tokens" USING "btree" ("user_id");


--
-- Name: recipe_ingredients_ingredient_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "recipe_ingredients_ingredient_id_idx" ON "public"."recipe_ingredients" USING "btree" ("ingredient_id");


--
-- Name: recipe_ingredients_recipe_id_position_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "recipe_ingredients_recipe_id_position_idx" ON "public"."recipe_ingredients" USING "btree" ("recipe_id", "position");


--
-- Name: recipe_media_recipe_id_position_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "recipe_media_recipe_id_position_idx" ON "public"."recipe_media" USING "btree" ("recipe_id", "position");


--
-- Name: recipe_ratings_recipe_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "recipe_ratings_recipe_id_idx" ON "public"."recipe_ratings" USING "btree" ("recipe_id");


--
-- Name: recipe_sections_recipe_id_position_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "recipe_sections_recipe_id_position_idx" ON "public"."recipe_sections" USING "btree" ("recipe_id", "position");


--
-- Name: recipe_tags_tag_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "recipe_tags_tag_id_idx" ON "public"."recipe_tags" USING "btree" ("tag_id");


--
-- Name: recipe_tips_recipe_id_created_at_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "recipe_tips_recipe_id_created_at_idx" ON "public"."recipe_tips" USING "btree" ("recipe_id", "created_at" DESC);


--
-- Name: recipe_tips_user_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "recipe_tips_user_id_idx" ON "public"."recipe_tips" USING "btree" ("user_id");


--
-- Name: recipe_views_recipe_id_viewed_at_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "recipe_views_recipe_id_viewed_at_idx" ON "public"."recipe_views" USING "btree" ("recipe_id", "viewed_at" DESC);


--
-- Name: recipe_views_user_id_viewed_at_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "recipe_views_user_id_viewed_at_idx" ON "public"."recipe_views" USING "btree" ("user_id", "viewed_at" DESC);


--
-- Name: recipes_author_id_status_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "recipes_author_id_status_idx" ON "public"."recipes" USING "btree" ("author_id", "status");


--
-- Name: recipes_is_featured_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "recipes_is_featured_idx" ON "public"."recipes" USING "btree" ("is_featured") WHERE (("status" = 'published'::"public"."recipe_status") AND (NOT "is_hidden"));


--
-- Name: recipes_pending_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "recipes_pending_idx" ON "public"."recipes" USING "btree" ("created_at") WHERE ("status" = 'pending_review'::"public"."recipe_status");


--
-- Name: recipes_search_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "recipes_search_idx" ON "public"."recipes" USING "gin" ("search_vector");


--
-- Name: recipes_status_published_at_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "recipes_status_published_at_idx" ON "public"."recipes" USING "btree" ("status", "published_at" DESC);


--
-- Name: recipes_title_trgm; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "recipes_title_trgm" ON "public"."recipes" USING "gin" ("title" "public"."gin_trgm_ops");


--
-- Name: reports_reporter_id_created_at_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "reports_reporter_id_created_at_idx" ON "public"."reports" USING "btree" ("reporter_id", "created_at" DESC);


--
-- Name: reports_state_created_at_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "reports_state_created_at_idx" ON "public"."reports" USING "btree" ("state", "created_at");


--
-- Name: reports_target_type_target_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "reports_target_type_target_id_idx" ON "public"."reports" USING "btree" ("target_type", "target_id");


--
-- Name: saved_recipes_recipe_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "saved_recipes_recipe_id_idx" ON "public"."saved_recipes" USING "btree" ("recipe_id");


--
-- Name: saved_recipes_user_id_created_at_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "saved_recipes_user_id_created_at_idx" ON "public"."saved_recipes" USING "btree" ("user_id", "created_at" DESC);


--
-- Name: search_history_user_id_created_at_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "search_history_user_id_created_at_idx" ON "public"."search_history" USING "btree" ("user_id", "created_at" DESC);


--
-- Name: shopping_list_items_list_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "shopping_list_items_list_id_idx" ON "public"."shopping_list_items" USING "btree" ("list_id");


--
-- Name: shopping_lists_user_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "shopping_lists_user_id_idx" ON "public"."shopping_lists" USING "btree" ("user_id");


--
-- Name: suspensions_user_id_created_at_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "suspensions_user_id_created_at_idx" ON "public"."suspensions" USING "btree" ("user_id", "created_at" DESC);


--
-- Name: tip_replies_tip_id_created_at_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "tip_replies_tip_id_created_at_idx" ON "public"."tip_replies" USING "btree" ("tip_id", "created_at");


--
-- Name: blocks t_after_block; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE OR REPLACE TRIGGER "t_after_block" AFTER INSERT ON "public"."blocks" FOR EACH ROW EXECUTE FUNCTION "public"."after_block"();


--
-- Name: follows t_after_follow; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE OR REPLACE TRIGGER "t_after_follow" AFTER INSERT OR DELETE OR UPDATE ON "public"."follows" FOR EACH ROW EXECUTE FUNCTION "public"."after_follow_change"();


--
-- Name: reports t_after_report; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE OR REPLACE TRIGGER "t_after_report" AFTER INSERT ON "public"."reports" FOR EACH ROW EXECUTE FUNCTION "public"."after_report_insert"();


--
-- Name: follows t_before_follow; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE OR REPLACE TRIGGER "t_before_follow" BEFORE INSERT ON "public"."follows" FOR EACH ROW EXECUTE FUNCTION "public"."before_follow"();


--
-- Name: collections t_collection_created; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE OR REPLACE TRIGGER "t_collection_created" AFTER INSERT ON "public"."collections" FOR EACH ROW EXECUTE FUNCTION "public"."after_collection_created"();


--
-- Name: collection_followers t_collection_follower_count; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE OR REPLACE TRIGGER "t_collection_follower_count" AFTER INSERT OR DELETE ON "public"."collection_followers" FOR EACH ROW EXECUTE FUNCTION "public"."after_collection_follow"();


--
-- Name: collection_recipes t_collection_recipe_count; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE OR REPLACE TRIGGER "t_collection_recipe_count" AFTER INSERT OR DELETE ON "public"."collection_recipes" FOR EACH ROW EXECUTE FUNCTION "public"."after_collection_recipe"();


--
-- Name: collections t_collections_touch; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE OR REPLACE TRIGGER "t_collections_touch" BEFORE UPDATE ON "public"."collections" FOR EACH ROW EXECUTE FUNCTION "public"."touch_updated_at"();


--
-- Name: recipes t_gate_recipe_publish; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE OR REPLACE TRIGGER "t_gate_recipe_publish" BEFORE INSERT OR UPDATE ON "public"."recipes" FOR EACH ROW EXECUTE FUNCTION "public"."gate_recipe_publish"();


--
-- Name: profiles t_profiles_touch; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE OR REPLACE TRIGGER "t_profiles_touch" BEFORE UPDATE ON "public"."profiles" FOR EACH ROW EXECUTE FUNCTION "public"."touch_updated_at"();


--
-- Name: collections t_protect_collections; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE OR REPLACE TRIGGER "t_protect_collections" BEFORE INSERT OR UPDATE ON "public"."collections" FOR EACH ROW EXECUTE FUNCTION "public"."protect_collection_columns"();


--
-- Name: profiles t_protect_profiles; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE OR REPLACE TRIGGER "t_protect_profiles" BEFORE UPDATE ON "public"."profiles" FOR EACH ROW EXECUTE FUNCTION "public"."protect_profile_columns"();


--
-- Name: recipes t_protect_recipes; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE OR REPLACE TRIGGER "t_protect_recipes" BEFORE INSERT OR UPDATE ON "public"."recipes" FOR EACH ROW EXECUTE FUNCTION "public"."protect_recipe_columns"();


--
-- Name: tip_replies t_protect_replies; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE OR REPLACE TRIGGER "t_protect_replies" BEFORE INSERT OR UPDATE ON "public"."tip_replies" FOR EACH ROW EXECUTE FUNCTION "public"."protect_reply_columns"();


--
-- Name: recipe_tips t_protect_tips; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE OR REPLACE TRIGGER "t_protect_tips" BEFORE INSERT OR UPDATE ON "public"."recipe_tips" FOR EACH ROW EXECUTE FUNCTION "public"."protect_tip_columns"();


--
-- Name: recipe_ratings t_rating_agg; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE OR REPLACE TRIGGER "t_rating_agg" AFTER INSERT OR DELETE OR UPDATE ON "public"."recipe_ratings" FOR EACH ROW EXECUTE FUNCTION "public"."after_rating_change"();


--
-- Name: recipe_ratings t_ratings_touch; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE OR REPLACE TRIGGER "t_ratings_touch" BEFORE UPDATE ON "public"."recipe_ratings" FOR EACH ROW EXECUTE FUNCTION "public"."touch_updated_at"();


--
-- Name: recipes t_recipe_publish; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE OR REPLACE TRIGGER "t_recipe_publish" AFTER INSERT OR DELETE OR UPDATE ON "public"."recipes" FOR EACH ROW EXECUTE FUNCTION "public"."after_recipe_change"();


--
-- Name: recipes t_recipes_touch; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE OR REPLACE TRIGGER "t_recipes_touch" BEFORE UPDATE ON "public"."recipes" FOR EACH ROW EXECUTE FUNCTION "public"."touch_updated_at"();


--
-- Name: saved_recipes t_save_count; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE OR REPLACE TRIGGER "t_save_count" AFTER INSERT OR DELETE ON "public"."saved_recipes" FOR EACH ROW EXECUTE FUNCTION "public"."after_save_change"();


--
-- Name: recipe_tips t_tip_count; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE OR REPLACE TRIGGER "t_tip_count" AFTER INSERT OR DELETE ON "public"."recipe_tips" FOR EACH ROW EXECUTE FUNCTION "public"."after_tip_change"();


--
-- Name: tip_likes t_tip_like; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE OR REPLACE TRIGGER "t_tip_like" AFTER INSERT OR DELETE ON "public"."tip_likes" FOR EACH ROW EXECUTE FUNCTION "public"."after_tip_like"();


--
-- Name: tip_replies t_tip_reply; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE OR REPLACE TRIGGER "t_tip_reply" AFTER INSERT OR DELETE ON "public"."tip_replies" FOR EACH ROW EXECUTE FUNCTION "public"."after_tip_reply"();


--
-- Name: recipe_tips t_tips_touch; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE OR REPLACE TRIGGER "t_tips_touch" BEFORE UPDATE ON "public"."recipe_tips" FOR EACH ROW EXECUTE FUNCTION "public"."touch_updated_at"();


--
-- Name: recipe_views t_view_count; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE OR REPLACE TRIGGER "t_view_count" AFTER INSERT ON "public"."recipe_views" FOR EACH ROW EXECUTE FUNCTION "public"."after_view_insert"();


--
-- Name: activity_events activity_events_actor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."activity_events"
    ADD CONSTRAINT "activity_events_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;


--
-- Name: audit_log audit_log_actor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."audit_log"
    ADD CONSTRAINT "audit_log_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;


--
-- Name: blocks blocks_blocked_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."blocks"
    ADD CONSTRAINT "blocks_blocked_id_fkey" FOREIGN KEY ("blocked_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;


--
-- Name: blocks blocks_blocker_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."blocks"
    ADD CONSTRAINT "blocks_blocker_id_fkey" FOREIGN KEY ("blocker_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;


--
-- Name: collection_followers collection_followers_collection_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."collection_followers"
    ADD CONSTRAINT "collection_followers_collection_id_fkey" FOREIGN KEY ("collection_id") REFERENCES "public"."collections"("id") ON DELETE CASCADE;


--
-- Name: collection_followers collection_followers_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."collection_followers"
    ADD CONSTRAINT "collection_followers_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;


--
-- Name: collection_recipes collection_recipes_collection_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."collection_recipes"
    ADD CONSTRAINT "collection_recipes_collection_id_fkey" FOREIGN KEY ("collection_id") REFERENCES "public"."collections"("id") ON DELETE CASCADE;


--
-- Name: collection_recipes collection_recipes_recipe_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."collection_recipes"
    ADD CONSTRAINT "collection_recipes_recipe_id_fkey" FOREIGN KEY ("recipe_id") REFERENCES "public"."recipes"("id") ON DELETE CASCADE;


--
-- Name: collections collections_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."collections"
    ADD CONSTRAINT "collections_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;


--
-- Name: follows follows_followee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."follows"
    ADD CONSTRAINT "follows_followee_id_fkey" FOREIGN KEY ("followee_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;


--
-- Name: follows follows_follower_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."follows"
    ADD CONSTRAINT "follows_follower_id_fkey" FOREIGN KEY ("follower_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;


--
-- Name: ingredient_substitutes ingredient_substitutes_ingredient_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."ingredient_substitutes"
    ADD CONSTRAINT "ingredient_substitutes_ingredient_id_fkey" FOREIGN KEY ("ingredient_id") REFERENCES "public"."ingredients"("id") ON DELETE CASCADE;


--
-- Name: ingredient_substitutes ingredient_substitutes_substitute_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."ingredient_substitutes"
    ADD CONSTRAINT "ingredient_substitutes_substitute_id_fkey" FOREIGN KEY ("substitute_id") REFERENCES "public"."ingredients"("id") ON DELETE CASCADE;


--
-- Name: ingredients ingredients_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."ingredients"
    ADD CONSTRAINT "ingredients_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;


--
-- Name: meal_plans meal_plans_recipe_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."meal_plans"
    ADD CONSTRAINT "meal_plans_recipe_id_fkey" FOREIGN KEY ("recipe_id") REFERENCES "public"."recipes"("id") ON DELETE CASCADE;


--
-- Name: meal_plans meal_plans_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."meal_plans"
    ADD CONSTRAINT "meal_plans_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;


--
-- Name: notification_settings notification_settings_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."notification_settings"
    ADD CONSTRAINT "notification_settings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;


--
-- Name: notifications notifications_actor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;


--
-- Name: notifications notifications_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;


--
-- Name: profiles profiles_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;


--
-- Name: push_tokens push_tokens_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."push_tokens"
    ADD CONSTRAINT "push_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;


--
-- Name: recipe_ingredients recipe_ingredients_ingredient_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."recipe_ingredients"
    ADD CONSTRAINT "recipe_ingredients_ingredient_id_fkey" FOREIGN KEY ("ingredient_id") REFERENCES "public"."ingredients"("id") ON DELETE RESTRICT;


--
-- Name: recipe_ingredients recipe_ingredients_recipe_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."recipe_ingredients"
    ADD CONSTRAINT "recipe_ingredients_recipe_id_fkey" FOREIGN KEY ("recipe_id") REFERENCES "public"."recipes"("id") ON DELETE CASCADE;


--
-- Name: recipe_ingredients recipe_ingredients_section_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."recipe_ingredients"
    ADD CONSTRAINT "recipe_ingredients_section_id_fkey" FOREIGN KEY ("section_id") REFERENCES "public"."recipe_sections"("id") ON DELETE SET NULL;


--
-- Name: recipe_media recipe_media_recipe_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."recipe_media"
    ADD CONSTRAINT "recipe_media_recipe_id_fkey" FOREIGN KEY ("recipe_id") REFERENCES "public"."recipes"("id") ON DELETE CASCADE;


--
-- Name: recipe_nutrition recipe_nutrition_recipe_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."recipe_nutrition"
    ADD CONSTRAINT "recipe_nutrition_recipe_id_fkey" FOREIGN KEY ("recipe_id") REFERENCES "public"."recipes"("id") ON DELETE CASCADE;


--
-- Name: recipe_ratings recipe_ratings_recipe_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."recipe_ratings"
    ADD CONSTRAINT "recipe_ratings_recipe_id_fkey" FOREIGN KEY ("recipe_id") REFERENCES "public"."recipes"("id") ON DELETE CASCADE;


--
-- Name: recipe_ratings recipe_ratings_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."recipe_ratings"
    ADD CONSTRAINT "recipe_ratings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;


--
-- Name: recipe_sections recipe_sections_recipe_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."recipe_sections"
    ADD CONSTRAINT "recipe_sections_recipe_id_fkey" FOREIGN KEY ("recipe_id") REFERENCES "public"."recipes"("id") ON DELETE CASCADE;


--
-- Name: recipe_steps recipe_steps_recipe_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."recipe_steps"
    ADD CONSTRAINT "recipe_steps_recipe_id_fkey" FOREIGN KEY ("recipe_id") REFERENCES "public"."recipes"("id") ON DELETE CASCADE;


--
-- Name: recipe_steps recipe_steps_section_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."recipe_steps"
    ADD CONSTRAINT "recipe_steps_section_id_fkey" FOREIGN KEY ("section_id") REFERENCES "public"."recipe_sections"("id") ON DELETE SET NULL;


--
-- Name: recipe_tags recipe_tags_recipe_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."recipe_tags"
    ADD CONSTRAINT "recipe_tags_recipe_id_fkey" FOREIGN KEY ("recipe_id") REFERENCES "public"."recipes"("id") ON DELETE CASCADE;


--
-- Name: recipe_tags recipe_tags_tag_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."recipe_tags"
    ADD CONSTRAINT "recipe_tags_tag_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "public"."tags"("id") ON DELETE CASCADE;


--
-- Name: recipe_tips recipe_tips_recipe_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."recipe_tips"
    ADD CONSTRAINT "recipe_tips_recipe_id_fkey" FOREIGN KEY ("recipe_id") REFERENCES "public"."recipes"("id") ON DELETE CASCADE;


--
-- Name: recipe_tips recipe_tips_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."recipe_tips"
    ADD CONSTRAINT "recipe_tips_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;


--
-- Name: recipe_views recipe_views_recipe_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."recipe_views"
    ADD CONSTRAINT "recipe_views_recipe_id_fkey" FOREIGN KEY ("recipe_id") REFERENCES "public"."recipes"("id") ON DELETE CASCADE;


--
-- Name: recipe_views recipe_views_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."recipe_views"
    ADD CONSTRAINT "recipe_views_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;


--
-- Name: recipes recipes_author_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."recipes"
    ADD CONSTRAINT "recipes_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;


--
-- Name: reports reports_reporter_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."reports"
    ADD CONSTRAINT "reports_reporter_id_fkey" FOREIGN KEY ("reporter_id") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;


--
-- Name: reports reports_resolver_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."reports"
    ADD CONSTRAINT "reports_resolver_id_fkey" FOREIGN KEY ("resolver_id") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;


--
-- Name: saved_recipes saved_recipes_recipe_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."saved_recipes"
    ADD CONSTRAINT "saved_recipes_recipe_id_fkey" FOREIGN KEY ("recipe_id") REFERENCES "public"."recipes"("id") ON DELETE CASCADE;


--
-- Name: saved_recipes saved_recipes_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."saved_recipes"
    ADD CONSTRAINT "saved_recipes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;


--
-- Name: search_history search_history_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."search_history"
    ADD CONSTRAINT "search_history_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;


--
-- Name: shopping_list_items shopping_list_items_ingredient_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."shopping_list_items"
    ADD CONSTRAINT "shopping_list_items_ingredient_id_fkey" FOREIGN KEY ("ingredient_id") REFERENCES "public"."ingredients"("id") ON DELETE SET NULL;


--
-- Name: shopping_list_items shopping_list_items_list_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."shopping_list_items"
    ADD CONSTRAINT "shopping_list_items_list_id_fkey" FOREIGN KEY ("list_id") REFERENCES "public"."shopping_lists"("id") ON DELETE CASCADE;


--
-- Name: shopping_list_items shopping_list_items_recipe_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."shopping_list_items"
    ADD CONSTRAINT "shopping_list_items_recipe_id_fkey" FOREIGN KEY ("recipe_id") REFERENCES "public"."recipes"("id") ON DELETE SET NULL;


--
-- Name: shopping_lists shopping_lists_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."shopping_lists"
    ADD CONSTRAINT "shopping_lists_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;


--
-- Name: suspensions suspensions_lifted_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."suspensions"
    ADD CONSTRAINT "suspensions_lifted_by_fkey" FOREIGN KEY ("lifted_by") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;


--
-- Name: suspensions suspensions_moderator_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."suspensions"
    ADD CONSTRAINT "suspensions_moderator_id_fkey" FOREIGN KEY ("moderator_id") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;


--
-- Name: suspensions suspensions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."suspensions"
    ADD CONSTRAINT "suspensions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;


--
-- Name: tip_likes tip_likes_tip_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."tip_likes"
    ADD CONSTRAINT "tip_likes_tip_id_fkey" FOREIGN KEY ("tip_id") REFERENCES "public"."recipe_tips"("id") ON DELETE CASCADE;


--
-- Name: tip_likes tip_likes_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."tip_likes"
    ADD CONSTRAINT "tip_likes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;


--
-- Name: tip_replies tip_replies_tip_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."tip_replies"
    ADD CONSTRAINT "tip_replies_tip_id_fkey" FOREIGN KEY ("tip_id") REFERENCES "public"."recipe_tips"("id") ON DELETE CASCADE;


--
-- Name: tip_replies tip_replies_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."tip_replies"
    ADD CONSTRAINT "tip_replies_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;


--
-- Name: user_allergens user_allergens_ingredient_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."user_allergens"
    ADD CONSTRAINT "user_allergens_ingredient_id_fkey" FOREIGN KEY ("ingredient_id") REFERENCES "public"."ingredients"("id") ON DELETE CASCADE;


--
-- Name: user_allergens user_allergens_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."user_allergens"
    ADD CONSTRAINT "user_allergens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;


--
-- Name: user_pantry user_pantry_ingredient_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."user_pantry"
    ADD CONSTRAINT "user_pantry_ingredient_id_fkey" FOREIGN KEY ("ingredient_id") REFERENCES "public"."ingredients"("id") ON DELETE CASCADE;


--
-- Name: user_pantry user_pantry_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."user_pantry"
    ADD CONSTRAINT "user_pantry_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;


--
-- Name: user_preferences user_preferences_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."user_preferences"
    ADD CONSTRAINT "user_preferences_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;


--
-- Name: user_roles user_roles_granted_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."user_roles"
    ADD CONSTRAINT "user_roles_granted_by_fkey" FOREIGN KEY ("granted_by") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;


--
-- Name: user_roles user_roles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."user_roles"
    ADD CONSTRAINT "user_roles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;


--
-- Name: activity_events; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."activity_events" ENABLE ROW LEVEL SECURITY;

--
-- Name: follows approve follow; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "approve follow" ON "public"."follows" FOR UPDATE USING (("followee_id" = "auth"."uid"())) WITH CHECK (("followee_id" = "auth"."uid"()));


--
-- Name: audit_log; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."audit_log" ENABLE ROW LEVEL SECURITY;

--
-- Name: user_roles auth admin reads roles; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "auth admin reads roles" ON "public"."user_roles" FOR SELECT TO "supabase_auth_admin" USING (true);


--
-- Name: recipes author delete recipe; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "author delete recipe" ON "public"."recipes" FOR DELETE USING ((("author_id" = "auth"."uid"()) AND "public"."is_active"()));


--
-- Name: recipes author insert recipe; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "author insert recipe" ON "public"."recipes" FOR INSERT WITH CHECK ((("author_id" = "auth"."uid"()) AND "public"."is_active"() AND (NOT "is_featured") AND (NOT "is_official") AND (NOT "is_hidden")));


--
-- Name: recipes author update recipe; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "author update recipe" ON "public"."recipes" FOR UPDATE USING ((("author_id" = "auth"."uid"()) AND "public"."is_active"())) WITH CHECK (("author_id" = "auth"."uid"()));


--
-- Name: blocks; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."blocks" ENABLE ROW LEVEL SECURITY;

--
-- Name: collection_followers; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."collection_followers" ENABLE ROW LEVEL SECURITY;

--
-- Name: collection_recipes; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."collection_recipes" ENABLE ROW LEVEL SECURITY;

--
-- Name: collections; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."collections" ENABLE ROW LEVEL SECURITY;

--
-- Name: follows create follow; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "create follow" ON "public"."follows" FOR INSERT WITH CHECK ((("follower_id" = "auth"."uid"()) AND "public"."is_active"()));


--
-- Name: reports create report; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "create report" ON "public"."reports" FOR INSERT WITH CHECK ((("reporter_id" = "auth"."uid"()) AND "public"."is_active"()));


--
-- Name: follows delete follow; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "delete follow" ON "public"."follows" FOR DELETE USING ((("follower_id" = "auth"."uid"()) OR ("followee_id" = "auth"."uid"())));


--
-- Name: notifications delete notif; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "delete notif" ON "public"."notifications" FOR DELETE USING (("user_id" = "auth"."uid"()));


--
-- Name: follows; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."follows" ENABLE ROW LEVEL SECURITY;

--
-- Name: ingredient_substitutes; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."ingredient_substitutes" ENABLE ROW LEVEL SECURITY;

--
-- Name: ingredients; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."ingredients" ENABLE ROW LEVEL SECURITY;

--
-- Name: ingredients insert ingredients; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "insert ingredients" ON "public"."ingredients" FOR INSERT WITH CHECK ("public"."is_active"());


--
-- Name: recipe_views insert views; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "insert views" ON "public"."recipe_views" FOR INSERT WITH CHECK ((("user_id" = "auth"."uid"()) OR ("user_id" IS NULL)));


--
-- Name: notifications mark read; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "mark read" ON "public"."notifications" FOR UPDATE USING (("user_id" = "auth"."uid"())) WITH CHECK (("user_id" = "auth"."uid"()));


--
-- Name: meal_plans; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."meal_plans" ENABLE ROW LEVEL SECURITY;

--
-- Name: moderation_settings; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."moderation_settings" ENABLE ROW LEVEL SECURITY;

--
-- Name: notification_settings; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."notification_settings" ENABLE ROW LEVEL SECURITY;

--
-- Name: notifications; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."notifications" ENABLE ROW LEVEL SECURITY;

--
-- Name: user_allergens own allergens; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "own allergens" ON "public"."user_allergens" USING (("user_id" = "auth"."uid"())) WITH CHECK (("user_id" = "auth"."uid"()));


--
-- Name: blocks own blocks; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "own blocks" ON "public"."blocks" USING (("blocker_id" = "auth"."uid"())) WITH CHECK (("blocker_id" = "auth"."uid"()));


--
-- Name: collection_followers own coll_follow; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "own coll_follow" ON "public"."collection_followers" USING (("user_id" = "auth"."uid"())) WITH CHECK ((("user_id" = "auth"."uid"()) AND "public"."is_active"()));


--
-- Name: collection_recipes own coll_items; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "own coll_items" ON "public"."collection_recipes" USING (("public"."can_edit_collection"("collection_id") AND "public"."is_active"())) WITH CHECK ("public"."can_edit_collection"("collection_id"));


--
-- Name: collections own collections; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "own collections" ON "public"."collections" USING ((("user_id" = "auth"."uid"()) AND "public"."is_active"())) WITH CHECK ((("user_id" = "auth"."uid"()) AND (NOT "is_hidden")));


--
-- Name: shopping_list_items own list items; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "own list items" ON "public"."shopping_list_items" USING ((EXISTS ( SELECT 1
   FROM "public"."shopping_lists" "l"
  WHERE (("l"."id" = "shopping_list_items"."list_id") AND ("l"."user_id" = "auth"."uid"()))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."shopping_lists" "l"
  WHERE (("l"."id" = "shopping_list_items"."list_id") AND ("l"."user_id" = "auth"."uid"())))));


--
-- Name: shopping_lists own lists; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "own lists" ON "public"."shopping_lists" USING (("user_id" = "auth"."uid"())) WITH CHECK (("user_id" = "auth"."uid"()));


--
-- Name: notification_settings own notif settings; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "own notif settings" ON "public"."notification_settings" USING (("user_id" = "auth"."uid"())) WITH CHECK (("user_id" = "auth"."uid"()));


--
-- Name: notifications own notifications; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "own notifications" ON "public"."notifications" FOR SELECT USING (("user_id" = "auth"."uid"()));


--
-- Name: user_pantry own pantry; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "own pantry" ON "public"."user_pantry" USING (("user_id" = "auth"."uid"())) WITH CHECK (("user_id" = "auth"."uid"()));


--
-- Name: meal_plans own plans; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "own plans" ON "public"."meal_plans" USING (("user_id" = "auth"."uid"())) WITH CHECK (("user_id" = "auth"."uid"()));


--
-- Name: user_preferences own prefs; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "own prefs" ON "public"."user_preferences" USING (("user_id" = "auth"."uid"())) WITH CHECK (("user_id" = "auth"."uid"()));


--
-- Name: push_tokens own push tokens; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "own push tokens" ON "public"."push_tokens" USING (("user_id" = "auth"."uid"())) WITH CHECK (("user_id" = "auth"."uid"()));


--
-- Name: recipe_ratings own ratings; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "own ratings" ON "public"."recipe_ratings" USING (("user_id" = "auth"."uid"())) WITH CHECK ((("user_id" = "auth"."uid"()) AND "public"."is_active"()));


--
-- Name: tip_replies own replies; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "own replies" ON "public"."tip_replies" USING ((("user_id" = "auth"."uid"()) AND "public"."is_active"())) WITH CHECK ((("user_id" = "auth"."uid"()) AND (NOT "is_hidden")));


--
-- Name: saved_recipes own saves; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "own saves" ON "public"."saved_recipes" USING (("user_id" = "auth"."uid"())) WITH CHECK ((("user_id" = "auth"."uid"()) AND "public"."is_active"()));


--
-- Name: search_history own search; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "own search" ON "public"."search_history" USING (("user_id" = "auth"."uid"())) WITH CHECK (("user_id" = "auth"."uid"()));


--
-- Name: tip_likes own tip_likes; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "own tip_likes" ON "public"."tip_likes" USING (("user_id" = "auth"."uid"())) WITH CHECK ((("user_id" = "auth"."uid"()) AND "public"."is_active"()));


--
-- Name: recipe_tips own tips; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "own tips" ON "public"."recipe_tips" USING ((("user_id" = "auth"."uid"()) AND "public"."is_active"())) WITH CHECK ((("user_id" = "auth"."uid"()) AND (NOT "is_hidden")));


--
-- Name: recipe_views own views; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "own views" ON "public"."recipe_views" FOR SELECT USING (("user_id" = "auth"."uid"()));


--
-- Name: profiles; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;

--
-- Name: push_tokens; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."push_tokens" ENABLE ROW LEVEL SECURITY;

--
-- Name: activity_events read activity; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "read activity" ON "public"."activity_events" FOR SELECT USING ((("actor_id" = "auth"."uid"()) OR "public"."is_moderator"() OR "public"."can_view_profile"("actor_id")));


--
-- Name: audit_log read audit; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "read audit" ON "public"."audit_log" FOR SELECT USING ("public"."is_moderator"());


--
-- Name: collection_followers read coll_followers; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "read coll_followers" ON "public"."collection_followers" FOR SELECT USING ((("user_id" = "auth"."uid"()) OR "public"."can_view_collection"("collection_id")));


--
-- Name: collection_recipes read coll_items; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "read coll_items" ON "public"."collection_recipes" FOR SELECT USING ("public"."can_view_collection"("collection_id"));


--
-- Name: collections read collections; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "read collections" ON "public"."collections" FOR SELECT USING ((("user_id" = "auth"."uid"()) OR "public"."is_moderator"() OR ("is_public" AND (NOT "is_hidden") AND (NOT "public"."is_blocked_with"("user_id")))));


--
-- Name: unit_conversions read conversions; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "read conversions" ON "public"."unit_conversions" FOR SELECT USING (true);


--
-- Name: follows read follows; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "read follows" ON "public"."follows" FOR SELECT USING ((("follower_id" = "auth"."uid"()) OR ("followee_id" = "auth"."uid"()) OR "public"."is_moderator"() OR "public"."can_view_profile"("followee_id")));


--
-- Name: ingredients read ingredients; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "read ingredients" ON "public"."ingredients" FOR SELECT USING (true);


--
-- Name: recipe_media read media; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "read media" ON "public"."recipe_media" FOR SELECT USING ("public"."can_view_recipe"("recipe_id"));


--
-- Name: moderation_settings read mod settings; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "read mod settings" ON "public"."moderation_settings" FOR SELECT USING ("public"."is_moderator"());


--
-- Name: recipe_nutrition read nutrition; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "read nutrition" ON "public"."recipe_nutrition" FOR SELECT USING ("public"."can_view_recipe"("recipe_id"));


--
-- Name: user_roles read own roles; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "read own roles" ON "public"."user_roles" FOR SELECT USING ((("user_id" = "auth"."uid"()) OR "public"."is_moderator"()));


--
-- Name: profiles read profiles; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "read profiles" ON "public"."profiles" FOR SELECT USING ((("id" = "auth"."uid"()) OR "public"."is_moderator"() OR (NOT "public"."is_blocked_with"("id"))));


--
-- Name: recipe_ratings read ratings; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "read ratings" ON "public"."recipe_ratings" FOR SELECT USING ("public"."can_view_recipe"("recipe_id"));


--
-- Name: recipe_ingredients read rec_ing; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "read rec_ing" ON "public"."recipe_ingredients" FOR SELECT USING ("public"."can_view_recipe"("recipe_id"));


--
-- Name: recipe_tags read recipe_tags; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "read recipe_tags" ON "public"."recipe_tags" FOR SELECT USING ("public"."can_view_recipe"("recipe_id"));


--
-- Name: recipes read recipes; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "read recipes" ON "public"."recipes" FOR SELECT USING ((("author_id" = "auth"."uid"()) OR "public"."is_moderator"() OR (("status" = 'published'::"public"."recipe_status") AND (NOT "is_hidden") AND (("author_id" IS NULL) OR (NOT "public"."is_blocked_with"("author_id"))))));


--
-- Name: tip_replies read replies; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "read replies" ON "public"."tip_replies" FOR SELECT USING ((("user_id" = "auth"."uid"()) OR "public"."is_moderator"() OR ((NOT "is_hidden") AND (NOT "public"."is_blocked_with"("user_id")))));


--
-- Name: reports read reports; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "read reports" ON "public"."reports" FOR SELECT USING ((("reporter_id" = "auth"."uid"()) OR "public"."is_moderator"()));


--
-- Name: recipe_sections read sections; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "read sections" ON "public"."recipe_sections" FOR SELECT USING ("public"."can_view_recipe"("recipe_id"));


--
-- Name: recipe_steps read steps; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "read steps" ON "public"."recipe_steps" FOR SELECT USING ("public"."can_view_recipe"("recipe_id"));


--
-- Name: ingredient_substitutes read substitutes; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "read substitutes" ON "public"."ingredient_substitutes" FOR SELECT USING (true);


--
-- Name: suspensions read suspensions; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "read suspensions" ON "public"."suspensions" FOR SELECT USING ((("user_id" = "auth"."uid"()) OR "public"."is_moderator"()));


--
-- Name: tags read tags; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "read tags" ON "public"."tags" FOR SELECT USING (true);


--
-- Name: tip_likes read tip_likes; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "read tip_likes" ON "public"."tip_likes" FOR SELECT USING (true);


--
-- Name: recipe_tips read tips; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "read tips" ON "public"."recipe_tips" FOR SELECT USING ((("user_id" = "auth"."uid"()) OR "public"."is_moderator"() OR ((NOT "is_hidden") AND "public"."can_view_recipe"("recipe_id") AND (NOT "public"."is_blocked_with"("user_id")))));


--
-- Name: recipe_ingredients; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."recipe_ingredients" ENABLE ROW LEVEL SECURITY;

--
-- Name: recipe_media; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."recipe_media" ENABLE ROW LEVEL SECURITY;

--
-- Name: recipe_nutrition; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."recipe_nutrition" ENABLE ROW LEVEL SECURITY;

--
-- Name: recipe_ratings; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."recipe_ratings" ENABLE ROW LEVEL SECURITY;

--
-- Name: recipe_sections; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."recipe_sections" ENABLE ROW LEVEL SECURITY;

--
-- Name: recipe_steps; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."recipe_steps" ENABLE ROW LEVEL SECURITY;

--
-- Name: recipe_tags; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."recipe_tags" ENABLE ROW LEVEL SECURITY;

--
-- Name: recipe_tips; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."recipe_tips" ENABLE ROW LEVEL SECURITY;

--
-- Name: recipe_views; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."recipe_views" ENABLE ROW LEVEL SECURITY;

--
-- Name: recipes; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."recipes" ENABLE ROW LEVEL SECURITY;

--
-- Name: reports; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."reports" ENABLE ROW LEVEL SECURITY;

--
-- Name: saved_recipes; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."saved_recipes" ENABLE ROW LEVEL SECURITY;

--
-- Name: search_history; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."search_history" ENABLE ROW LEVEL SECURITY;

--
-- Name: shopping_list_items; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."shopping_list_items" ENABLE ROW LEVEL SECURITY;

--
-- Name: shopping_lists; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."shopping_lists" ENABLE ROW LEVEL SECURITY;

--
-- Name: suspensions; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."suspensions" ENABLE ROW LEVEL SECURITY;

--
-- Name: tags; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."tags" ENABLE ROW LEVEL SECURITY;

--
-- Name: tip_likes; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."tip_likes" ENABLE ROW LEVEL SECURITY;

--
-- Name: tip_replies; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."tip_replies" ENABLE ROW LEVEL SECURITY;

--
-- Name: unit_conversions; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."unit_conversions" ENABLE ROW LEVEL SECURITY;

--
-- Name: profiles update own profile; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "update own profile" ON "public"."profiles" FOR UPDATE USING ((("id" = "auth"."uid"()) AND "public"."is_active"())) WITH CHECK (("id" = "auth"."uid"()));


--
-- Name: user_allergens; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."user_allergens" ENABLE ROW LEVEL SECURITY;

--
-- Name: user_pantry; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."user_pantry" ENABLE ROW LEVEL SECURITY;

--
-- Name: user_preferences; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."user_preferences" ENABLE ROW LEVEL SECURITY;

--
-- Name: user_roles; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."user_roles" ENABLE ROW LEVEL SECURITY;

--
-- Name: recipe_media write media; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "write media" ON "public"."recipe_media" USING (("public"."owns_recipe"("recipe_id") AND "public"."is_active"())) WITH CHECK ("public"."owns_recipe"("recipe_id"));


--
-- Name: recipe_nutrition write nutrition; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "write nutrition" ON "public"."recipe_nutrition" USING (("public"."owns_recipe"("recipe_id") AND "public"."is_active"())) WITH CHECK ("public"."owns_recipe"("recipe_id"));


--
-- Name: recipe_ingredients write rec_ing; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "write rec_ing" ON "public"."recipe_ingredients" USING (("public"."owns_recipe"("recipe_id") AND "public"."is_active"())) WITH CHECK ("public"."owns_recipe"("recipe_id"));


--
-- Name: recipe_tags write recipe_tags; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "write recipe_tags" ON "public"."recipe_tags" USING (("public"."owns_recipe"("recipe_id") AND "public"."is_active"())) WITH CHECK ("public"."owns_recipe"("recipe_id"));


--
-- Name: recipe_sections write sections; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "write sections" ON "public"."recipe_sections" USING (("public"."owns_recipe"("recipe_id") AND "public"."is_active"())) WITH CHECK ("public"."owns_recipe"("recipe_id"));


--
-- Name: recipe_steps write steps; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "write steps" ON "public"."recipe_steps" USING (("public"."owns_recipe"("recipe_id") AND "public"."is_active"())) WITH CHECK ("public"."owns_recipe"("recipe_id"));


--
-- Name: SCHEMA "public"; Type: ACL; Schema: -; Owner: postgres
--

REVOKE USAGE ON SCHEMA "public" FROM PUBLIC;
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT ALL ON SCHEMA "public" TO "service_role";
GRANT USAGE ON SCHEMA "public" TO "supabase_auth_admin";


--
-- Name: FUNCTION "add_recipe_tip"("p_recipe_id" "uuid", "p_body" "text", "p_image_url" "text"); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."add_recipe_tip"("p_recipe_id" "uuid", "p_body" "text", "p_image_url" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."add_recipe_tip"("p_recipe_id" "uuid", "p_body" "text", "p_image_url" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."add_recipe_tip"("p_recipe_id" "uuid", "p_body" "text", "p_image_url" "text") TO "service_role";


--
-- Name: FUNCTION "add_recipe_to_my_shopping_list"("p_recipe_id" "uuid", "p_target_servings" numeric); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."add_recipe_to_my_shopping_list"("p_recipe_id" "uuid", "p_target_servings" numeric) TO "anon";
GRANT ALL ON FUNCTION "public"."add_recipe_to_my_shopping_list"("p_recipe_id" "uuid", "p_target_servings" numeric) TO "authenticated";
GRANT ALL ON FUNCTION "public"."add_recipe_to_my_shopping_list"("p_recipe_id" "uuid", "p_target_servings" numeric) TO "service_role";


--
-- Name: FUNCTION "add_recipe_to_shopping_list"("p_recipe_id" "uuid", "p_list_id" "uuid", "p_target_servings" numeric); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."add_recipe_to_shopping_list"("p_recipe_id" "uuid", "p_list_id" "uuid", "p_target_servings" numeric) TO "anon";
GRANT ALL ON FUNCTION "public"."add_recipe_to_shopping_list"("p_recipe_id" "uuid", "p_list_id" "uuid", "p_target_servings" numeric) TO "authenticated";
GRANT ALL ON FUNCTION "public"."add_recipe_to_shopping_list"("p_recipe_id" "uuid", "p_list_id" "uuid", "p_target_servings" numeric) TO "service_role";


--
-- Name: FUNCTION "add_tip_reply"("p_tip_id" "uuid", "p_body" "text"); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."add_tip_reply"("p_tip_id" "uuid", "p_body" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."add_tip_reply"("p_tip_id" "uuid", "p_body" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."add_tip_reply"("p_tip_id" "uuid", "p_body" "text") TO "service_role";


--
-- Name: FUNCTION "add_to_collection"("p_collection_id" "uuid", "p_recipe_id" "uuid"); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."add_to_collection"("p_collection_id" "uuid", "p_recipe_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."add_to_collection"("p_collection_id" "uuid", "p_recipe_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."add_to_collection"("p_collection_id" "uuid", "p_recipe_id" "uuid") TO "service_role";


--
-- Name: FUNCTION "admin_delete_recipe"("p_recipe_id" "uuid", "p_reason" "text"); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."admin_delete_recipe"("p_recipe_id" "uuid", "p_reason" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."admin_delete_recipe"("p_recipe_id" "uuid", "p_reason" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."admin_delete_recipe"("p_recipe_id" "uuid", "p_reason" "text") TO "service_role";


--
-- Name: FUNCTION "admin_engagement_stats"("p_days" integer, "lim" integer); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."admin_engagement_stats"("p_days" integer, "lim" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."admin_engagement_stats"("p_days" integer, "lim" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."admin_engagement_stats"("p_days" integer, "lim" integer) TO "service_role";


--
-- Name: FUNCTION "admin_grant_role"("p_user_id" "uuid", "p_role" "public"."app_role"); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."admin_grant_role"("p_user_id" "uuid", "p_role" "public"."app_role") TO "anon";
GRANT ALL ON FUNCTION "public"."admin_grant_role"("p_user_id" "uuid", "p_role" "public"."app_role") TO "authenticated";
GRANT ALL ON FUNCTION "public"."admin_grant_role"("p_user_id" "uuid", "p_role" "public"."app_role") TO "service_role";


--
-- Name: FUNCTION "admin_growth_stats"("p_days" integer); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."admin_growth_stats"("p_days" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."admin_growth_stats"("p_days" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."admin_growth_stats"("p_days" integer) TO "service_role";


--
-- Name: FUNCTION "admin_moderation_stats"("p_days" integer); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."admin_moderation_stats"("p_days" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."admin_moderation_stats"("p_days" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."admin_moderation_stats"("p_days" integer) TO "service_role";


--
-- Name: FUNCTION "admin_revoke_role"("p_user_id" "uuid", "p_role" "public"."app_role"); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."admin_revoke_role"("p_user_id" "uuid", "p_role" "public"."app_role") TO "anon";
GRANT ALL ON FUNCTION "public"."admin_revoke_role"("p_user_id" "uuid", "p_role" "public"."app_role") TO "authenticated";
GRANT ALL ON FUNCTION "public"."admin_revoke_role"("p_user_id" "uuid", "p_role" "public"."app_role") TO "service_role";


--
-- Name: FUNCTION "admin_search_recipes"("q" "text", "lim" integer); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."admin_search_recipes"("q" "text", "lim" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."admin_search_recipes"("q" "text", "lim" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."admin_search_recipes"("q" "text", "lim" integer) TO "service_role";


--
-- Name: FUNCTION "admin_update_moderation_settings"("p_auto_hide_threshold" integer, "p_reports_per_day_limit" integer, "p_require_first_post_review" boolean); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."admin_update_moderation_settings"("p_auto_hide_threshold" integer, "p_reports_per_day_limit" integer, "p_require_first_post_review" boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."admin_update_moderation_settings"("p_auto_hide_threshold" integer, "p_reports_per_day_limit" integer, "p_require_first_post_review" boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."admin_update_moderation_settings"("p_auto_hide_threshold" integer, "p_reports_per_day_limit" integer, "p_require_first_post_review" boolean) TO "service_role";


--
-- Name: FUNCTION "after_block"(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."after_block"() TO "anon";
GRANT ALL ON FUNCTION "public"."after_block"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."after_block"() TO "service_role";


--
-- Name: FUNCTION "after_collection_created"(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."after_collection_created"() TO "anon";
GRANT ALL ON FUNCTION "public"."after_collection_created"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."after_collection_created"() TO "service_role";


--
-- Name: FUNCTION "after_collection_follow"(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."after_collection_follow"() TO "anon";
GRANT ALL ON FUNCTION "public"."after_collection_follow"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."after_collection_follow"() TO "service_role";


--
-- Name: FUNCTION "after_collection_recipe"(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."after_collection_recipe"() TO "anon";
GRANT ALL ON FUNCTION "public"."after_collection_recipe"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."after_collection_recipe"() TO "service_role";


--
-- Name: FUNCTION "after_follow_change"(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."after_follow_change"() TO "anon";
GRANT ALL ON FUNCTION "public"."after_follow_change"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."after_follow_change"() TO "service_role";


--
-- Name: FUNCTION "after_rating_change"(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."after_rating_change"() TO "anon";
GRANT ALL ON FUNCTION "public"."after_rating_change"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."after_rating_change"() TO "service_role";


--
-- Name: FUNCTION "after_recipe_change"(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."after_recipe_change"() TO "anon";
GRANT ALL ON FUNCTION "public"."after_recipe_change"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."after_recipe_change"() TO "service_role";


--
-- Name: FUNCTION "after_report_insert"(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."after_report_insert"() TO "anon";
GRANT ALL ON FUNCTION "public"."after_report_insert"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."after_report_insert"() TO "service_role";


--
-- Name: FUNCTION "after_save_change"(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."after_save_change"() TO "anon";
GRANT ALL ON FUNCTION "public"."after_save_change"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."after_save_change"() TO "service_role";


--
-- Name: FUNCTION "after_tip_change"(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."after_tip_change"() TO "anon";
GRANT ALL ON FUNCTION "public"."after_tip_change"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."after_tip_change"() TO "service_role";


--
-- Name: FUNCTION "after_tip_like"(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."after_tip_like"() TO "anon";
GRANT ALL ON FUNCTION "public"."after_tip_like"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."after_tip_like"() TO "service_role";


--
-- Name: FUNCTION "after_tip_reply"(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."after_tip_reply"() TO "anon";
GRANT ALL ON FUNCTION "public"."after_tip_reply"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."after_tip_reply"() TO "service_role";


--
-- Name: FUNCTION "after_view_insert"(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."after_view_insert"() TO "anon";
GRANT ALL ON FUNCTION "public"."after_view_insert"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."after_view_insert"() TO "service_role";


--
-- Name: FUNCTION "before_follow"(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."before_follow"() TO "anon";
GRANT ALL ON FUNCTION "public"."before_follow"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."before_follow"() TO "service_role";


--
-- Name: FUNCTION "can_edit_collection"("cid" "uuid"); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."can_edit_collection"("cid" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."can_edit_collection"("cid" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."can_edit_collection"("cid" "uuid") TO "service_role";


--
-- Name: FUNCTION "can_view_collection"("cid" "uuid"); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."can_view_collection"("cid" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."can_view_collection"("cid" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."can_view_collection"("cid" "uuid") TO "service_role";


--
-- Name: FUNCTION "can_view_profile"("pid" "uuid"); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."can_view_profile"("pid" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."can_view_profile"("pid" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."can_view_profile"("pid" "uuid") TO "service_role";


--
-- Name: FUNCTION "can_view_recipe"("rid" "uuid"); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."can_view_recipe"("rid" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."can_view_recipe"("rid" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."can_view_recipe"("rid" "uuid") TO "service_role";


--
-- Name: FUNCTION "community_feed"("lim" integer); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."community_feed"("lim" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."community_feed"("lim" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."community_feed"("lim" integer) TO "service_role";


--
-- Name: FUNCTION "custom_access_token_hook"("event" "jsonb"); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION "public"."custom_access_token_hook"("event" "jsonb") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."custom_access_token_hook"("event" "jsonb") TO "service_role";
GRANT ALL ON FUNCTION "public"."custom_access_token_hook"("event" "jsonb") TO "supabase_auth_admin";


--
-- Name: FUNCTION "featured_collections"("lim" integer); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."featured_collections"("lim" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."featured_collections"("lim" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."featured_collections"("lim" integer) TO "service_role";


--
-- Name: FUNCTION "following_feed"("lim" integer, "before_ts" timestamp with time zone); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."following_feed"("lim" integer, "before_ts" timestamp with time zone) TO "anon";
GRANT ALL ON FUNCTION "public"."following_feed"("lim" integer, "before_ts" timestamp with time zone) TO "authenticated";
GRANT ALL ON FUNCTION "public"."following_feed"("lim" integer, "before_ts" timestamp with time zone) TO "service_role";


--
-- Name: FUNCTION "gate_recipe_publish"(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."gate_recipe_publish"() TO "anon";
GRANT ALL ON FUNCTION "public"."gate_recipe_publish"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."gate_recipe_publish"() TO "service_role";


--
-- Name: FUNCTION "get_email_by_username"("p_username" "text"); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."get_email_by_username"("p_username" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."get_email_by_username"("p_username" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_email_by_username"("p_username" "text") TO "service_role";


--
-- Name: FUNCTION "get_my_notifications"("lim" integer, "before_ts" timestamp with time zone); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."get_my_notifications"("lim" integer, "before_ts" timestamp with time zone) TO "anon";
GRANT ALL ON FUNCTION "public"."get_my_notifications"("lim" integer, "before_ts" timestamp with time zone) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_my_notifications"("lim" integer, "before_ts" timestamp with time zone) TO "service_role";


--
-- Name: FUNCTION "get_public_profile"("p_username" "text"); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."get_public_profile"("p_username" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."get_public_profile"("p_username" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_public_profile"("p_username" "text") TO "service_role";


--
-- Name: FUNCTION "get_recipe_detail"("p_slug" "text"); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."get_recipe_detail"("p_slug" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."get_recipe_detail"("p_slug" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_recipe_detail"("p_slug" "text") TO "service_role";


--
-- Name: FUNCTION "get_tag_by_slug"("p_slug" "text", "p_type" "public"."tag_type"); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."get_tag_by_slug"("p_slug" "text", "p_type" "public"."tag_type") TO "anon";
GRANT ALL ON FUNCTION "public"."get_tag_by_slug"("p_slug" "text", "p_type" "public"."tag_type") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_tag_by_slug"("p_slug" "text", "p_type" "public"."tag_type") TO "service_role";


--
-- Name: FUNCTION "get_tip_replies"("p_tip_id" "uuid"); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."get_tip_replies"("p_tip_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_tip_replies"("p_tip_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_tip_replies"("p_tip_id" "uuid") TO "service_role";


--
-- Name: FUNCTION "handle_new_user"(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";


--
-- Name: FUNCTION "is_active"(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."is_active"() TO "anon";
GRANT ALL ON FUNCTION "public"."is_active"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_active"() TO "service_role";


--
-- Name: FUNCTION "is_admin"(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."is_admin"() TO "anon";
GRANT ALL ON FUNCTION "public"."is_admin"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_admin"() TO "service_role";


--
-- Name: FUNCTION "is_blocked_with"("other" "uuid"); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."is_blocked_with"("other" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."is_blocked_with"("other" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_blocked_with"("other" "uuid") TO "service_role";


--
-- Name: FUNCTION "is_moderator"(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."is_moderator"() TO "anon";
GRANT ALL ON FUNCTION "public"."is_moderator"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_moderator"() TO "service_role";


--
-- Name: FUNCTION "log_action"("p_action" "text", "p_target_type" "public"."target_type", "p_target_id" "uuid", "p_reason" "text", "p_metadata" "jsonb"); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."log_action"("p_action" "text", "p_target_type" "public"."target_type", "p_target_id" "uuid", "p_reason" "text", "p_metadata" "jsonb") TO "service_role";


--
-- Name: FUNCTION "log_recipe_view"("p_recipe_id" "uuid", "p_source" "text"); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."log_recipe_view"("p_recipe_id" "uuid", "p_source" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."log_recipe_view"("p_recipe_id" "uuid", "p_source" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."log_recipe_view"("p_recipe_id" "uuid", "p_source" "text") TO "service_role";


--
-- Name: FUNCTION "mark_all_notifications_read"(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."mark_all_notifications_read"() TO "anon";
GRANT ALL ON FUNCTION "public"."mark_all_notifications_read"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."mark_all_notifications_read"() TO "service_role";


--
-- Name: FUNCTION "mark_notification_read"("p_id" "uuid"); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."mark_notification_read"("p_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."mark_notification_read"("p_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."mark_notification_read"("p_id" "uuid") TO "service_role";


--
-- Name: FUNCTION "mod_approve_recipe"("p_recipe_id" "uuid", "p_trust_author" boolean); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."mod_approve_recipe"("p_recipe_id" "uuid", "p_trust_author" boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."mod_approve_recipe"("p_recipe_id" "uuid", "p_trust_author" boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."mod_approve_recipe"("p_recipe_id" "uuid", "p_trust_author" boolean) TO "service_role";


--
-- Name: FUNCTION "mod_reject_recipe"("p_recipe_id" "uuid", "p_reason" "text"); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."mod_reject_recipe"("p_recipe_id" "uuid", "p_reason" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."mod_reject_recipe"("p_recipe_id" "uuid", "p_reason" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."mod_reject_recipe"("p_recipe_id" "uuid", "p_reason" "text") TO "service_role";


--
-- Name: FUNCTION "mod_report_queue"("p_state" "public"."report_state", "lim" integer); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."mod_report_queue"("p_state" "public"."report_state", "lim" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."mod_report_queue"("p_state" "public"."report_state", "lim" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."mod_report_queue"("p_state" "public"."report_state", "lim" integer) TO "service_role";


--
-- Name: FUNCTION "mod_resolve_report"("p_report_id" "uuid", "p_state" "public"."report_state", "p_resolution" "text"); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."mod_resolve_report"("p_report_id" "uuid", "p_state" "public"."report_state", "p_resolution" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."mod_resolve_report"("p_report_id" "uuid", "p_state" "public"."report_state", "p_resolution" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."mod_resolve_report"("p_report_id" "uuid", "p_state" "public"."report_state", "p_resolution" "text") TO "service_role";


--
-- Name: TABLE "recipes"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."recipes" TO "anon";
GRANT ALL ON TABLE "public"."recipes" TO "authenticated";
GRANT ALL ON TABLE "public"."recipes" TO "service_role";


--
-- Name: FUNCTION "mod_review_queue"("lim" integer); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."mod_review_queue"("lim" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."mod_review_queue"("lim" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."mod_review_queue"("lim" integer) TO "service_role";


--
-- Name: FUNCTION "mod_search_hidden_recipes"("q" "text", "lim" integer); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."mod_search_hidden_recipes"("q" "text", "lim" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."mod_search_hidden_recipes"("q" "text", "lim" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."mod_search_hidden_recipes"("q" "text", "lim" integer) TO "service_role";


--
-- Name: FUNCTION "mod_set_collection_hidden"("p_collection_id" "uuid", "p_hidden" boolean, "p_reason" "text"); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."mod_set_collection_hidden"("p_collection_id" "uuid", "p_hidden" boolean, "p_reason" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."mod_set_collection_hidden"("p_collection_id" "uuid", "p_hidden" boolean, "p_reason" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."mod_set_collection_hidden"("p_collection_id" "uuid", "p_hidden" boolean, "p_reason" "text") TO "service_role";


--
-- Name: FUNCTION "mod_set_featured"("p_recipe_id" "uuid", "p_featured" boolean); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."mod_set_featured"("p_recipe_id" "uuid", "p_featured" boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."mod_set_featured"("p_recipe_id" "uuid", "p_featured" boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."mod_set_featured"("p_recipe_id" "uuid", "p_featured" boolean) TO "service_role";


--
-- Name: FUNCTION "mod_set_recipe_hidden"("p_recipe_id" "uuid", "p_hidden" boolean, "p_reason" "text"); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."mod_set_recipe_hidden"("p_recipe_id" "uuid", "p_hidden" boolean, "p_reason" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."mod_set_recipe_hidden"("p_recipe_id" "uuid", "p_hidden" boolean, "p_reason" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."mod_set_recipe_hidden"("p_recipe_id" "uuid", "p_hidden" boolean, "p_reason" "text") TO "service_role";


--
-- Name: FUNCTION "mod_set_reply_hidden"("p_reply_id" "uuid", "p_hidden" boolean, "p_reason" "text"); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."mod_set_reply_hidden"("p_reply_id" "uuid", "p_hidden" boolean, "p_reason" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."mod_set_reply_hidden"("p_reply_id" "uuid", "p_hidden" boolean, "p_reason" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."mod_set_reply_hidden"("p_reply_id" "uuid", "p_hidden" boolean, "p_reason" "text") TO "service_role";


--
-- Name: FUNCTION "mod_set_tip_hidden"("p_tip_id" "uuid", "p_hidden" boolean, "p_reason" "text"); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."mod_set_tip_hidden"("p_tip_id" "uuid", "p_hidden" boolean, "p_reason" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."mod_set_tip_hidden"("p_tip_id" "uuid", "p_hidden" boolean, "p_reason" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."mod_set_tip_hidden"("p_tip_id" "uuid", "p_hidden" boolean, "p_reason" "text") TO "service_role";


--
-- Name: FUNCTION "mod_set_trusted"("p_user_id" "uuid", "p_trusted" boolean, "p_reason" "text"); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."mod_set_trusted"("p_user_id" "uuid", "p_trusted" boolean, "p_reason" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."mod_set_trusted"("p_user_id" "uuid", "p_trusted" boolean, "p_reason" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."mod_set_trusted"("p_user_id" "uuid", "p_trusted" boolean, "p_reason" "text") TO "service_role";


--
-- Name: FUNCTION "mod_suspend_user"("p_user_id" "uuid", "p_days" integer, "p_reason" "text"); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."mod_suspend_user"("p_user_id" "uuid", "p_days" integer, "p_reason" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."mod_suspend_user"("p_user_id" "uuid", "p_days" integer, "p_reason" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."mod_suspend_user"("p_user_id" "uuid", "p_days" integer, "p_reason" "text") TO "service_role";


--
-- Name: FUNCTION "mod_unsuspend_user"("p_user_id" "uuid", "p_reason" "text"); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."mod_unsuspend_user"("p_user_id" "uuid", "p_reason" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."mod_unsuspend_user"("p_user_id" "uuid", "p_reason" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."mod_unsuspend_user"("p_user_id" "uuid", "p_reason" "text") TO "service_role";


--
-- Name: FUNCTION "mod_upsert_ingredient"("p_name" "text", "p_slug" "text", "p_aisle" "text", "p_is_allergen" boolean, "p_image_url" "text"); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."mod_upsert_ingredient"("p_name" "text", "p_slug" "text", "p_aisle" "text", "p_is_allergen" boolean, "p_image_url" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."mod_upsert_ingredient"("p_name" "text", "p_slug" "text", "p_aisle" "text", "p_is_allergen" boolean, "p_image_url" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."mod_upsert_ingredient"("p_name" "text", "p_slug" "text", "p_aisle" "text", "p_is_allergen" boolean, "p_image_url" "text") TO "service_role";


--
-- Name: FUNCTION "mod_upsert_tag"("p_type" "public"."tag_type", "p_name" "text", "p_slug" "text", "p_image_url" "text", "p_position" integer); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."mod_upsert_tag"("p_type" "public"."tag_type", "p_name" "text", "p_slug" "text", "p_image_url" "text", "p_position" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."mod_upsert_tag"("p_type" "public"."tag_type", "p_name" "text", "p_slug" "text", "p_image_url" "text", "p_position" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."mod_upsert_tag"("p_type" "public"."tag_type", "p_name" "text", "p_slug" "text", "p_image_url" "text", "p_position" integer) TO "service_role";


--
-- Name: FUNCTION "my_account_status"(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."my_account_status"() TO "anon";
GRANT ALL ON FUNCTION "public"."my_account_status"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."my_account_status"() TO "service_role";


--
-- Name: FUNCTION "my_collections_for_recipe"("p_recipe_id" "uuid"); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."my_collections_for_recipe"("p_recipe_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."my_collections_for_recipe"("p_recipe_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."my_collections_for_recipe"("p_recipe_id" "uuid") TO "service_role";


--
-- Name: FUNCTION "my_role"(); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION "public"."my_role"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."my_role"() TO "anon";
GRANT ALL ON FUNCTION "public"."my_role"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."my_role"() TO "service_role";


--
-- Name: FUNCTION "new_from_following_recipes"("lim" integer); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."new_from_following_recipes"("lim" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."new_from_following_recipes"("lim" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."new_from_following_recipes"("lim" integer) TO "service_role";


--
-- Name: FUNCTION "owns_recipe"("rid" "uuid"); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."owns_recipe"("rid" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."owns_recipe"("rid" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."owns_recipe"("rid" "uuid") TO "service_role";


--
-- Name: FUNCTION "popular_tags"("p_type" "public"."tag_type", "lim" integer); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."popular_tags"("p_type" "public"."tag_type", "lim" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."popular_tags"("p_type" "public"."tag_type", "lim" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."popular_tags"("p_type" "public"."tag_type", "lim" integer) TO "service_role";


--
-- Name: FUNCTION "protect_collection_columns"(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."protect_collection_columns"() TO "anon";
GRANT ALL ON FUNCTION "public"."protect_collection_columns"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."protect_collection_columns"() TO "service_role";


--
-- Name: FUNCTION "protect_profile_columns"(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."protect_profile_columns"() TO "anon";
GRANT ALL ON FUNCTION "public"."protect_profile_columns"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."protect_profile_columns"() TO "service_role";


--
-- Name: FUNCTION "protect_recipe_columns"(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."protect_recipe_columns"() TO "anon";
GRANT ALL ON FUNCTION "public"."protect_recipe_columns"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."protect_recipe_columns"() TO "service_role";


--
-- Name: FUNCTION "protect_reply_columns"(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."protect_reply_columns"() TO "anon";
GRANT ALL ON FUNCTION "public"."protect_reply_columns"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."protect_reply_columns"() TO "service_role";


--
-- Name: FUNCTION "protect_tip_columns"(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."protect_tip_columns"() TO "anon";
GRANT ALL ON FUNCTION "public"."protect_tip_columns"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."protect_tip_columns"() TO "service_role";


--
-- Name: FUNCTION "quick_recipes"("max_minutes" integer, "lim" integer); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."quick_recipes"("max_minutes" integer, "lim" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."quick_recipes"("max_minutes" integer, "lim" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."quick_recipes"("max_minutes" integer, "lim" integer) TO "service_role";


--
-- Name: FUNCTION "random_recipes"("lim" integer); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."random_recipes"("lim" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."random_recipes"("lim" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."random_recipes"("lim" integer) TO "service_role";


--
-- Name: FUNCTION "rate_recipe"("p_recipe_id" "uuid", "p_rating" smallint); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."rate_recipe"("p_recipe_id" "uuid", "p_rating" smallint) TO "anon";
GRANT ALL ON FUNCTION "public"."rate_recipe"("p_recipe_id" "uuid", "p_rating" smallint) TO "authenticated";
GRANT ALL ON FUNCTION "public"."rate_recipe"("p_recipe_id" "uuid", "p_rating" smallint) TO "service_role";


--
-- Name: FUNCTION "recipes_by_tag"("p_slug" "text", "p_type" "public"."tag_type", "lim" integer, "off" integer); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."recipes_by_tag"("p_slug" "text", "p_type" "public"."tag_type", "lim" integer, "off" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."recipes_by_tag"("p_slug" "text", "p_type" "public"."tag_type", "lim" integer, "off" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."recipes_by_tag"("p_slug" "text", "p_type" "public"."tag_type", "lim" integer, "off" integer) TO "service_role";


--
-- Name: FUNCTION "recipes_from_pantry"("min_match_pct" numeric, "lim" integer); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."recipes_from_pantry"("min_match_pct" numeric, "lim" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."recipes_from_pantry"("min_match_pct" numeric, "lim" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."recipes_from_pantry"("min_match_pct" numeric, "lim" integer) TO "service_role";


--
-- Name: FUNCTION "recipes_from_pantry_for_home"("min_match_pct" numeric, "lim" integer); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."recipes_from_pantry_for_home"("min_match_pct" numeric, "lim" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."recipes_from_pantry_for_home"("min_match_pct" numeric, "lim" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."recipes_from_pantry_for_home"("min_match_pct" numeric, "lim" integer) TO "service_role";


--
-- Name: FUNCTION "recommended_for_you"("lim" integer); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."recommended_for_you"("lim" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."recommended_for_you"("lim" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."recommended_for_you"("lim" integer) TO "service_role";


--
-- Name: FUNCTION "remove_from_collection"("p_collection_id" "uuid", "p_recipe_id" "uuid"); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."remove_from_collection"("p_collection_id" "uuid", "p_recipe_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."remove_from_collection"("p_collection_id" "uuid", "p_recipe_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."remove_from_collection"("p_collection_id" "uuid", "p_recipe_id" "uuid") TO "service_role";


--
-- Name: FUNCTION "reorder_collection"("p_collection_id" "uuid", "p_recipe_ids" "uuid"[]); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."reorder_collection"("p_collection_id" "uuid", "p_recipe_ids" "uuid"[]) TO "anon";
GRANT ALL ON FUNCTION "public"."reorder_collection"("p_collection_id" "uuid", "p_recipe_ids" "uuid"[]) TO "authenticated";
GRANT ALL ON FUNCTION "public"."reorder_collection"("p_collection_id" "uuid", "p_recipe_ids" "uuid"[]) TO "service_role";


--
-- Name: FUNCTION "report_content"("p_target_type" "public"."target_type", "p_target_id" "uuid", "p_reason" "public"."report_reason", "p_detail" "text"); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."report_content"("p_target_type" "public"."target_type", "p_target_id" "uuid", "p_reason" "public"."report_reason", "p_detail" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."report_content"("p_target_type" "public"."target_type", "p_target_id" "uuid", "p_reason" "public"."report_reason", "p_detail" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."report_content"("p_target_type" "public"."target_type", "p_target_id" "uuid", "p_reason" "public"."report_reason", "p_detail" "text") TO "service_role";


--
-- Name: FUNCTION "require_admin"(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."require_admin"() TO "anon";
GRANT ALL ON FUNCTION "public"."require_admin"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."require_admin"() TO "service_role";


--
-- Name: FUNCTION "require_moderator"(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."require_moderator"() TO "anon";
GRANT ALL ON FUNCTION "public"."require_moderator"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."require_moderator"() TO "service_role";


--
-- Name: FUNCTION "search_all"("q" "text", "lim" integer); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."search_all"("q" "text", "lim" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."search_all"("q" "text", "lim" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."search_all"("q" "text", "lim" integer) TO "service_role";


--
-- Name: FUNCTION "search_public_collections"("q" "text", "lim" integer, "off" integer); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."search_public_collections"("q" "text", "lim" integer, "off" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."search_public_collections"("q" "text", "lim" integer, "off" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."search_public_collections"("q" "text", "lim" integer, "off" integer) TO "service_role";


--
-- Name: FUNCTION "search_recipes"("q" "text", "lim" integer, "off" integer); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."search_recipes"("q" "text", "lim" integer, "off" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."search_recipes"("q" "text", "lim" integer, "off" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."search_recipes"("q" "text", "lim" integer, "off" integer) TO "service_role";


--
-- Name: FUNCTION "suggested_users"("lim" integer); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."suggested_users"("lim" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."suggested_users"("lim" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."suggested_users"("lim" integer) TO "service_role";


--
-- Name: FUNCTION "toggle_follow"("p_user_id" "uuid"); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."toggle_follow"("p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."toggle_follow"("p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."toggle_follow"("p_user_id" "uuid") TO "service_role";


--
-- Name: FUNCTION "toggle_save_recipe"("p_recipe_id" "uuid"); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."toggle_save_recipe"("p_recipe_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."toggle_save_recipe"("p_recipe_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."toggle_save_recipe"("p_recipe_id" "uuid") TO "service_role";


--
-- Name: FUNCTION "toggle_tip_like"("p_tip_id" "uuid"); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."toggle_tip_like"("p_tip_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."toggle_tip_like"("p_tip_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."toggle_tip_like"("p_tip_id" "uuid") TO "service_role";


--
-- Name: FUNCTION "touch_updated_at"(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."touch_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."touch_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."touch_updated_at"() TO "service_role";


--
-- Name: FUNCTION "trending_recipes"("lim" integer, "days" integer); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."trending_recipes"("lim" integer, "days" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."trending_recipes"("lim" integer, "days" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."trending_recipes"("lim" integer, "days" integer) TO "service_role";


--
-- Name: FUNCTION "unread_notification_count"(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."unread_notification_count"() TO "anon";
GRANT ALL ON FUNCTION "public"."unread_notification_count"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."unread_notification_count"() TO "service_role";


--
-- Name: TABLE "activity_events"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."activity_events" TO "anon";
GRANT ALL ON TABLE "public"."activity_events" TO "authenticated";
GRANT ALL ON TABLE "public"."activity_events" TO "service_role";


--
-- Name: SEQUENCE "activity_events_id_seq"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE "public"."activity_events_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."activity_events_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."activity_events_id_seq" TO "service_role";


--
-- Name: TABLE "audit_log"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."audit_log" TO "anon";
GRANT ALL ON TABLE "public"."audit_log" TO "authenticated";
GRANT ALL ON TABLE "public"."audit_log" TO "service_role";


--
-- Name: SEQUENCE "audit_log_id_seq"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE "public"."audit_log_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."audit_log_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."audit_log_id_seq" TO "service_role";


--
-- Name: TABLE "blocks"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."blocks" TO "anon";
GRANT ALL ON TABLE "public"."blocks" TO "authenticated";
GRANT ALL ON TABLE "public"."blocks" TO "service_role";


--
-- Name: TABLE "collection_followers"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."collection_followers" TO "anon";
GRANT ALL ON TABLE "public"."collection_followers" TO "authenticated";
GRANT ALL ON TABLE "public"."collection_followers" TO "service_role";


--
-- Name: TABLE "collection_recipes"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."collection_recipes" TO "anon";
GRANT ALL ON TABLE "public"."collection_recipes" TO "authenticated";
GRANT ALL ON TABLE "public"."collection_recipes" TO "service_role";


--
-- Name: TABLE "collections"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."collections" TO "anon";
GRANT ALL ON TABLE "public"."collections" TO "authenticated";
GRANT ALL ON TABLE "public"."collections" TO "service_role";


--
-- Name: TABLE "follows"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."follows" TO "anon";
GRANT ALL ON TABLE "public"."follows" TO "authenticated";
GRANT ALL ON TABLE "public"."follows" TO "service_role";


--
-- Name: TABLE "ingredient_substitutes"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."ingredient_substitutes" TO "anon";
GRANT ALL ON TABLE "public"."ingredient_substitutes" TO "authenticated";
GRANT ALL ON TABLE "public"."ingredient_substitutes" TO "service_role";


--
-- Name: TABLE "ingredients"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."ingredients" TO "anon";
GRANT ALL ON TABLE "public"."ingredients" TO "authenticated";
GRANT ALL ON TABLE "public"."ingredients" TO "service_role";


--
-- Name: TABLE "meal_plans"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."meal_plans" TO "anon";
GRANT ALL ON TABLE "public"."meal_plans" TO "authenticated";
GRANT ALL ON TABLE "public"."meal_plans" TO "service_role";


--
-- Name: TABLE "moderation_settings"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."moderation_settings" TO "anon";
GRANT ALL ON TABLE "public"."moderation_settings" TO "authenticated";
GRANT ALL ON TABLE "public"."moderation_settings" TO "service_role";


--
-- Name: TABLE "notification_settings"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."notification_settings" TO "anon";
GRANT ALL ON TABLE "public"."notification_settings" TO "authenticated";
GRANT ALL ON TABLE "public"."notification_settings" TO "service_role";


--
-- Name: TABLE "notifications"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."notifications" TO "anon";
GRANT ALL ON TABLE "public"."notifications" TO "authenticated";
GRANT ALL ON TABLE "public"."notifications" TO "service_role";


--
-- Name: TABLE "profiles"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."profiles" TO "anon";
GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";


--
-- Name: TABLE "push_tokens"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."push_tokens" TO "anon";
GRANT ALL ON TABLE "public"."push_tokens" TO "authenticated";
GRANT ALL ON TABLE "public"."push_tokens" TO "service_role";


--
-- Name: TABLE "recipe_ingredients"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."recipe_ingredients" TO "anon";
GRANT ALL ON TABLE "public"."recipe_ingredients" TO "authenticated";
GRANT ALL ON TABLE "public"."recipe_ingredients" TO "service_role";


--
-- Name: TABLE "recipe_media"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."recipe_media" TO "anon";
GRANT ALL ON TABLE "public"."recipe_media" TO "authenticated";
GRANT ALL ON TABLE "public"."recipe_media" TO "service_role";


--
-- Name: TABLE "recipe_nutrition"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."recipe_nutrition" TO "anon";
GRANT ALL ON TABLE "public"."recipe_nutrition" TO "authenticated";
GRANT ALL ON TABLE "public"."recipe_nutrition" TO "service_role";


--
-- Name: TABLE "recipe_ratings"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."recipe_ratings" TO "anon";
GRANT ALL ON TABLE "public"."recipe_ratings" TO "authenticated";
GRANT ALL ON TABLE "public"."recipe_ratings" TO "service_role";


--
-- Name: TABLE "recipe_sections"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."recipe_sections" TO "anon";
GRANT ALL ON TABLE "public"."recipe_sections" TO "authenticated";
GRANT ALL ON TABLE "public"."recipe_sections" TO "service_role";


--
-- Name: TABLE "recipe_steps"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."recipe_steps" TO "anon";
GRANT ALL ON TABLE "public"."recipe_steps" TO "authenticated";
GRANT ALL ON TABLE "public"."recipe_steps" TO "service_role";


--
-- Name: TABLE "recipe_tags"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."recipe_tags" TO "anon";
GRANT ALL ON TABLE "public"."recipe_tags" TO "authenticated";
GRANT ALL ON TABLE "public"."recipe_tags" TO "service_role";


--
-- Name: TABLE "recipe_tips"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."recipe_tips" TO "anon";
GRANT ALL ON TABLE "public"."recipe_tips" TO "authenticated";
GRANT ALL ON TABLE "public"."recipe_tips" TO "service_role";


--
-- Name: TABLE "recipe_views"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."recipe_views" TO "anon";
GRANT ALL ON TABLE "public"."recipe_views" TO "authenticated";
GRANT ALL ON TABLE "public"."recipe_views" TO "service_role";


--
-- Name: SEQUENCE "recipe_views_id_seq"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE "public"."recipe_views_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."recipe_views_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."recipe_views_id_seq" TO "service_role";


--
-- Name: TABLE "reports"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."reports" TO "anon";
GRANT ALL ON TABLE "public"."reports" TO "authenticated";
GRANT ALL ON TABLE "public"."reports" TO "service_role";


--
-- Name: TABLE "saved_recipes"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."saved_recipes" TO "anon";
GRANT ALL ON TABLE "public"."saved_recipes" TO "authenticated";
GRANT ALL ON TABLE "public"."saved_recipes" TO "service_role";


--
-- Name: TABLE "search_history"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."search_history" TO "anon";
GRANT ALL ON TABLE "public"."search_history" TO "authenticated";
GRANT ALL ON TABLE "public"."search_history" TO "service_role";


--
-- Name: SEQUENCE "search_history_id_seq"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE "public"."search_history_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."search_history_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."search_history_id_seq" TO "service_role";


--
-- Name: TABLE "shopping_list_items"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."shopping_list_items" TO "anon";
GRANT ALL ON TABLE "public"."shopping_list_items" TO "authenticated";
GRANT ALL ON TABLE "public"."shopping_list_items" TO "service_role";


--
-- Name: TABLE "shopping_lists"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."shopping_lists" TO "anon";
GRANT ALL ON TABLE "public"."shopping_lists" TO "authenticated";
GRANT ALL ON TABLE "public"."shopping_lists" TO "service_role";


--
-- Name: TABLE "suspensions"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."suspensions" TO "anon";
GRANT ALL ON TABLE "public"."suspensions" TO "authenticated";
GRANT ALL ON TABLE "public"."suspensions" TO "service_role";


--
-- Name: TABLE "tags"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."tags" TO "anon";
GRANT ALL ON TABLE "public"."tags" TO "authenticated";
GRANT ALL ON TABLE "public"."tags" TO "service_role";


--
-- Name: TABLE "tip_likes"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."tip_likes" TO "anon";
GRANT ALL ON TABLE "public"."tip_likes" TO "authenticated";
GRANT ALL ON TABLE "public"."tip_likes" TO "service_role";


--
-- Name: TABLE "tip_replies"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."tip_replies" TO "anon";
GRANT ALL ON TABLE "public"."tip_replies" TO "authenticated";
GRANT ALL ON TABLE "public"."tip_replies" TO "service_role";


--
-- Name: TABLE "unit_conversions"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."unit_conversions" TO "anon";
GRANT ALL ON TABLE "public"."unit_conversions" TO "authenticated";
GRANT ALL ON TABLE "public"."unit_conversions" TO "service_role";


--
-- Name: TABLE "user_allergens"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."user_allergens" TO "anon";
GRANT ALL ON TABLE "public"."user_allergens" TO "authenticated";
GRANT ALL ON TABLE "public"."user_allergens" TO "service_role";


--
-- Name: TABLE "user_pantry"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."user_pantry" TO "anon";
GRANT ALL ON TABLE "public"."user_pantry" TO "authenticated";
GRANT ALL ON TABLE "public"."user_pantry" TO "service_role";


--
-- Name: TABLE "user_preferences"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."user_preferences" TO "anon";
GRANT ALL ON TABLE "public"."user_preferences" TO "authenticated";
GRANT ALL ON TABLE "public"."user_preferences" TO "service_role";


--
-- Name: TABLE "user_roles"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."user_roles" TO "anon";
GRANT ALL ON TABLE "public"."user_roles" TO "authenticated";
GRANT ALL ON TABLE "public"."user_roles" TO "service_role";
GRANT SELECT ON TABLE "public"."user_roles" TO "supabase_auth_admin";


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: public; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";


--
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: public; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";


-- pg_dump omits empty per-role ACL entries and a NULL schema comment. Keep
-- them so pg-delta sees the replayed schema as identical to the remote source.
REVOKE ALL ON FUNCTION "public"."custom_access_token_hook"("event" "jsonb") FROM "anon";
REVOKE ALL ON FUNCTION "public"."custom_access_token_hook"("event" "jsonb") FROM "authenticated";
REVOKE ALL ON FUNCTION "public"."log_action"("p_action" "text", "p_target_type" "public"."target_type", "p_target_id" "uuid", "p_reason" "text", "p_metadata" "jsonb") FROM "anon";
REVOKE ALL ON FUNCTION "public"."log_action"("p_action" "text", "p_target_type" "public"."target_type", "p_target_id" "uuid", "p_reason" "text", "p_metadata" "jsonb") FROM "authenticated";
COMMENT ON SCHEMA "public" IS NULL;


--
-- PostgreSQL database dump complete
--

-- \unrestrict rwaecw4k5YWWwit3ZIeMJ5uStDnKKRNdQCtRMJ2gaxfpgnWmgdR5Q8zOee83lwQ

