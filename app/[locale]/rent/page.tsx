/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocale } from 'next-intl';

import { api } from '@/lib/apiClient';
import { Loader2, RefreshCcw, ArrowRight, CheckCircle2, Clock, XCircle, Hash } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { useRouter } from '@/i18n/navigation';

type StatusApiResponse = {
  status: number;
  message?: string;
  data?: {
    rent_code: string;
    rent_id: number;
    rent_status: string;
    is_approved: boolean;
    car_id?: number;
    branch_id?: number;
    from_date?: string;
    to_date?: string;
    created_at?: string;
  };
};

export default function RentStatusPage() {
  const locale = useLocale();
  const router = useRouter();
  const sp = useSearchParams();

  const rent_code = sp.get('rent_code') || '';
  const rent_id = sp.get('rent_id') || '';
  const car_id = sp.get('car_id') || '';
  const branch_id = sp.get('branch_id') || '';
  const from = sp.get('from') || '';
  const to = sp.get('to') || '';

  const hasRequired = useMemo(() => Boolean(rent_code), [rent_code]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string>('');
  const [data, setData] = useState<StatusApiResponse['data'] | null>(null);

  // ✅ FIX: از ref استفاده میکنیم تا interval به data قدیمی (stale closure) دسترسی نداشته باشه
  const dataRef = useRef<StatusApiResponse['data'] | null>(null);
  useEffect(() => {
    dataRef.current = data;
  }, [data]);

  const fetchStatus = async (silent = false) => {
    if (!hasRequired) {
      setError('rent_code وجود ندارد.');
      setLoading(false);
      return;
    }

    if (!silent) setRefreshing(true);
    setError('');

    try {
      const res = await api.get(`/car/rent/${locale}/status/${encodeURIComponent(rent_code)}`);
      const body = res.data as StatusApiResponse;

      if (res.status === 200 && body?.status === 200 && body?.data) {
        setData(body.data);
      } else {
        setError(body?.message || 'خطا در دریافت وضعیت رزرو');
      }
    } catch (e: any) {
      setError(e?.message || 'خطا در ارتباط با سرور');
    } finally {
      setLoading(false);
      if (!silent) setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStatus(true);

    // ✅ FIX: از dataRef استفاده میکنیم تا stale closure نداشته باشیم
    // قبلاً data داخل interval همیشه null بود چون closure قدیمی بود
    const i = setInterval(() => {
      const st = dataRef.current?.rent_status;
      // فقط اگه هنوز pending بود یا هنوز لود نشده، poll کن
      if (!st || st === 'pending') {
        fetchStatus(true);
      } else {
        // وضعیت نهایی شده، interval رو پاک کن
        clearInterval(i);
      }
    }, 5000);

    return () => clearInterval(i);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rent_code]);

  const status = data?.rent_status || 'pending';

  const StatusBox = () => {
    if (loading) {
      return (
        <div className="flex items-center gap-3 text-gray-700">
          <Loader2 className="size-5 animate-spin" />
          <span>در حال بررسی وضعیت رزرو...</span>
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex items-start gap-3 text-red-700">
          <XCircle className="size-6 mt-0.5" />
          <div>
            <div className="font-bold">خطا</div>
            <div className="text-sm mt-1">{error}</div>
          </div>
        </div>
      );
    }

    if (status === 'active') {
      return (
        <div className="flex items-start gap-3 text-emerald-700">
          <CheckCircle2 className="size-7 mt-0.5" />
          <div>
            <div className="font-bold text-lg">رزرو تایید شد ✅</div>
            <div className="text-sm mt-1">status: {status}</div>
          </div>
        </div>
      );
    }

    if (status === 'rejected' || status === 'canceled') {
      return (
        <div className="flex items-start gap-3 text-red-700">
          <XCircle className="size-7 mt-0.5" />
          <div>
            <div className="font-bold text-lg">رزرو تایید نشد</div>
            <div className="text-sm mt-1">status: {status}</div>
          </div>
        </div>
      );
    }

    return (
      <div className="flex items-start gap-3 text-amber-700">
        <Clock className="size-7 mt-0.5" />
        <div>
          <div className="font-bold text-lg">در انتظار تایید…</div>
          <div className="text-sm mt-1">status: {status}</div>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <div className="bg-white border border-[#0000001f] shadow-[0_2px_10px_-4px_rgba(0,0,0,.12)] rounded-3xl p-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-extrabold text-gray-900">وضعیت رزرو</h1>
            <p className="text-sm text-gray-500 mt-1">رزرو شما ثبت شده و اینجا وضعیتش نمایش داده میشه.</p>
          </div>

          <button
            onClick={() => fetchStatus(false)}
            disabled={refreshing}
            className="px-4 py-2 rounded-xl border border-gray-200 hover:bg-gray-50 transition flex items-center gap-2 text-sm"
          >
            {refreshing ? <Loader2 className="size-4 animate-spin" /> : <RefreshCcw className="size-4" />}
            بروزرسانی
          </button>
        </div>

        <div className="mt-6 p-4 rounded-2xl bg-gray-50 border border-gray-100">
          <StatusBox />
        </div>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-3">
          <InfoRow label="rent_code" value={rent_code} />
          <InfoRow label="rent_id" value={rent_id} />
          <InfoRow label="car_id" value={car_id || String(data?.car_id ?? '')} />
          <InfoRow label="branch_id" value={branch_id || String(data?.branch_id ?? '')} />
          <InfoRow label="from" value={from || String(data?.from_date ?? '')} />
          <InfoRow label="to" value={to || String(data?.to_date ?? '')} />
        </div>

        <div className="mt-6 flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 transition flex items-center gap-2 text-sm"
          >
            <ArrowRight className="size-4 rotate-180" />
            برگشت
          </button>

          <button
            onClick={() => router.push(`/`)}
            className="px-4 py-2 rounded-xl bg-[#3B82F6] text-white hover:bg-[#2563EB] transition text-sm"
          >
            صفحه اصلی
          </button>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-2 px-4 py-3 rounded-2xl border border-gray-100 bg-white">
      <div className="text-xs text-gray-500 flex items-center gap-2">
        <Hash className="size-4" />
        {label}
      </div>
      <div className="text-sm font-bold text-gray-800 break-all">{value || '-'}</div>
    </div>
  );
}