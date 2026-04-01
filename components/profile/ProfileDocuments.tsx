"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { toast } from "react-toastify";
import { useTranslations } from "next-intl";
import {
  UploadCloud,
  RefreshCcw,
  Eye,
  X,
  AlertTriangle,
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
  const t = useTranslations("profile.documents");

  const [docs, setDocs] = useState<DocsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploadingKey, setUploadingKey] = useState<string | null>(null);

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [pendingConfirm, setPendingConfirm] = useState<PendingConfirm | null>(
    null
  );

  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const data = (await getUserDocuments()) as DocsResponse;
      setDocs(data);
    } catch (e: any) {
      console.error(e);
      toast.error(t("toasts.fetchError"));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    return () => {
      if (pendingConfirm?.objectUrl) {
        URL.revokeObjectURL(pendingConfirm.objectUrl);
      }
    };
  }, [pendingConfirm]);

  const slots: Slot[] = useMemo(() => {
    return [
      {
        key: "identity_single",
        title: t("items.identity.title"),
        hint: t("items.identity.hint"),
        type: "identity",
        side: "single",
        doc: docs?.identity?.single ?? null,
      },
      {
        key: "dl_front",
        title: t("items.driverLicenseFront.title"),
        hint: t("items.driverLicenseFront.hint"),
        type: "driver_license",
        side: "front",
        doc: docs?.driver_license?.front ?? null,
      },
      {
        key: "dl_back",
        title: t("items.driverLicenseBack.title"),
        hint: t("items.driverLicenseBack.hint"),
        type: "driver_license",
        side: "back",
        doc: docs?.driver_license?.back ?? null,
      },
      {
        key: "intl_dl_front",
        title: t("items.internationalDriverLicenseFront.title"),
        hint: t("items.internationalDriverLicenseFront.hint"),
        type: "international_driver_license",
        side: "front",
        doc: docs?.international_driver_license?.front ?? null,
      },
      {
        key: "intl_dl_back",
        title: t("items.internationalDriverLicenseBack.title"),
        hint: t("items.internationalDriverLicenseBack.hint"),
        type: "international_driver_license",
        side: "back",
        doc: docs?.international_driver_license?.back ?? null,
      },
      {
        key: "visa_single",
        title: t("items.visa.title"),
        hint: t("items.visa.hint"),
        type: "visa",
        side: "single",
        doc: docs?.visa?.single ?? null,
      },
    ];
  }, [docs, t]);

  const validateFile = (file: File) => {
    const okTypes = ["image/jpeg", "image/png", "image/webp"];

    if (!okTypes.includes(file.type)) {
      toast.warning(t("toasts.invalidFormat"));
      return false;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.warning(t("toasts.maxSize"));
      return false;
    }

    return true;
  };

  const resetInput = (slotKey: string) => {
    const el = fileInputRefs.current[slotKey];
    if (el) el.value = "";
  };

  const onPickFile = (slot: Slot, file: File | null) => {
    if (!file) return;

    if (!validateFile(file)) {
      resetInput(slot.key);
      return;
    }

    if (pendingConfirm?.objectUrl) {
      URL.revokeObjectURL(pendingConfirm.objectUrl);
    }

    const objectUrl = URL.createObjectURL(file);
    setPendingConfirm({ slot, file, objectUrl });
  };

  const closeConfirm = () => {
    if (pendingConfirm?.objectUrl) {
      URL.revokeObjectURL(pendingConfirm.objectUrl);
    }

    const slotKey = pendingConfirm?.slot.key;
    setPendingConfirm(null);

    if (slotKey) resetInput(slotKey);
  };

  const confirmUpload = async () => {
    if (!pendingConfirm) return;

    const { slot, file, objectUrl } = pendingConfirm;

    try {
      setUploadingKey(slot.key);
      setPendingConfirm(null);

      await uploadUserDocumentSingle(slot.type, slot.side, file);

      toast.success(t("toasts.uploadSuccess"));
      await load();
    } catch (e: any) {
      console.error(e);
      toast.error(
        e?.response?.data?.message || t("toasts.uploadError")
      );
    } finally {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
      resetInput(slot.key);
      setUploadingKey(null);
    }
  };

  const getStatusText = (status?: string | null) => {
    const s = String(status || "").toLowerCase();

    if (s === "approved") return t("status.approved");
    if (s === "rejected") return t("status.rejected");
    if (s === "pending") return t("status.pending");

    return null;
  };

  return (
    <div className="rounded-2xl border bg-card p-4 md:p-6">
      <div className="flex items-start justify-between gap-3 md:items-center">
        <div>
          <h2 className="text-base font-bold">{t("title")}</h2>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">
            {t("subtitle")}
          </p>
        </div>

        <button
          type="button"
          onClick={load}
          disabled={loading}
          className={cn(
            "flex h-10 shrink-0 items-center gap-2 rounded-xl border px-3 text-sm",
            "transition hover:bg-muted/60 disabled:opacity-60"
          )}
        >
          <RefreshCcw className={cn("h-4 w-4", loading && "animate-spin")} />
          {t("actions.refresh")}
        </button>
      </div>

      <div className="my-4 h-px bg-border" />

      {loading ? (
        <div className="py-10 text-center text-sm text-muted-foreground">
          {t("loading")}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {slots.map((s) => {
            const hasFile = Boolean(s.doc?.file_url);
            const isUploading = uploadingKey === s.key;
            const status = s.doc?.status;
            const statusText = getStatusText(status);

            return (
              <div
                key={s.key}
                className="rounded-2xl border bg-background p-3 transition-shadow hover:shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="text-sm font-bold text-foreground">
                      {s.title}
                    </h3>

                    {s.hint ? (
                      <div className="mt-1 text-xs text-muted-foreground">
                        {s.hint}
                      </div>
                    ) : null}

                    <div className="mt-2 text-xs text-muted-foreground">
                      {hasFile ? t("fileState.uploaded") : t("fileState.notUploaded")}
                    </div>

                    {statusText ? (
                      <div className="mt-1 text-xs text-muted-foreground">
                        {t("labels.status", { value: statusText })}
                      </div>
                    ) : null}
                  </div>
                </div>

                {String(status || "").toLowerCase() === "rejected" &&
                s.doc?.rejection_reason ? (
                  <div className="mt-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
                    {t("rejectionReason", { reason: s.doc.rejection_reason })}
                  </div>
                ) : null}

                {hasFile ? (
                  <div className="mt-3">
                    <button
                      type="button"
                      onClick={() => setPreviewUrl(String(s.doc?.file_url))}
                      className={cn(
                        "w-full overflow-hidden rounded-xl border bg-muted/20 transition hover:bg-muted/30",
                        "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                      )}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={String(s.doc?.file_url)}
                        alt={s.title}
                        className="h-40 w-full object-cover"
                        loading="lazy"
                      />
                    </button>
                  </div>
                ) : null}

                <div
                  className={cn(
                    "mt-3 flex items-center gap-2",
                    !hasFile && "mt-4"
                  )}
                >
                  {hasFile ? (
                    <button
                      type="button"
                      onClick={() => setPreviewUrl(String(s.doc?.file_url))}
                      className="flex h-10 items-center gap-2 rounded-xl border px-3 text-sm transition hover:bg-muted/60"
                    >
                      <Eye className="h-4 w-4" />
                      {t("actions.view")}
                    </button>
                  ) : null}

                  <label
                    className={cn(
                      "flex h-10 flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl border px-3 text-sm",
                      "transition hover:bg-muted/60",
                      isUploading && "pointer-events-none opacity-70"
                    )}
                  >
                    <UploadCloud
                      className={cn("h-4 w-4", isUploading && "animate-pulse")}
                    />
                    {isUploading
                      ? t("actions.uploading")
                      : hasFile
                        ? t("actions.replace")
                        : t("actions.upload")}

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

      {previewUrl ? (
        <div
          className="fixed inset-0 z-[999] flex items-center justify-center bg-black/60 p-4"
          onClick={() => setPreviewUrl(null)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="relative w-full max-w-3xl overflow-hidden rounded-2xl border bg-background shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-xl border bg-background hover:bg-muted/60"
              onClick={() => setPreviewUrl(null)}
              aria-label={t("actions.close")}
            >
              <X className="h-4 w-4" />
            </button>

            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewUrl}
              alt={t("previewAlt")}
              className="max-h-[80vh] w-full object-contain bg-black/5"
            />
          </div>
        </div>
      ) : null}

      {pendingConfirm ? (
        <div
          className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/60 p-4"
          onClick={closeConfirm}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="relative w-full max-w-xl overflow-hidden rounded-2xl border bg-background shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 md:p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-amber-600" />
                    <h3 className="text-sm font-bold md:text-base">
                      {t("confirm.title")}
                    </h3>
                  </div>
                  <p className="mt-2 text-xs leading-5 text-muted-foreground">
                    {t("confirm.description", {
                      title: pendingConfirm.slot.title,
                    })}
                  </p>
                </div>

                <button
                  type="button"
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border hover:bg-muted/60"
                  onClick={closeConfirm}
                  aria-label={t("actions.close")}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="overflow-hidden rounded-xl border">
                  <div className="border-b bg-muted/20 px-3 py-2 text-xs text-muted-foreground">
                    {t("confirm.currentDocument")}
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
                        alt={t("confirm.currentAlt")}
                        className="h-44 w-full bg-muted/10 object-cover"
                      />
                    </button>
                  ) : (
                    <div className="flex h-44 w-full items-center justify-center bg-muted/10 text-xs text-muted-foreground">
                      {t("confirm.noPreviousDocument")}
                    </div>
                  )}
                </div>

                <div className="overflow-hidden rounded-xl border">
                  <div className="border-b bg-muted/20 px-3 py-2 text-xs text-muted-foreground">
                    {t("confirm.newDocument")}
                  </div>

                  <button
                    type="button"
                    className="w-full"
                    onClick={() => setPreviewUrl(pendingConfirm.objectUrl)}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={pendingConfirm.objectUrl}
                      alt={t("confirm.newAlt")}
                      className="h-44 w-full bg-muted/10 object-cover"
                    />
                  </button>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={closeConfirm}
                  disabled={uploadingKey === pendingConfirm.slot.key}
                  className="h-10 rounded-xl border px-4 text-sm transition hover:bg-muted/60 disabled:opacity-60"
                >
                  {t("actions.cancel")}
                </button>

                <button
                  type="button"
                  onClick={confirmUpload}
                  disabled={uploadingKey === pendingConfirm.slot.key}
                  className={cn(
                    "h-10 rounded-xl bg-primary px-4 text-sm text-white transition hover:opacity-90",
                    "disabled:pointer-events-none disabled:opacity-60"
                  )}
                >
                  {uploadingKey === pendingConfirm.slot.key
                    ? t("actions.uploading")
                    : t("actions.confirmAndUpdate")}
                </button>
              </div>

              <div className="mt-3 text-[11px] text-muted-foreground">
                {t("confirm.note")}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}