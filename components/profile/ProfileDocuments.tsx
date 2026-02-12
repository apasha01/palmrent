/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { toast } from "react-toastify";
import {
  UploadCloud,
  RefreshCcw,
  Eye,
  X,
  AlertTriangle,
  FileImage,
  ShieldCheck,
  ShieldX,
  Clock3,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  getUserDocuments,
  uploadUserDocumentSingle,
  type DocumentType,
  type DocumentSide,
} from "@/services/user-document/UserDocument";

type DocItem = {
  id?: number;
  type?: string;
  side?: string;
  status?: "pending" | "approved" | "rejected" | string;
  rejection_reason?: string | null;
  file_url?: string | null;
  file_path?: string | null;
  updated_at?: string | null;
};

type DocsResponse = {
  identity?: { single?: DocItem | null };
  driver_license?: { front?: DocItem | null; back?: DocItem | null };
  international_driver_license?: {
    front?: DocItem | null;
    back?: DocItem | null;
  };
  visa?: { single?: DocItem | null };
};

type Slot = {
  key: string;
  title: string;
  hint?: string;
  type: DocumentType;
  side: DocumentSide;
  doc: DocItem | null;
};

type PendingConfirm = {
  slot: Slot;
  file: File;
  objectUrl: string;
};

export default function ProfileDocuments() {
  const [docs, setDocs] = useState<DocsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploadingKey, setUploadingKey] = useState<string | null>(null);

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [pendingConfirm, setPendingConfirm] = useState<PendingConfirm | null>(
    null,
  );

  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const data = (await getUserDocuments()) as DocsResponse;
      setDocs(data);
    } catch (e: any) {
      console.error(e);
      toast.error("خطا در دریافت مدارک");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    return () => {
      if (pendingConfirm?.objectUrl)
        URL.revokeObjectURL(pendingConfirm.objectUrl);
    };
  }, [pendingConfirm]);

  const slots: Slot[] = useMemo(() => {
    return [
      {
        key: "identity_single",
        title: "کارت ملی",
        hint: "عکس واضح از کارت ملی",
        type: "identity",
        side: "single",
        doc: docs?.identity?.single ?? null,
      },
      {
        key: "dl_front",
        title: "گواهینامه (رو)",
        hint: "روی گواهینامه",
        type: "driver_license",
        side: "front",
        doc: docs?.driver_license?.front ?? null,
      },
      {
        key: "dl_back",
        title: "گواهینامه (پشت)",
        hint: "پشت گواهینامه",
        type: "driver_license",
        side: "back",
        doc: docs?.driver_license?.back ?? null,
      },
      {
        key: "intl_dl_front",
        title: "گواهینامه بین‌المللی (رو)",
        type: "international_driver_license",
        side: "front",
        doc: docs?.international_driver_license?.front ?? null,
      },
      {
        key: "intl_dl_back",
        title: "گواهینامه بین‌المللی (پشت)",
        type: "international_driver_license",
        side: "back",
        doc: docs?.international_driver_license?.back ?? null,
      },
      {
        key: "visa_single",
        title: "ویزا",
        type: "visa",
        side: "single",
        doc: docs?.visa?.single ?? null,
      },
    ];
  }, [docs]);

  const validateFile = (file: File) => {
    const okTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!okTypes.includes(file.type)) {
      toast.warning("فرمت فایل باید jpg/png/webp باشد");
      return false;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.warning("حداکثر حجم فایل 10MB است");
      return false;
    }
    return true;
  };

  const resetInput = (slotKey: string) => {
    const el = fileInputRefs.current[slotKey];
    if (el) el.value = "";
  };

  // ✅ فقط مودال: آپلود انجام نمی‌شود
  const onPickFile = (slot: Slot, file: File | null) => {
    if (!file) return;
    if (!validateFile(file)) {
      resetInput(slot.key);
      return;
    }

    if (pendingConfirm?.objectUrl)
      URL.revokeObjectURL(pendingConfirm.objectUrl);

    const objectUrl = URL.createObjectURL(file);
    setPendingConfirm({ slot, file, objectUrl });
  };

  const closeConfirm = () => {
    if (pendingConfirm?.objectUrl)
      URL.revokeObjectURL(pendingConfirm.objectUrl);
    const slotKey = pendingConfirm?.slot.key;
    setPendingConfirm(null);
    if (slotKey) resetInput(slotKey);
  };

  // ✅ آپلود فقط بعد از تایید
  const confirmUpload = async () => {
    if (!pendingConfirm) return;

    const { slot, file, objectUrl } = pendingConfirm;

    try {
      setUploadingKey(slot.key);
      setPendingConfirm(null);

      await uploadUserDocumentSingle(slot.type, slot.side, file);

      toast.success("مدرک با موفقیت آپدیت شد");
      await load();
    } catch (e: any) {
      console.error(e);
      toast.error(e?.response?.data?.message || "خطا در آپلود مدرک");
    } finally {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
      resetInput(slot.key);
      setUploadingKey(null);
    }
  };

  return (
    <div className="rounded-2xl border bg-card p-4 md:p-6">
      {/* Header */}
      <div className="flex items-start md:items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold">مدارک آپلود شده</h2>
          <p className="text-xs text-muted-foreground mt-1 leading-5">
            فایل را انتخاب کن؛ بعد از پیش‌نمایش و تایید، آپلود انجام می‌شود.
          </p>
        </div>

        <button
          type="button"
          onClick={load}
          disabled={loading}
          className={cn(
            "h-10 px-3 rounded-xl border flex items-center gap-2 text-sm shrink-0",
            "hover:bg-muted/60 transition disabled:opacity-60",
          )}
        >
          <RefreshCcw className={cn("h-4 w-4", loading && "animate-spin")} />
          بروزرسانی
        </button>
      </div>

      <div className="h-px bg-border my-4" />

      {/* Grid */}
      {loading ? (
        <div className="text-sm text-muted-foreground py-10 text-center">
          در حال دریافت مدارک...
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {slots.map((s) => {
            const hasFile = Boolean(s.doc?.file_url);
            const isUploading = uploadingKey === s.key;
            const status = s.doc?.status;

            return (
              <div
                key={s.key}
                className="rounded-2xl border bg-background p-3 hover:shadow-sm transition-shadow"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    {/* ✅ اینجا همیشه: اگر فایل ندارد => آپلود نشده (بدون hint) */}
                    <div className="text-xs text-muted-foreground mt-1">
                      {hasFile ? "آپلود شده" : "آپلود نشده"}
                    </div>
                  </div>
                </div>

                {String(status || "").toLowerCase() === "rejected" &&
                s.doc?.rejection_reason ? (
                  <div className="mt-2 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-xl px-3 py-2">
                    دلیل رد: {s.doc.rejection_reason}
                  </div>
                ) : null}

                {/* ✅ تصویر فقط وقتی فایل هست رندر میشه (هیچ placeholder نمی‌افته) */}
                {hasFile ? (
                  <div className="mt-3">
                    <button
                      type="button"
                      onClick={() => setPreviewUrl(String(s.doc?.file_url))}
                      className={cn(
                        "w-full rounded-xl border overflow-hidden bg-muted/20 hover:bg-muted/30 transition",
                        "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
                      )}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={String(s.doc?.file_url)}
                        alt={s.title}
                        className="w-full h-40 object-cover"
                        loading="lazy"
                      />
                    </button>
                  </div>
                ) : null}

                {/* actions */}
                <div
                  className={cn(
                    "mt-3 flex items-center gap-2",
                    !hasFile && "mt-4",
                  )}
                >
                  {/* ✅ مشاهده فقط وقتی فایل هست */}
                  {hasFile ? (
                    <button
                      type="button"
                      onClick={() => setPreviewUrl(String(s.doc?.file_url))}
                      className="h-10 px-3 rounded-xl border text-sm flex items-center gap-2 hover:bg-muted/60 transition"
                    >
                      <Eye className="h-4 w-4" />
                      مشاهده
                    </button>
                  ) : null}

                  <label
                    className={cn(
                      "flex-1 h-10 px-3 rounded-xl border text-sm flex items-center justify-center gap-2 cursor-pointer",
                      "hover:bg-muted/60 transition",
                      isUploading && "opacity-70 pointer-events-none",
                    )}
                  >
                    <UploadCloud
                      className={cn("h-4 w-4", isUploading && "animate-pulse")}
                    />
                    {isUploading
                      ? "در حال آپلود..."
                      : hasFile
                        ? "ویرایش / جایگزین"
                        : "آپلود"}

                    <input
                      ref={(el) => {
                        fileInputRefs.current[s.key] = el;
                      }}
                      type="file"
                      hidden
                      accept="image/jpeg,image/png,image/webp"
                      onChange={(e) =>
                        onPickFile(s, e.target.files?.[0] ?? null)
                      }
                    />
                  </label>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Image Preview Modal */}
      {previewUrl ? (
        <div
          className="fixed inset-0 z-[999] bg-black/60 flex items-center justify-center p-4"
          onClick={() => setPreviewUrl(null)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="relative max-w-3xl w-full bg-background rounded-2xl border overflow-hidden shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="absolute top-3 right-3 h-9 w-9 rounded-xl border bg-background hover:bg-muted/60 flex items-center justify-center"
              onClick={() => setPreviewUrl(null)}
              aria-label="بستن"
            >
              <X className="h-4 w-4" />
            </button>

            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewUrl}
              alt="preview"
              className="w-full max-h-[80vh] object-contain bg-black/5"
            />
          </div>
        </div>
      ) : null}

      {/* Confirm Modal */}
      {pendingConfirm ? (
        <div
          className="fixed inset-0 z-[1000] bg-black/60 flex items-center justify-center p-4"
          onClick={closeConfirm}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="relative max-w-xl w-full bg-background rounded-2xl border overflow-hidden shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 md:p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-amber-600" />
                    <h3 className="font-bold text-sm md:text-base">
                      تأیید آپدیت مدرک
                    </h3>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2 leading-5">
                    مطمئنی می‌خوای{" "}
                    <span className="font-bold text-foreground">
                      {pendingConfirm.slot.title}
                    </span>{" "}
                    رو آپدیت کنی؟
                    <br />
                    فقط بعد از تایید، آپلود انجام می‌شود.
                  </p>
                </div>

                <button
                  type="button"
                  className="h-9 w-9 rounded-xl border hover:bg-muted/60 flex items-center justify-center shrink-0"
                  onClick={closeConfirm}
                  aria-label="بستن"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="rounded-xl border overflow-hidden">
                  <div className="px-3 py-2 text-xs text-muted-foreground border-b bg-muted/20">
                    مدرک فعلی
                  </div>
                  {pendingConfirm.slot.doc?.file_url ? (
                    <button
                      type="button"
                      className="w-full"
                      onClick={() =>
                        setPreviewUrl(String(pendingConfirm.slot.doc?.file_url))
                      }
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={String(pendingConfirm.slot.doc?.file_url)}
                        alt="current"
                        className="w-full h-44 object-cover bg-muted/10"
                      />
                    </button>
                  ) : (
                    <div className="w-full h-44 flex items-center justify-center text-xs text-muted-foreground bg-muted/10">
                      مدرک قبلی ندارد
                    </div>
                  )}
                </div>

                <div className="rounded-xl border overflow-hidden">
                  <div className="px-3 py-2 text-xs text-muted-foreground border-b bg-muted/20">
                    مدرک جدید
                  </div>
                  <button
                    type="button"
                    className="w-full"
                    onClick={() => setPreviewUrl(pendingConfirm.objectUrl)}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={pendingConfirm.objectUrl}
                      alt="new"
                      className="w-full h-44 object-cover bg-muted/10"
                    />
                  </button>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={closeConfirm}
                  disabled={uploadingKey === pendingConfirm.slot.key}
                  className="h-10 px-4 rounded-xl border text-sm hover:bg-muted/60 transition disabled:opacity-60"
                >
                  انصراف
                </button>

                <button
                  type="button"
                  onClick={confirmUpload}
                  disabled={uploadingKey === pendingConfirm.slot.key}
                  className={cn(
                    "h-10 px-4 rounded-xl text-sm text-white",
                    "bg-primary hover:opacity-90 transition",
                    "disabled:opacity-60 disabled:pointer-events-none",
                  )}
                >
                  {uploadingKey === pendingConfirm.slot.key
                    ? "در حال آپلود..."
                    : "تأیید و آپدیت"}
                </button>
              </div>

              <div className="mt-3 text-[11px] text-muted-foreground">
                نکته: بعد از آپدیت، ممکن است وضعیت بررسی دوباره «در انتظار
                بررسی» شود.
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
