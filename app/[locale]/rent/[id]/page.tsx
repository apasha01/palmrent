/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useEffect, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { api } from '@/lib/apiClient';

export default function RentPage({ params } : { params: { rentId: string } | any }) {
  const t = useTranslations();
  const locale = useLocale();
  const rentId = params?.rentId;

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!rentId) return;

    const run = async () => {
      setLoading(true);
      try {
        // ✅ این endpoint رو با endpoint واقعی خودت ست کن
        const res = await api.get(`/rent/${rentId}/${locale}`);

        if (res.status === 200) setData(res.data);
        else throw new Error('خطا در دریافت اطلاعات رزرو');
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };

    run();
  }, [rentId, locale]);

  if (loading) {
    return (
      <div className="w-full flex items-center justify-center py-24">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#3B82F6]" />
      </div>
    );
  }

  if (!data) {
    return <div className="p-6 text-center text-gray-500">اطلاعات رزرو یافت نشد</div>;
  }

  // اینجا بسته به response واقعی، مپ کن
  const item = data || data;
  console.log(item);

  return (
    <div className="max-w-3xl mx-auto p-4">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <div className="text-lg font-bold mb-4">وچر رزرو</div>

        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="text-gray-500">کد رزرو</div>
          {/* <div className="font-semibold">{item?.rent_code || item?.code || '-'}</div> */}

          <div className="text-gray-500">نام</div>
          {/* <div className="font-semibold">{item?.name || '-'}</div> */}

          <div className="text-gray-500">موبایل</div>
          {/* <div className="font-semibold">{item?.phone || '-'}</div> */}

          <div className="text-gray-500">از</div>
          {/* <div className="font-semibold">{item?.rent_from || '-'}</div> */}

          <div className="text-gray-500">تا</div>
          {/* <div className="font-semibold">{item?.rent_to || '-'}</div> */}

          <div className="text-gray-500">مبلغ کل</div>
          {/* <div className="font-semibold">{item?.total || '-'} {t('AED')}</div> */}

          <div className="text-gray-500">وضعیت</div>
          {/* <div className="font-semibold">{item?.rent_status || '-'}</div> */}
        </div>
      </div>
    </div>
  );
}
