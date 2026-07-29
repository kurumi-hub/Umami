"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { IconChefHat } from "@/app/icons";
import {
  approveFollowRequest,
  blockUser,
  rejectFollowRequest,
  unfollowUser,
} from "./actions";

type Person = {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
};

function PersonRow({
  person,
  children,
}: {
  person: Person;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-pink-500/10 bg-surface px-4 py-3">
      <Link href={`/u/${person.username}`} className="flex items-center gap-3 flex-1 min-w-0">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-pink-100">
          <IconChefHat className="h-4.5 w-4.5 text-pink-500" />
        </div>
        <div className="min-w-0">
          <span className="block text-[14px] font-semibold truncate">
            {person.display_name || person.username}
          </span>
          <span className="text-[12px] text-ink-soft">@{person.username}</span>
        </div>
      </Link>
      {children}
    </div>
  );
}

export default function ConnectionsTabs({
  followers,
  following,
  pending,
}: {
  followers: Person[];
  following: Person[];
  pending: Person[];
}) {
  const [tab, setTab] = useState<"followers" | "following" | "pending">(
    pending.length > 0 ? "pending" : "followers"
  );
  const [followersList, setFollowersList] = useState(followers);
  const [followingList, setFollowingList] = useState(following);
  const [pendingList, setPendingList] = useState(pending);
  const [error, setError] = useState<string | null>(null);
  const [pendingAction, startTransition] = useTransition();

  function handleUnfollow(personId: string) {
    setError(null);
    const prev = followingList;
    setFollowingList((p) => p.filter((x) => x.id !== personId));
    startTransition(async () => {
      const result = await unfollowUser(personId);
      if (result.error) {
        setError(result.error);
        setFollowingList(prev);
      }
    });
  }

  function handleApprove(personId: string) {
    setError(null);
    const person = pendingList.find((p) => p.id === personId);
    setPendingList((p) => p.filter((x) => x.id !== personId));
    if (person) setFollowersList((p) => [person, ...p]);
    startTransition(async () => {
      const result = await approveFollowRequest(personId);
      if (result.error) setError(result.error);
    });
  }

  function handleReject(personId: string) {
    setError(null);
    const prev = pendingList;
    setPendingList((p) => p.filter((x) => x.id !== personId));
    startTransition(async () => {
      const result = await rejectFollowRequest(personId);
      if (result.error) {
        setError(result.error);
        setPendingList(prev);
      }
    });
  }

  function handleBlock(personId: string) {
    if (!confirm("Chặn người này? Họ sẽ không thấy được nội dung của bạn nữa.")) return;
    setError(null);
    const prev = followersList;
    setFollowersList((p) => p.filter((x) => x.id !== personId));
    startTransition(async () => {
      const result = await blockUser(personId);
      if (result.error) {
        setError(result.error);
        setFollowersList(prev);
      }
    });
  }

  const tabs = [
    { key: "followers" as const, label: `Người theo dõi (${followersList.length})` },
    { key: "following" as const, label: `Đang theo dõi (${followingList.length})` },
    { key: "pending" as const, label: `Yêu cầu chờ duyệt (${pendingList.length})` },
  ];

  return (
    <div>
      <div className="mb-6 flex flex-wrap gap-2">
        {tabs.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={`rounded-full px-4 py-2 text-[13px] font-bold transition-colors ${
              tab === t.key
                ? "bg-pink-500 text-white"
                : "border-2 border-pink-300 text-pink-600 hover:bg-pink-50"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {error && <p className="mb-4 text-[12.5px] text-pink-600">{error}</p>}

      {tab === "followers" &&
        (followersList.length === 0 ? (
          <p className="text-[14px] text-ink-soft">Chưa có ai theo dõi bạn.</p>
        ) : (
          <div className="flex flex-col gap-2.5">
            {followersList.map((p) => (
              <PersonRow key={p.id} person={p}>
                <button
                  type="button"
                  onClick={() => handleBlock(p.id)}
                  disabled={pendingAction}
                  className="shrink-0 rounded-full border-2 border-pink-300 px-3.5 py-1.5 text-[12px] font-bold text-pink-600 hover:bg-pink-50 disabled:opacity-50"
                >
                  Chặn
                </button>
              </PersonRow>
            ))}
          </div>
        ))}

      {tab === "following" &&
        (followingList.length === 0 ? (
          <p className="text-[14px] text-ink-soft">Bạn chưa theo dõi ai.</p>
        ) : (
          <div className="flex flex-col gap-2.5">
            {followingList.map((p) => (
              <PersonRow key={p.id} person={p}>
                <button
                  type="button"
                  onClick={() => handleUnfollow(p.id)}
                  disabled={pendingAction}
                  className="shrink-0 rounded-full border-2 border-pink-300 px-3.5 py-1.5 text-[12px] font-bold text-pink-600 hover:bg-pink-50 disabled:opacity-50"
                >
                  Bỏ theo dõi
                </button>
              </PersonRow>
            ))}
          </div>
        ))}

      {tab === "pending" &&
        (pendingList.length === 0 ? (
          <p className="text-[14px] text-ink-soft">Không có yêu cầu nào đang chờ.</p>
        ) : (
          <div className="flex flex-col gap-2.5">
            {pendingList.map((p) => (
              <PersonRow key={p.id} person={p}>
                <div className="flex gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleApprove(p.id)}
                    disabled={pendingAction}
                    className="rounded-full bg-pink-500 px-3.5 py-1.5 text-[12px] font-bold text-white disabled:opacity-50"
                  >
                    Chấp nhận
                  </button>
                  <button
                    type="button"
                    onClick={() => handleReject(p.id)}
                    disabled={pendingAction}
                    className="rounded-full border-2 border-pink-300 px-3.5 py-1.5 text-[12px] font-bold text-pink-600 disabled:opacity-50"
                  >
                    Từ chối
                  </button>
                </div>
              </PersonRow>
            ))}
          </div>
        ))}
    </div>
  );
}
