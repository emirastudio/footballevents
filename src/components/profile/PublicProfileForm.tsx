"use client";

import { useState, useTransition } from "react";
import { Globe, Lock, ExternalLink } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { updatePublicProfileAction, type ProfileState } from "@/app/actions/profile";

type Props = {
  defaults: {
    username: string | null;
    bio: string | null;
    profilePublic: boolean;
  };
  labels: {
    usernameLabel: string;
    usernameHint: string;
    bioLabel: string;
    bioPlaceholder: string;
    visibilityLabel: string;
    visibilityPublic: string;
    visibilityPrivate: string;
    visibilityPublicHint: string;
    submit: string;
    loading: string;
    saved: string;
    viewPublic: string;
  };
};

export function PublicProfileForm({ defaults, labels }: Props) {
  const [username, setUsername] = useState(defaults.username ?? "");
  const [bio, setBio] = useState(defaults.bio ?? "");
  const [isPublic, setIsPublic] = useState(defaults.profilePublic);
  const [state, setState] = useState<ProfileState>(null);
  const [pending, start] = useTransition();

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData();
    fd.set("username", username.trim());
    fd.set("bio", bio.trim());
    if (isPublic) fd.set("profilePublic", "1");
    start(async () => {
      const res = await updatePublicProfileAction(state, fd);
      setState(res);
    });
  }

  const hasUsername = username.trim().length > 0;

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div>
        <label htmlFor="pp-username" className="mb-1.5 block text-sm font-semibold text-[var(--color-foreground)]">
          {labels.usernameLabel}
        </label>
        <div className="flex items-stretch overflow-hidden rounded-[var(--radius-md)] border border-[var(--color-border)] focus-within:ring-2 focus-within:ring-[var(--color-pitch-500)]">
          <span className="bg-[var(--color-bg-muted)] px-3 py-2 text-sm text-[var(--color-muted)]">
            @
          </span>
          <input
            id="pp-username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value.toLowerCase().slice(0, 30))}
            placeholder="alex_pro"
            maxLength={30}
            className="block w-full bg-[var(--color-surface)] px-3 py-2 text-sm focus:outline-none"
          />
        </div>
        <p className="mt-1 text-xs text-[var(--color-muted)]">{labels.usernameHint}</p>
      </div>

      <div>
        <label htmlFor="pp-bio" className="mb-1.5 block text-sm font-semibold text-[var(--color-foreground)]">
          {labels.bioLabel}
        </label>
        <textarea
          id="pp-bio"
          value={bio}
          onChange={(e) => setBio(e.target.value.slice(0, 280))}
          placeholder={labels.bioPlaceholder}
          rows={3}
          maxLength={280}
          className="block w-full resize-y rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-pitch-500)]"
        />
        <div className="mt-1 text-right text-xs text-[var(--color-muted)]">{bio.length}/280</div>
      </div>

      <div>
        <span className="mb-2 block text-sm font-semibold text-[var(--color-foreground)]">
          {labels.visibilityLabel}
        </span>
        <div className="grid gap-2 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => setIsPublic(false)}
            className={[
              "flex items-center gap-2 rounded-[var(--radius-md)] border px-3 py-2.5 text-left text-sm transition",
              !isPublic
                ? "border-[var(--color-pitch-500)] bg-[var(--color-pitch-50)] text-[var(--color-foreground)]"
                : "border-[var(--color-border)] hover:border-[var(--color-pitch-300)]",
            ].join(" ")}
          >
            <Lock className="h-4 w-4 shrink-0 text-[var(--color-muted)]" />
            <span className="font-semibold">{labels.visibilityPrivate}</span>
          </button>
          <button
            type="button"
            onClick={() => setIsPublic(true)}
            disabled={!hasUsername}
            className={[
              "flex items-center gap-2 rounded-[var(--radius-md)] border px-3 py-2.5 text-left text-sm transition disabled:cursor-not-allowed disabled:opacity-50",
              isPublic
                ? "border-[var(--color-pitch-500)] bg-[var(--color-pitch-50)] text-[var(--color-foreground)]"
                : "border-[var(--color-border)] hover:border-[var(--color-pitch-300)]",
            ].join(" ")}
          >
            <Globe className="h-4 w-4 shrink-0 text-[var(--color-pitch-600)]" />
            <span className="font-semibold">{labels.visibilityPublic}</span>
          </button>
        </div>
        {isPublic && hasUsername && (
          <p className="mt-2 flex items-center gap-2 text-xs text-[var(--color-muted-strong)]">
            <Globe className="h-3.5 w-3.5 text-[var(--color-pitch-600)]" />
            {labels.visibilityPublicHint}
            <Link
              href={`/u/${username}`}
              className="inline-flex items-center gap-1 font-semibold text-[var(--color-pitch-700)] hover:underline"
            >
              /u/{username} <ExternalLink className="h-3 w-3" />
            </Link>
          </p>
        )}
      </div>

      {state?.error && (
        <p className="rounded-[var(--radius-md)] border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {state.error}
        </p>
      )}
      {state?.ok && (
        <p className="rounded-[var(--radius-md)] border border-[var(--color-pitch-200)] bg-[var(--color-pitch-50)] p-3 text-sm text-[var(--color-pitch-800)]">
          {labels.saved}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="rounded-[var(--radius-md)] bg-[var(--color-accent)] px-5 py-2.5 text-sm font-bold text-[var(--color-accent-fg)] hover:bg-[var(--color-pitch-600)] disabled:opacity-50"
      >
        {pending ? labels.loading : labels.submit}
      </button>
    </form>
  );
}
