import Link from "next/link";
import { redirect } from "next/navigation";
import AppHeader from "@/app/components/AppHeader";
import { createClient } from "@/utils/supabase/server";
import { IconClipboard, IconGlobe, IconLock } from "@/app/icons";
import CollectionCreateForm from "@/app/account/CollectionCreateForm";

const PAGE_SIZE = 24;

export default async function CollectionsListPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, parseInt(pageParam || "1", 10) || 1);
  const offset = (page - 1) * PAGE_SIZE;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const { data: collections, count } = await supabase
    .from("collections")
    .select("id, name, is_public, recipe_count", { count: "exact" })
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false })
    .range(offset, offset + PAGE_SIZE - 1);

  const totalPages = Math.max(1, Math.ceil((count || 0) / PAGE_SIZE));

  return (
    <div className="flex flex-col flex-1">
      <AppHeader active="account" />

      <div className="max-w-[1160px] mx-auto px-6 py-10 w-full">
        <Link
          href="/account"
          className="mb-6 inline-flex items-center gap-1.5 text-[14px] font-semibold text-ink-soft hover:text-pink-600 transition-colors"
        >
          ← Về trang Cá nhân
        </Link>

        <div className="mb-8 flex items-center justify-between gap-3 flex-wrap">
          <h1 className="font-display font-extrabold text-[26px] sm:text-[32px]">
            Bộ sưu tập của bạn {count ? `(${count})` : ""}
          </h1>
          <CollectionCreateForm />
        </div>

        {!collections || collections.length === 0 ? (
          <div className="rounded-[20px] border border-dashed border-pink-300/60 px-6 py-10 text-center text-[14px] text-ink-soft">
            Bạn chưa có bộ sưu tập nào. Tạo bộ sưu tập để nhóm các công thức
            theo chủ đề của riêng bạn.
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
              {collections.map((c) => (
                <Link
                  key={c.id}
                  href={`/account/collections/${c.id}`}
                  className="bg-surface rounded-[22px] overflow-hidden border border-pink-500/10 transition-all hover:-translate-y-1.5 hover:shadow-[0_18px_34px_-18px_rgba(255,111,145,0.5)] block"
                >
                  <div className="relative h-[120px] bg-gradient-to-br from-pink-100 to-pink-50 dark:from-pink-100/10 dark:to-transparent flex items-center justify-center">
                    <IconClipboard className="w-10 h-10 text-pink-400" />
                    <span className="absolute top-3 right-3 flex items-center gap-1 rounded-full bg-surface/90 px-2.5 py-1 text-[11px] font-bold text-ink-soft">
                      {c.is_public ? (
                        <IconGlobe className="h-3.5 w-3.5" />
                      ) : (
                        <IconLock className="h-3.5 w-3.5" />
                      )}
                      {c.is_public ? "Công khai" : "Riêng tư"}
                    </span>
                  </div>
                  <div className="p-4">
                    <h4 className="text-[15.5px] font-bold leading-snug line-clamp-2">
                      {c.name}
                    </h4>
                    <span className="text-[12.5px] text-ink-soft">
                      {c.recipe_count} công thức
                    </span>
                  </div>
                </Link>
              ))}
            </div>

            {totalPages > 1 && (
              <div className="mt-10 flex items-center justify-center gap-3">
                <Link
                  href={`/account/collections?page=${Math.max(1, page - 1)}`}
                  aria-disabled={page <= 1}
                  className={`rounded-full border-2 border-pink-300 px-5 py-2.5 text-[14px] font-bold text-pink-600 transition-colors ${
                    page <= 1 ? "pointer-events-none opacity-40" : "hover:bg-pink-50"
                  }`}
                >
                  ← Trước
                </Link>
                <span className="text-[13.5px] text-ink-soft">
                  Trang {page}/{totalPages}
                </span>
                <Link
                  href={`/account/collections?page=${Math.min(totalPages, page + 1)}`}
                  aria-disabled={page >= totalPages}
                  className={`rounded-full border-2 border-pink-300 px-5 py-2.5 text-[14px] font-bold text-pink-600 transition-colors ${
                    page >= totalPages
                      ? "pointer-events-none opacity-40"
                      : "hover:bg-pink-50"
                  }`}
                >
                  Sau →
                </Link>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
