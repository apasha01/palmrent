/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Camera, Loader2, Save } from "lucide-react";
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

  const avatarUrl = useMemo(() => {
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

  const currentAvatar = avatarPreview || avatarUrl;

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

    setAvatarFile(f);
    setAvatarPreview(URL.createObjectURL(f));
  };

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
      // ✅ چون updateMe خروجی‌اش { user?: any } است
      const res = await updateMe({ name: cleanName, avatarFile });
      const nextUser = res?.user ?? null;

      if (!nextUser) {
        toast.error("پاسخ سرور نامعتبر است");
        return;
      }

      // ✅ callback والد (اختیاری)
      onUserUpdated?.(nextUser);

      // ✅ sync کردن next-auth
      const accessToken = (session as any)?.accessToken ?? null;
      await update({
        user: nextUser,
        accessToken,
      } as any);

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
          <div className="relative group cursor-pointer" onClick={pickFile}>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => onFileChange(e.target.files?.[0] ?? null)}
            />

            <div className="w-28 h-28 rounded-full overflow-hidden border shadow-md relative">
              {currentAvatar ? (
                <Image src={currentAvatar} alt="avatar" fill className="object-cover" sizes="112px" />
              ) : (
                <div className="w-full h-full bg-muted flex items-center justify-center text-2xl font-bold text-muted-foreground">
                  {initialName?.charAt(0) || "U"}
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
