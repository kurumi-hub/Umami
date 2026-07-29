"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { IconChefHat, IconHeart } from "@/app/icons";
import {
  addRecipeTip,
  addTipReply,
  getTipReplies,
  toggleTipLike,
} from "@/app/cong-thuc/actions";

type Tip = {
  id: string;
  body: string;
  image_url: string | null;
  like_count: number;
  reply_count: number;
  created_at: string;
  author_id: string;
  author_name: string | null;
  author_username: string;
  author_avatar: string | null;
  liked_by_me: boolean;
};

type Reply = {
  id: string;
  body: string;
  created_at: string;
  author_name: string | null;
  author_username: string;
};

function TipRow({
  tip,
  slug,
  isLoggedIn,
  myUsername,
  myDisplayName,
}: {
  tip: Tip;
  slug: string;
  isLoggedIn: boolean;
  myUsername: string;
  myDisplayName: string;
}) {
  const [liked, setLiked] = useState(tip.liked_by_me);
  const [likeCount, setLikeCount] = useState(tip.like_count);
  const [replyCount, setReplyCount] = useState(tip.reply_count);
  const [repliesOpen, setRepliesOpen] = useState(false);
  const [replies, setReplies] = useState<Reply[] | null>(null);
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
    setLikeCount((c) => c + (next ? 1 : -1));
    startTransition(async () => {
      const result = await toggleTipLike(tip.id, slug);
      if (result.error) {
        setLiked(!next);
        setLikeCount((c) => c + (next ? -1 : 1));
      }
    });
  }

  async function handleToggleReplies() {
    setRepliesOpen((v) => !v);
    if (!replies) {
      const result = await getTipReplies(tip.id);
      setReplies((result.replies as Reply[]) ?? []);
    }
  }

  function handleSubmitReply() {
    if (!isLoggedIn) {
      router.push("/auth/login");
      return;
    }
    if (!replyBody.trim()) return;
    const body = replyBody;
    setReplyBody("");
    startTransition(async () => {
      const result = await addTipReply(tip.id, slug, body);
      if (!result.error && result.reply) {
        setReplies((prev) => [
          ...(prev ?? []),
          {
            id: (result.reply as { id: string }).id,
            body: (result.reply as { body: string }).body,
            created_at: (result.reply as { created_at: string }).created_at,
            author_name: myDisplayName || myUsername,
            author_username: myUsername,
          },
        ]);
        setReplyCount((c) => c + 1);
        setRepliesOpen(true);
      }
    });
  }

  return (
    <div className="rounded-[18px] border border-pink-500/10 bg-surface px-4 py-3.5">
      <div className="flex items-center gap-2.5 mb-1.5">
        <Link href={`/u/${tip.author_username}`} className="shrink-0">
          {tip.author_avatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={tip.author_avatar}
              alt={tip.author_name || tip.author_username}
              className="h-8 w-8 rounded-full object-cover"
            />
          ) : (
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-pink-100">
              <IconChefHat className="h-4 w-4 text-pink-500" />
            </span>
          )}
        </Link>
        <div className="flex items-center gap-2">
          <Link
            href={`/u/${tip.author_username}`}
            className="text-[13.5px] font-bold hover:text-pink-600 transition-colors"
          >
            {tip.author_name || tip.author_username}
          </Link>
          <Link
            href={`/u/${tip.author_username}`}
            className="text-[12px] text-ink-soft hover:text-pink-600 transition-colors"
          >
            @{tip.author_username}
          </Link>
        </div>
      </div>
      <p className="text-[14px] leading-relaxed">{tip.body}</p>

      <div className="mt-2.5 flex items-center gap-4 text-[12.5px] text-ink-soft">
        <button
          type="button"
          onClick={handleLike}
          disabled={pending}
          className={`flex items-center gap-1.5 transition-colors ${
            liked ? "text-pink-600" : "hover:text-pink-600"
          }`}
        >
          <IconHeart className="h-4 w-4" filled={liked} />
          {likeCount}
        </button>
        <button
          type="button"
          onClick={handleToggleReplies}
          className="hover:text-pink-600 transition-colors"
        >
          {replyCount > 0 ? `${replyCount} trả lời` : "Trả lời"}
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
                  <Link
                    href={`/u/${r.author_username}`}
                    className="text-[12.5px] font-bold hover:text-pink-600 transition-colors"
                  >
                    {r.author_name || r.author_username}
                  </Link>
                  <Link
                    href={`/u/${r.author_username}`}
                    className="text-[11.5px] text-ink-soft hover:text-pink-600 transition-colors"
                  >
                    @{r.author_username}
                  </Link>
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
    </div>
  );
}

export default function TipsSection({
  recipeId,
  slug,
  initialTips,
  isLoggedIn,
  myUsername,
  myDisplayName,
}: {
  recipeId: string;
  slug: string;
  initialTips: Tip[];
  isLoggedIn: boolean;
  myUsername: string;
  myDisplayName: string;
}) {
  const [tips, setTips] = useState(initialTips);
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function handleSubmit() {
    if (!isLoggedIn) {
      router.push("/auth/login");
      return;
    }
    if (!body.trim()) return;
    setError(null);
    const text = body;
    setBody("");

    startTransition(async () => {
      const result = await addRecipeTip(recipeId, slug, text);
      if (result.error) {
        setError(result.error);
        setBody(text);
      } else if (result.tip) {
        const t = result.tip as {
          id: string;
          body: string;
          like_count: number;
          reply_count: number;
          created_at: string;
        };
        setTips((prev) => [
          {
            id: t.id,
            body: t.body,
            image_url: null,
            like_count: t.like_count,
            reply_count: t.reply_count,
            created_at: t.created_at,
            author_id: "",
            author_name: myDisplayName || myUsername,
            author_username: myUsername,
            author_avatar: null,
            liked_by_me: false,
          },
          ...prev,
        ]);
      }
    });
  }

  return (
    <div>
      <div className="mb-5 flex flex-col gap-2.5">
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder={
            isLoggedIn
              ? "Chia sẻ mẹo của bạn cho công thức này..."
              : "Đăng nhập để chia sẻ mẹo với cộng đồng"
          }
          rows={3}
          className="w-full rounded-2xl border border-pink-300/70 bg-surface px-4 py-3 text-[14px] text-ink outline-none focus:border-pink-500 focus:ring-4 focus:ring-pink-500/15"
        />
        {error && <p className="text-[12.5px] text-pink-600">{error}</p>}
        <div>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={pending || !body.trim()}
            className="rounded-full bg-pink-500 px-5 py-2.5 text-[13.5px] font-bold text-white disabled:opacity-50"
          >
            {pending ? "Đang đăng..." : "Đăng bình luận"}
          </button>
        </div>
      </div>

      {tips.length === 0 ? (
        <p className="text-[14px] text-ink-soft">
          Chưa có mẹo nào cho công thức này. Hãy là người đầu tiên chia sẻ!
        </p>
      ) : (
        <div className="flex flex-col gap-4">
          {tips.map((tip) => (
            <TipRow
              key={tip.id}
              tip={tip}
              slug={slug}
              isLoggedIn={isLoggedIn}
              myUsername={myUsername}
              myDisplayName={myDisplayName}
            />
          ))}
        </div>
      )}
    </div>
  );
}
