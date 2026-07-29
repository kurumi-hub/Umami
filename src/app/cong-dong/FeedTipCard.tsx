"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { IconBowl, IconChefHat, IconHeart, IconSparkle } from "@/app/icons";
import { addTipReply, getTipReplies, toggleTipLike } from "@/app/cong-thuc/actions";

type Reply = {
  id: string;
  body: string;
  created_at: string;
  author_name: string | null;
  author_username: string;
};

export default function FeedTipCard({
  tipId,
  recipeSlug,
  recipeTitle,
  authorName,
  authorUsername,
  createdAt,
  body,
  likeCount,
  replyCount,
  likedByMe,
  isDiscover,
  isLoggedIn,
  myUsername,
  myDisplayName,
}: {
  tipId: string;
  recipeSlug: string;
  recipeTitle: string;
  authorName: string | null;
  authorUsername: string;
  createdAt: string;
  body: string;
  likeCount: number;
  replyCount: number;
  likedByMe: boolean;
  isDiscover: boolean;
  isLoggedIn: boolean;
  myUsername: string;
  myDisplayName: string;
}) {
  const [liked, setLiked] = useState(likedByMe);
  const [likes, setLikes] = useState(likeCount);
  const [replies, setReplies] = useState<Reply[] | null>(null);
  const [repliesOpen, setRepliesOpen] = useState(false);
  const [replyCountLocal, setReplyCountLocal] = useState(replyCount);
  const [replyBody, setReplyBody] = useState("");
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function handleLike() {
    if (!isLoggedIn) {
      router.push("/auth/login");
      return;
    }
    const next = !liked;
    setLiked(next);
    setLikes((c) => c + (next ? 1 : -1));
    startTransition(async () => {
      const result = await toggleTipLike(tipId, recipeSlug);
      if (result.error) {
        setLiked(!next);
        setLikes((c) => c + (next ? -1 : 1));
      }
    });
  }

  async function handleToggleReplies() {
    setRepliesOpen((v) => !v);
    if (!replies) {
      const result = await getTipReplies(tipId);
      setReplies((result.replies as Reply[]) ?? []);
    }
  }

  function handleSubmitReply() {
    if (!isLoggedIn) {
      router.push("/auth/login");
      return;
    }
    if (!replyBody.trim()) return;
    const bodyText = replyBody;
    setReplyBody("");
    startTransition(async () => {
      const result = await addTipReply(tipId, recipeSlug, bodyText);
      if (!result.error && result.reply) {
        const r = result.reply as { id: string; body: string; created_at: string };
        setReplies((prev) => [
          ...(prev ?? []),
          { id: r.id, body: r.body, created_at: r.created_at, author_name: myDisplayName || myUsername, author_username: myUsername },
        ]);
        setReplyCountLocal((c) => c + 1);
        setRepliesOpen(true);
      }
    });
  }

  return (
    <article className="bg-surface rounded-[22px] p-5 sm:p-6 border border-pink-500/10 shadow-[0_14px_30px_-20px_rgba(58,31,43,0.2)]">
      <div className="flex items-center justify-between gap-2 mb-3">
        <Link href={`/u/${authorUsername}`} className="flex items-center gap-3 group">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-pink-100">
            <IconChefHat className="h-5 w-5 text-pink-500" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <b className="text-[14.5px] font-bold group-hover:text-pink-600 transition-colors">
                {authorName || authorUsername}
              </b>
              <span className="text-[12.5px] text-ink-soft">@{authorUsername}</span>
            </div>
            <span className="text-[12px] text-ink-soft">{createdAt}</span>
          </div>
        </Link>
        {isDiscover && (
          <span className="shrink-0 flex items-center gap-1 rounded-full bg-mango/20 px-2.5 py-1 text-[10.5px] font-bold text-amber-700">
            <IconSparkle className="h-3 w-3" />
            Gợi ý cho bạn
          </span>
        )}
      </div>

      <p className="text-[14.5px] leading-relaxed">{body}</p>

      <Link
        href={`/cong-thuc/${recipeSlug}`}
        className="mt-4 inline-flex items-center gap-2 rounded-full bg-pink-50 px-3.5 py-2 text-[12.5px] font-bold text-pink-600 hover:bg-pink-100 transition-colors"
      >
        <IconBowl className="h-4 w-4" />
        {recipeTitle}
      </Link>

      <div className="mt-4 flex items-center gap-5 text-[13px] text-ink-soft">
        <button
          type="button"
          onClick={handleLike}
          disabled={pending}
          className={`flex items-center gap-1.5 transition-colors ${liked ? "text-pink-600" : "hover:text-pink-600"}`}
        >
          <IconHeart className="h-4 w-4" filled={liked} />
          {likes}
        </button>
        <button
          type="button"
          onClick={handleToggleReplies}
          className="hover:text-pink-600 transition-colors"
        >
          {replyCountLocal > 0 ? `${replyCountLocal} trả lời` : "Trả lời"}
        </button>
      </div>

      {repliesOpen && (
        <div className="mt-3 flex flex-col gap-2.5 border-l-2 border-pink-500/10 pl-4">
          {replies === null ? (
            <p className="text-[12.5px] text-ink-soft">Đang tải...</p>
          ) : (
            replies.map((r) => (
              <div key={r.id}>
                <div className="flex items-center gap-2">
                  <b className="text-[12.5px]">{r.author_name || r.author_username}</b>
                  <span className="text-[11.5px] text-ink-soft">@{r.author_username}</span>
                </div>
                <p className="text-[13px] leading-relaxed">{r.body}</p>
              </div>
            ))
          )}
          <div className="flex gap-2 mt-1">
            <input
              type="text"
              value={replyBody}
              onChange={(e) => setReplyBody(e.target.value)}
              placeholder="Viết trả lời..."
              className="flex-1 rounded-full border border-pink-300/70 bg-surface px-3.5 py-2 text-[13px] outline-none focus:border-pink-500"
            />
            <button
              type="button"
              onClick={handleSubmitReply}
              disabled={pending || !replyBody.trim()}
              className="rounded-full bg-pink-500 px-4 py-2 text-[12.5px] font-bold text-white disabled:opacity-50"
            >
              Gửi
            </button>
          </div>
        </div>
      )}
    </article>
  );
}
