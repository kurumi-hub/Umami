import Link from "next/link";
import { redirect } from "next/navigation";
import AppHeader from "@/app/components/AppHeader";
import { createClient } from "@/utils/supabase/server";
import ProfileForm from "./ProfileForm";
import PreferencesForm from "./PreferencesForm";
import AllergensManager from "./AllergensManager";
import ChangePasswordForm from "./ChangePasswordForm";
import PrivateAccountToggle from "./PrivateAccountToggle";
import BlockedUsersManager from "./BlockedUsersManager";

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("username, display_name, bio, is_private")
    .eq("id", user.id)
    .maybeSingle();

  const { data: preferences } = await supabase
    .from("user_preferences")
    .select("units, max_cook_time_min, diet_tag_ids")
    .eq("user_id", user.id)
    .maybeSingle();

  const { data: dietTags } = await supabase
    .from("tags")
    .select("id, name")
    .eq("type", "diet")
    .order("position", { ascending: true })
    .limit(20);

  const { data: allergenRows } = await supabase
    .from("user_allergens")
    .select("ingredient_id, ingredients(id, name)")
    .eq("user_id", user.id);

  const allergens = (allergenRows ?? [])
    .map((row) => (Array.isArray(row.ingredients) ? row.ingredients[0] : row.ingredients))
    .filter(Boolean) as { id: string; name: string }[];

  const { data: blockedRows } = await supabase
    .from("blocks")
    .select("blocked_id, profiles!blocks_blocked_id_fkey(id, username, display_name)")
    .eq("blocker_id", user.id);

  const blocked = (blockedRows ?? [])
    .map((row) => (Array.isArray(row.profiles) ? row.profiles[0] : row.profiles))
    .filter(Boolean) as { id: string; username: string; display_name: string | null }[];

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

        <h1 className="font-display font-extrabold text-[26px] sm:text-[32px] mb-8">
          Cài đặt
        </h1>

        <section className="mb-10">
          <h2 className="mb-4 text-[17px] font-bold">Hồ sơ</h2>
          <ProfileForm
            initialDisplayName={profile?.display_name ?? ""}
            initialUsername={profile?.username ?? ""}
            initialBio={profile?.bio ?? ""}
          />
        </section>

        <section className="mb-10">
          <h2 className="mb-4 text-[17px] font-bold">Bảo mật</h2>
          <div className="flex flex-col gap-4">
            <ChangePasswordForm />
            <PrivateAccountToggle initialIsPrivate={profile?.is_private ?? false} />
          </div>
        </section>

        <section className="mb-10">
          <h2 className="mb-4 text-[17px] font-bold">Sở thích nấu ăn</h2>
          <PreferencesForm
            initialUnits={(preferences?.units as "metric" | "imperial") ?? "metric"}
            initialMaxCookTime={preferences?.max_cook_time_min ?? null}
            initialDietTagIds={preferences?.diet_tag_ids ?? []}
            dietTags={dietTags ?? []}
          />
        </section>

        <section className="mb-10">
          <h2 className="mb-4 text-[17px] font-bold">Dị ứng thực phẩm</h2>
          <AllergensManager initialAllergens={allergens} />
        </section>

        <section>
          <h2 className="mb-4 text-[17px] font-bold">Đã chặn</h2>
          <BlockedUsersManager initialBlocked={blocked} />
        </section>
      </div>
    </div>
  );
}
