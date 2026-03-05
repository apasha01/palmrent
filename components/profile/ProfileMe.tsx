/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Camera, Loader2, Save, User2 } from "lucide-react";
import { updateMe } from "@/services/user/user";
import { toast } from "react-toastify";
import { useSession } from "next-auth/react";

function CardShell({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border bg-card p-4 md:p-6">
      <h2 className="text-base font-bold">{title}</h2>
      <div className="mt-4">{children}</div>
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <div className="text-xs text-muted-foreground mb-1">{children}</div>;
}

/**
 * ✅ اگر بک‌اندت عکس‌ها رو با مسیر نسبی میده مثل:
 * uploads/avatars/...
 * این تابع می‌کنه URL معتبر برای next/image
 *
 * ترجیحاً یکی از این env ها رو ست کن:
 * NEXT_PUBLIC_STORAGE_URL="https://api.example.com"
 * یا NEXT_PUBLIC_API_URL="https://api.example.com"
 */
const STORAGE_ORIGIN =
  process.env.NEXT_PUBLIC_STORAGE_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "";

function normalizeImageSrc(raw?: string) {
  const s = String(raw ?? "").trim();
  if (!s) return "";

  // preview from file picker
  if (s.startsWith("blob:") || s.startsWith("data:")) return s;

  // already absolute
  if (/^https?:\/\//i.test(s)) return s;

  // protocol-relative
  if (s.startsWith("//")) return `https:${s}`;

  // root-relative
  if (s.startsWith("/")) {
    return STORAGE_ORIGIN ? new URL(s, STORAGE_ORIGIN).toString() : s;
  }

  // plain relative like: uploads/avatars/...
  return STORAGE_ORIGIN ? new URL(`/${s}`, STORAGE_ORIGIN).toString() : `/${s}`;
}

export default function ProfileMe({
  user,
  onUserUpdated,
}: {
  user: any;
  onUserUpdated?: (nextUser: any) => void;
}) {
  const { data: session, update } = useSession();

  const initialName = useMemo(() => String(user?.name ?? "").trim(), [user]);

  const mobile = useMemo(() => {
    const p = user?.mobile ?? user?.username ?? "";
    return String(p || "").trim();
  }, [user]);

  // ✅ اینجا هرچی از بک‌اند میاد می‌گیریم (avatar_url یا avatar)
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

  // ✅ URL نهایی برای نمایش
  const currentAvatarSrc = useMemo(() => {
    // اول preview (blob) بعد url از بک‌اند
    const raw = avatarPreview || avatarUrlRaw;
    return normalizeImageSrc(raw);
  }, [avatarPreview, avatarUrlRaw]);

  const pickFile = () => fileRef.current?.click();

  const onFileChange = (f?: File | null) => {
    if (!f) return;

    if (!f.type.startsWith("image/")) {
      toast.error("فایل باید تصویر باشد");
      return;
    }

    if (f.size > 4 * 1024 * 1024) {
      toast.error("حجم تصویر باید کمتر از ۴ مگابایت باشد");
      return;
    }

    // ✅ اگر قبلاً preview داشتیم، آزادش کنیم
    if (avatarPreview?.startsWith("blob:")) {
      try {
        URL.revokeObjectURL(avatarPreview);
      } catch {}
    }

    setAvatarFile(f);
    setAvatarPreview(URL.createObjectURL(f));
  };

  useEffect(() => {
    // ✅ cleanup وقتی کامپوننت unmount میشه
    return () => {
      if (avatarPreview?.startsWith("blob:")) {
        try {
          URL.revokeObjectURL(avatarPreview);
        } catch {}
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const changed = name.trim() !== initialName || !!avatarFile;

  const save = async () => {
    const cleanName = name.trim();

    if (!cleanName) {
      toast.error("نام کامل را وارد کنید");
      return;
    }
    if (!changed || saving) return;

    setSaving(true);

    try {
      const res = await updateMe({ name: cleanName, avatarFile });
      const nextUser = res?.user ?? null;

      if (!nextUser) {
        toast.error("پاسخ سرور نامعتبر است");
        return;
      }

      onUserUpdated?.(nextUser);

      // ✅ sync next-auth
      const accessToken = (session as any)?.accessToken ?? null;
      await update({
        user: nextUser,
        accessToken,
      } as any);

      // ✅ reset file state
      if (avatarPreview?.startsWith("blob:")) {
        try {
          URL.revokeObjectURL(avatarPreview);
        } catch {}
      }

      setAvatarFile(null);
      setAvatarPreview("");

      toast.success("پروفایل با موفقیت ویرایش شد");
    } catch (e: any) {
      const backendMsg =
        e?.response?.data?.message ||
        e?.response?.data?.msg ||
        e?.message ||
        "خطا در ویرایش پروفایل";

      toast.error(backendMsg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <CardShell title="مشخصات کاربری">
      <div className="space-y-6">
        {/* Avatar */}
        <div className="flex justify-center">
          <div className="relative group cursor-pointer select-none" onClick={pickFile}>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => onFileChange(e.target.files?.[0] ?? null)}
            />

            <div className="w-28 h-28 rounded-full overflow-hidden border shadow-md relative bg-muted">
              {/* ✅ اگر آواتار نبود: فقط آیکون */}
              {currentAvatarSrc ? (
                <Image
                  src={currentAvatarSrc}
                  alt="avatar"
                  fill
                  className="object-cover"
                  sizes="112px"
                  // اگر remotePatterns نزدی و عجله داری، اینو باز کن:
                  // unoptimized
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                  <User2 className="w-10 h-10" />
                </div>
              )}

              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                <Camera className="h-5 w-5 text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Inputs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="rounded-xl">
            <Label>نام کامل</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} className="h-11 rounded-xl" />
          </div>

          <div className="rounded-xl">
            <Label>شماره</Label>
            <Input value={mobile} readOnly className="h-11 rounded-xl bg-muted/40 text-muted-foreground" />
          </div>
        </div>

        {/* Save */}
        <div className="flex justify-end">
          <Button
            onClick={save}
            disabled={!changed || saving}
            className={cn("rounded-xl min-w-[170px] h-11", (!changed || saving) && "opacity-60")}
          >
            <span className="inline-flex items-center gap-2">
              <span className="inline-flex items-center justify-center w-5 h-5">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              </span>
              <span>ویرایش پروفایل</span>
            </span>
          </Button>
        </div>
      </div>
    </CardShell>
  );
}