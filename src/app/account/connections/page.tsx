import Link from "next/link";
import { redirect } from "next/navigation";
import AppHeader from "@/app/components/AppHeader";
import { createClient } from "@/utils/supabase/server";
import ConnectionsTabs from "./ConnectionsTabs";

export default async function ConnectionsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const [{ data: followerRows }, { data: followingRows }, { data: pendingRows }] =
    await Promise.all([
      supabase
        .from("follows")
        .select("follower_id, created_at, profiles!follows_follower_id_fkey(id, username, display_name, avatar_url)")
        .eq("followee_id", user.id)
        .eq("state", "accepted")
        .order("created_at", { ascending: false }),
      supabase
        .from("follows")
        .select("followee_id, created_at, profiles!follows_followee_id_fkey(id, username, display_name, avatar_url)")
        .eq("follower_id", user.id)
        .eq("state", "accepted")
        .order("created_at", { ascending: false }),
      supabase
        .from("follows")
        .select("follower_id, created_at, profiles!follows_follower_id_fkey(id, username, display_name, avatar_url)")
        .eq("followee_id", user.id)
        .eq("state", "pending")
        .order("created_at", { ascending: false }),
    ]);

  function mapRows(rows: unknown[] | null, key: "profiles") {
    return (rows ?? [])
      .map((row) => {
        const r = row as Record<string, unknown>;
        const profile = Array.isArray(r[key]) ? r[key][0] : r[key];
        return profile as { id: string; username: string; display_name: string | null; avatar_url: string | null } | null;
      })
      .filter(Boolean) as { id: string; username: string; display_name: string | null; avatar_url: string | null }[];
  }

  const followers = mapRows(followerRows, "profiles");
  const following = mapRows(followingRows, "profiles");
  const pending = mapRows(pendingRows, "profiles");

  return (
    <div className="flex flex-col flex-1">
      <AppHeader active="account" />

      <div className="max-w-[640px] mx-auto px-6 py-10 w-full">
        <Link
          href="/account"
          className="mb-6 inline-flex items-center gap-1.5 text-[14px] font-semibold text-ink-soft hover:text-pink-600 transition-colors"
        >
          ← Về trang Cá nhân
        </Link>

        <h1 className="font-display font-extrabold text-[26px] sm:text-[32px] mb-6">
          Kết nối
        </h1>

        <ConnectionsTabs followers={followers} following={following} pending={pending} />
      </div>
    </div>
  );
}
