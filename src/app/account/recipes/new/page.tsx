import Link from "next/link";
import { redirect } from "next/navigation";
import AppHeader from "@/app/components/AppHeader";
import { createClient } from "@/utils/supabase/server";
import NewRecipeForm from "./NewRecipeForm";

export default async function NewRecipePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const { data: tags } = await supabase
    .from("tags")
    .select("id, type, name")
    .in("type", ["cuisine", "meal_type", "diet"])
    .order("type", { ascending: true })
    .order("position", { ascending: true })
    .limit(60);

  return (
    <div className="flex flex-col flex-1">
      <AppHeader active="account" />

      <div className="max-w-[720px] mx-auto px-6 py-10 w-full">
        <Link
          href="/account/recipes"
          className="mb-6 inline-flex items-center gap-1.5 text-[14px] font-semibold text-ink-soft hover:text-pink-600 transition-colors"
        >
          ← Về danh sách công thức
        </Link>

        <h1 className="font-display font-extrabold text-[26px] sm:text-[32px] mb-2">
          Đăng công thức mới
        </h1>
        <p className="mb-8 text-[14px] text-ink-soft">
          Nếu đây là công thức đầu tiên của bạn, bài viết có thể cần chờ
          duyệt trước khi hiển thị công khai.
        </p>

        <NewRecipeForm tags={tags ?? []} />
      </div>
    </div>
  );
}
