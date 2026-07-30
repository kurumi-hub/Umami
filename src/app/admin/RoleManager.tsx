"use client";

import { useState, useTransition } from "react";
import { grantRole, revokeRole, searchUserByUsername } from "./actions";

type UserResult = {
  id: string;
  username: string;
  display_name: string | null;
  roles: string[];
};

const roleLabels: Record<string, string> = {
  moderator: "Moderator",
  admin: "Admin",
};

export default function RoleManager() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<UserResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  let searchTimeout: ReturnType<typeof setTimeout>;

  function handleQueryChange(value: string) {
    setQuery(value);
    clearTimeout(searchTimeout);
    if (value.trim().length < 2) {
      setResults([]);
      return;
    }
    searchTimeout = setTimeout(async () => {
      setSearching(true);
      const result = await searchUserByUsername(value);
      setSearching(false);
      if (result.error) {
        setError(result.error);
      } else {
        setError(null);
        setResults(result.users as UserResult[]);
      }
    }, 300);
  }

  function updateLocalRoles(userId: string, updater: (roles: string[]) => string[]) {
    setResults((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, roles: updater(u.roles) } : u))
    );
  }

  function handleGrant(userId: string, role: "moderator" | "admin") {
    setError(null);
    updateLocalRoles(userId, (roles) => [...roles, role]);
    startTransition(async () => {
      const result = await grantRole(userId, role);
      if (result.error) {
        setError(result.error);
        updateLocalRoles(userId, (roles) => roles.filter((r) => r !== role));
      }
    });
  }

  function handleRevoke(userId: string, role: "moderator" | "admin") {
    setError(null);
    updateLocalRoles(userId, (roles) => roles.filter((r) => r !== role));
    startTransition(async () => {
      const result = await revokeRole(userId, role);
      if (result.error) {
        setError(result.error);
        updateLocalRoles(userId, (roles) => [...roles, role]);
      }
    });
  }

  return (
    <div className="rounded-2xl border border-pink-500/10 bg-surface p-5">
      <label className="relative block mb-4">
        <input
          type="text"
          value={query}
          onChange={(e) => handleQueryChange(e.target.value)}
          placeholder="Tìm user theo username..."
          className="w-full rounded-full border border-pink-300/70 bg-surface px-4 py-2.5 text-[14px] text-ink outline-none focus:border-pink-500"
        />
      </label>

      {error && <p className="mb-3 text-[12.5px] text-pink-600">{error}</p>}
      {searching && <p className="text-[13px] text-ink-soft">Đang tìm...</p>}

      {!searching && results.length > 0 && (
        <div className="flex flex-col gap-2.5">
          {results.map((u) => (
            <div
              key={u.id}
              className="flex flex-col gap-2 rounded-xl border border-pink-500/10 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <b className="text-[14px] block">{u.display_name || u.username}</b>
                <span className="text-[12px] text-ink-soft">@{u.username}</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {(["moderator", "admin"] as const).map((role) => {
                  const has = u.roles.includes(role);
                  return (
                    <button
                      key={role}
                      type="button"
                      onClick={() =>
                        has ? handleRevoke(u.id, role) : handleGrant(u.id, role)
                      }
                      disabled={pending}
                      className={`rounded-full px-3.5 py-1.5 text-[12px] font-bold transition-colors disabled:opacity-50 ${
                        has
                          ? "bg-pink-500 text-white"
                          : "border-2 border-pink-300 text-pink-600 hover:bg-pink-50"
                      }`}
                    >
                      {has ? `Thu hồi ${roleLabels[role]}` : `Cấp ${roleLabels[role]}`}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
