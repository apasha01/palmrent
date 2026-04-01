"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */

import React, { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Camera, Loader2, Save, User2 } from "lucide-react";
import { updateMe } from "@/services/user/user";
import { toast } from "react-toastify";
import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";

function CardShell({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border bg-card p-4 md:p-6">
      <h2 className="text-base font-bold">{title}</h2>
      <div className="mt-4">{children}</div>
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <div className="mb-1 text-xs text-muted-foreground">{children}</div>;
}

const STORAGE_ORIGIN =
  process.env.NEXT_PUBLIC_STORAGE_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "";

function normalizeImageSrc(raw?: string) {
  const s = String(raw ?? "").trim();
  if (!s) return "";

  if (s.startsWith("blob:") || s.startsWith("data:")) return s;
  if (/^https?:\/\//i.test(s)) return s;
  if (s.startsWith("//")) return `https:${s}`;

  if (s.startsWith("/")) {
    return STORAGE_ORIGIN ? new URL(s, STORAGE_ORIGIN).toString() : s;
  }

  return STORAGE_ORIGIN
    ? new URL(`/${s}`, STORAGE_ORIGIN).toString()
    : `/${s}`;
}

export default function ProfileMe({
  user,
  onUserUpdated,
}: {
  user: any;
  onUserUpdated?: (nextUser: any) => void;
}) {
  const t = useTranslations("profile.me");
  const { data: session, update } = useSession();

  const initialName = useMemo(() => String(user?.name ?? "").trim(), [user]);

  const mobile = useMemo(() => {
    const p = user?.mobile ?? user?.username ?? "";
    return String(p || "").trim();
  }, [user]);

  const avatarUrlRaw = useMemo(() => {
    const u = String(user?.avatar_url ?? user?.avatar ?? "").trim();
    return u || "";
  }, [user]);

  const [name, setName] = useState(initialName);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState("");
  const [saving, setSaving] = useState(false);

  const fileRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setName(initialName);
    setAvatarFile(null);
    setAvatarPreview("");
  }, [initialName]);

  const currentAvatarSrc = useMemo(() => {
    const raw = avatarPreview || avatarUrlRaw;
    return normalizeImageSrc(raw);
  }, [avatarPreview, avatarUrlRaw]);

  const pickFile = () => fileRef.current?.click();

  const onFileChange = (f?: File | null) => {
    if (!f) return;

    if (!f.type.startsWith("image/")) {
      toast.error(t("toasts.imageOnly"));
      return;
    }

    if (f.size > 4 * 1024 * 1024) {
      toast.error(t("toasts.maxAvatarSize"));
      return;
    }

    if (avatarPreview?.startsWith("blob:")) {
      try {
        URL.revokeObjectURL(avatarPreview);
      } catch {}
    }

    setAvatarFile(f);
    setAvatarPreview(URL.createObjectURL(f));
  };

  useEffect(() => {
    return () => {
      if (avatarPreview?.startsWith("blob:")) {
        try {
          URL.revokeObjectURL(avatarPreview);
        } catch {}
      }
    };
  }, [avatarPreview]);

  const changed = name.trim() !== initialName || !!avatarFile;

  const save = async () => {
    const cleanName = name.trim();

    if (!cleanName) {
      toast.error(t("toasts.nameRequired"));
      return;
    }

    if (!changed || saving) return;

    setSaving(true);

    try {
      const res = await updateMe({ name: cleanName, avatarFile });
      const nextUser = res?.user ?? null;

      if (!nextUser) {
        toast.error(t("toasts.invalidServerResponse"));
        return;
      }

      onUserUpdated?.(nextUser);

      const accessToken = (session as any)?.accessToken ?? null;

      await update({
        user: nextUser,
        accessToken,
      } as any);

      if (avatarPreview?.startsWith("blob:")) {
        try {
          URL.revokeObjectURL(avatarPreview);
        } catch {}
      }

      setAvatarFile(null);
      setAvatarPreview("");

      toast.success(t("toasts.success"));
    } catch (e: any) {
      const backendMsg =
        e?.response?.data?.message ||
        e?.response?.data?.msg ||
        e?.message ||
        t("toasts.updateError");

      toast.error(backendMsg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <CardShell title={t("title")}>
      <div className="space-y-6">
        <div className="flex justify-center">
          <div
            className="group relative cursor-pointer select-none"
            onClick={pickFile}
          >
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => onFileChange(e.target.files?.[0] ?? null)}
            />

            <div className="relative h-28 w-28 overflow-hidden rounded-full border bg-muted shadow-md">
              {currentAvatarSrc ? (
                <Image
                  src={currentAvatarSrc}
                  alt={t("avatarAlt")}
                  fill
                  className="object-cover"
                  sizes="112px"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                  <User2 className="h-10 w-10" />
                </div>
              )}

              <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition group-hover:opacity-100">
                <Camera className="h-5 w-5 text-white" />
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="rounded-xl">
            <Label>{t("fields.fullName")}</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-11 rounded-xl"
            />
          </div>

          <div className="rounded-xl">
            <Label>{t("fields.phone")}</Label>
            <Input
              value={mobile}
              readOnly
              className="h-11 rounded-xl bg-muted/40 text-muted-foreground"
            />
          </div>
        </div>

        <div className="flex justify-end">
          <Button
            onClick={save}
            disabled={!changed || saving}
            className={cn(
              "h-11 min-w-[170px] rounded-xl",
              (!changed || saving) && "opacity-60"
            )}
          >
            <span className="inline-flex items-center gap-2">
              <span className="inline-flex h-5 w-5 items-center justify-center">
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
              </span>
              <span>{t("actions.save")}</span>
            </span>
          </Button>
        </div>
      </div>
    </CardShell>
  );
}