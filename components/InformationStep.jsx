'use client';

import { useLocale, useTranslations } from 'next-intl';
import Image from 'next/image';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';
import { useDispatch, useSelector } from 'react-redux';

// ✅ Lucide Icons
import {
  ChevronDown,
  Info,
  UserSearch,
  Check,
  ArrowUpDown,
  LayoutGrid,
} from 'lucide-react';

import InfoListPopup from './InfoListPopup';
import LocationPopup from './LocationPopup';
import { SingleCarOptions } from './SingleCar';

// Redux Actions
import { selectCar } from '@/redux/slices/carListSlice';
import {
  changeAreLocationsSame,
  changeDeliveryLocation,
  changeDescriptionPopup,
  changeIsInfoListOpen,
  changeIsLocationPopupOpen,
  changeReturnLocation,
  changeRoadMapStep,
} from '@/redux/slices/globalSlice';

// Utils & API
import { api } from '@/lib/apiClient';
import { dateDifference } from '@/lib/getDateDiffrence';
import { toast } from 'react-toastify';
import { STORAGE_URL } from '../lib/apiClient';

export default function InformationStep() {
  const t = useTranslations();
  const locale = useLocale();
  const dispatch = useDispatch();
  const searchParams = useSearchParams();
  const router = useRouter();

  // -- Global State & Params --
  const reduxSelectedCarId = useSelector((state) => state.carList.selectedCarId);
  const urlCarId = searchParams.get('car_id');
  const selectedCarId = reduxSelectedCarId || urlCarId;

  const urlFrom = searchParams.get('from');
  const urlTo = searchParams.get('to');
  const reduxCarDates = useSelector((state) => state.global.carDates);
  const carDates = urlFrom && urlTo ? [urlFrom, urlTo] : reduxCarDates;

  const branchId = useSelector((state) => state.search.branch_id);
  const deliveryLocation = useSelector((state) => state.global.deliveryLocation);
  const returnLocation = useSelector((state) => state.global.returnLocation);
  const areLocationsSame = useSelector((state) => state.global.areLocationsSame);
  const isLocationPopupOpen = useSelector((state) => state.global.isLocationPopupOpen);
  const isInfoListOpen = useSelector((state) => state.global.isInfoListOpen);

  // -- Local State --
  const [apiData, setApiData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedOptions, setSelectedOptions] = useState([]);
  const [insuranceComplete, setInsuranceComplete] = useState(false);
  const [isLocationReturn, setIsLocationReturn] = useState(false);

  // ✅ loading state for reserve button
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [userInfo, setUserInfo] = useState({
    name: '',
    email: '',
    phone: '',
  });

  // 1) Initial Data Fetch
  useEffect(() => {
    if (!selectedCarId || selectedCarId === 'null') {
      dispatch(changeRoadMapStep(1));
      return;
    }

    if (!carDates || !carDates[0] || !carDates[1]) {
      toast.error('تاریخ رزرو نامعتبر است');
      dispatch(changeRoadMapStep(1));
      return;
    }

    if (!reduxSelectedCarId && urlCarId) {
      dispatch(selectCar(urlCarId));
    }

    async function fetchCalc() {
      setIsLoading(true);
      try {
        const params = new URLSearchParams();
        params.append('branch_id', branchId || '1');
        params.append('from', carDates[0]);
        params.append('to', carDates[1]);

        const url = `/car/rent/${selectedCarId}/${locale}?${params.toString()}`;
        const res = await api.get(url);

        if (res.status === 200) setApiData(res.data);
        else {
          console.warn('Invalid response status:', res.status);
          toast.error('خطا در دریافت اطلاعات. لطفا مجدد تلاش کنید.');
        }
      } catch (error) {
        console.error('Calculation Error:', error);
        toast.error('خطا در ارتباط با سرور.');
      } finally {
        setIsLoading(false);
      }
    }

    fetchCalc();
  }, [selectedCarId, carDates?.[0], carDates?.[1], branchId, locale, reduxSelectedCarId, urlCarId, dispatch]);

  // 2) Real-time Totals Calculation & Breakdown
  const totals = useMemo(() => {
    const safeTotals = { total: 0, prePay: 0, debt: 0, tax: 0, rentDays: 0, dailyPrice: 0, extraItems: [] };
    if (!apiData || !apiData.item) return safeTotals;

    let totalPrice = parseFloat(apiData.item.pay_price) || 0;
    let prePayPrice = parseFloat(apiData.item.pre_pay_price) || 0;
    let dailyPrice = parseFloat(apiData.item.rent_price_day) || 0;
    let extraItems = [];

    // Rent Days Calculation
    let rentDays = parseInt(apiData.item.rent_days);
    if (!rentDays || isNaN(rentDays) || rentDays === 0) {
      try {
        if (carDates && carDates.length === 2) {
          const diff = dateDifference(carDates[0], carDates[1]);
          rentDays = diff.days || 1;
        }
      } catch {
        rentDays = 1;
      }
    }
    rentDays = rentDays > 0 ? rentDays : 1;

    if (dailyPrice === 0 && totalPrice > 0) dailyPrice = totalPrice / rentDays;

    // Options
    if (apiData.options && Array.isArray(apiData.options)) {
      selectedOptions.forEach((optId) => {
        const opt = apiData.options.find((o) => o.id === optId);
        if (!opt) return;
        const optPrice = parseFloat(opt.price_pay || 0);
        totalPrice += optPrice;
        prePayPrice += parseFloat(opt.pre_price_pay || 0);
        if (optPrice > 0) extraItems.push({ title: opt.title, price: optPrice });
      });
    }

    // Insurance
    if (insuranceComplete) {
      const insPrice = parseFloat(apiData.item.insurance_complete_price_pay || 0);
      totalPrice += insPrice;
      prePayPrice += parseFloat(apiData.item.pre_price_insurance_complete_price_pay || 0);
      if (insPrice > 0) extraItems.push({ title: t('insurancePrice') || 'بیمه کامل', price: insPrice });
    }

    // Locations
    if (apiData.places && Array.isArray(apiData.places)) {
      // Delivery
      if (deliveryLocation?.location && deliveryLocation.location !== 'desired') {
        const delPlace = apiData.places.find((p) => p && String(p.id) === String(deliveryLocation.location));
        if (delPlace) {
          const delPrice = parseFloat(delPlace.price_pay || 0);
          totalPrice += delPrice;
          prePayPrice += parseFloat(delPlace.pre_price_pay || 0);
          if (delPrice > 0) extraItems.push({ title: `${t('deliveryPrice')}: ${delPlace.title}`, price: delPrice });
        }
      }

      // Return
      const targetReturnLoc = areLocationsSame ? deliveryLocation : returnLocation;
      if (targetReturnLoc?.location && targetReturnLoc.location !== 'desired') {
        if (!areLocationsSame) {
          const retPlace = apiData.places.find((p) => p && String(p.id) === String(targetReturnLoc.location));
          if (retPlace) {
            const retPrice = parseFloat(retPlace.price_pay || 0);
            totalPrice += retPrice;
            prePayPrice += parseFloat(retPlace.pre_price_pay || 0);
            if (retPrice > 0) extraItems.push({ title: `${t('returnPrice')}: ${retPlace.title}`, price: retPrice });
          }
        }
      }
    }

    // Tax
    let tax = 0;
    const taxPercent = parseFloat(apiData.item.tax_percent || 0);
    if (taxPercent > 0) {
      tax = totalPrice * (taxPercent / 100);
      totalPrice += tax;
      if (apiData.collage_tax_in === 'no') prePayPrice += tax;
    }

    return {
      total: totalPrice,
      prePay: prePayPrice,
      debt: totalPrice - prePayPrice,
      tax,
      rentDays,
      dailyPrice,
      extraItems,
    };
  }, [apiData, selectedOptions, insuranceComplete, deliveryLocation, returnLocation, areLocationsSame, carDates, t]);

  // 3) Submit (ثبت اطلاعات + انتقال به /rent/{rent_id})
  const handleSubmit = async () => {
    if (isSubmitting) return;

    if (!userInfo.name || !userInfo.phone) {
      toast.warning('لطفا نام و شماره تماس را وارد کنید');
      return;
    }
    if (!deliveryLocation?.location) {
      toast.warning('لطفا محل تحویل را انتخاب کنید');
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        branch_id: branchId || 1,
        from: carDates[0],
        to: carDates[1],
        place_delivery: deliveryLocation.location,
        address_delivery: deliveryLocation.isDesired ? deliveryLocation.address : '',
        place_return: areLocationsSame ? deliveryLocation.location : returnLocation.location || deliveryLocation.location,
        address_return: areLocationsSame
          ? (deliveryLocation.isDesired ? deliveryLocation.address : '')
          : returnLocation.isDesired
          ? returnLocation.address
          : '',
        first_name: userInfo.name,
        last_name: '.',
        phone: userInfo.phone,
        email: userInfo.email,
        option_check: selectedOptions,
        insurance_complete: insuranceComplete ? 'yes' : 'no',
      };

      const res = await api.post(`/car/rent/${selectedCarId}/${locale}/registration`, payload);

      if (res.status !== 200) throw new Error(res.message || 'خطا در ثبت رزرو');

      const rentId = res?.data?.item?.rent_id ?? res?.data?.rent_id;
      if (!rentId) {
        // اگر بک‌اند rent_id نداد، حداقل همون مرحله قبلی
        dispatch(changeRoadMapStep(3));
        toast.warning('رزرو ثبت شد ولی rent_id دریافت نشد');
        return;
      }

      const paymentUrl = res?.data?.payment_url || res?.data?.item?.payment_url;

      if (paymentUrl) {
        const cb = encodeURIComponent(`/rent/${rentId}`);
        const joiner = paymentUrl.includes('?') ? '&' : '?';
        window.location.href = `${paymentUrl}${joiner}callback=${cb}`;
        return;
      }

      toast.success('درخواست رزرو انجام شد');

      router.push(`/rent/reservation?status=initialize&rentid=${rentId}`);
    } catch (error) {
      console.error('Booking Error:', error);
      toast.error(error?.message || 'خطا در ثبت رزرو');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSelectUser = (user) => {
    setUserInfo({
      name: user.name || '',
      phone: user.phone || '',
      email: user.email || '',
    });
    dispatch(changeIsInfoListOpen(false));
  };

  if (isLoading || !apiData) {
    return (
      <div className="w-full flex flex-col items-center justify-center py-32 gap-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#3B82F6]"></div>
        <div className="text-gray-500 text-sm">در حال دریافت اطلاعات خودرو...</div>
      </div>
    );
  }

  return (
    <>
      <div className="flex w-full lg:flex-row flex-col-reverse flex-1 gap-4 lg:flex-nowrap flex-wrap pb-20">
        <div className="flex flex-col flex-1 lg:w-auto w-full h-fit">
          <DeliverySpot places={apiData.places || []} setIsLocationReturn={setIsLocationReturn} />

          <ExtraServices options={apiData.options || []} selected={selectedOptions} setSelected={setSelectedOptions} />

          <FineDeposit price={apiData.item.deposit_price} currency={apiData.currency} />

          <PaymentDetail data={apiData.item} totals={totals} currency={apiData.currency} toman={apiData.item.price_2_toman} />

          <PersonalInfoBox userInfo={userInfo} setUserInfo={setUserInfo} />

          <div className="sticky bottom-4 w-full z-50 flex justify-center">
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className={`w-11/12 rounded-2xl text-white p-4 text-lg font-bold transition-all shadow-xl shadow-blue-200/50 cursor-pointer
                ${isSubmitting ? 'bg-[#3B82F6]/70 cursor-not-allowed' : 'bg-[#3B82F6] hover:bg-[#2563EB]'}
              `}
            >
              <span className="flex items-center justify-center gap-2">
                {isSubmitting && (
                  <span className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-white border-b-transparent" />
                )}
                {isSubmitting ? '' : t('resButton')}
              </span>
            </button>
          </div>

          <div className="text-center text-[#8A8A8A] md:text-xs text-xs pb-4">{t('paymentNRequired')}</div>
        </div>

        <div className="lg:w-1/3 w-full flex h-fit lg:sticky top-24">
          <SideCarDetail item={apiData.item} totals={totals} />
        </div>
      </div>

      {isLocationPopupOpen && <LocationPopup isReturn={isLocationReturn} places={apiData.places || []} />}
      {isInfoListOpen && <InfoListPopup onSelect={handleSelectUser} />}
    </>
  );
}

// --- Sub Components ---

export function DeliverySpot({ setIsLocationReturn, places }) {
  const t = useTranslations();
  const dispatch = useDispatch();
  const areLocationsSame = useSelector((state) => state.global.areLocationsSame);
  const deliveryLocation = useSelector((state) => state.global.deliveryLocation);
  const returnLocation = useSelector((state) => state.global.returnLocation);

  const delPlace = places.find((p) => p && String(p.id) === String(deliveryLocation.location));
  const delTitle = delPlace ? delPlace.title : t('chooseDeliveryLoc');

  const retPlace = places.find((p) => p && String(p.id) === String(returnLocation.location));
  const retTitle = retPlace ? retPlace.title : t('chooseReturnLoc');

  function openLocationPopup(isReturn = false) {
    setIsLocationReturn(isReturn);
    dispatch(changeIsLocationPopupOpen(true));
  }

  return (
    <div className="border border-[#0000001f] shadow-[0_2px_5px_-1px_rgba(0,0,0,.08)] p-4 rounded-4xl my-4 flex-1 bg-white">
      <div className="mb-4">
        <div className="lg:text-base sm:text-sm text-xs font-semibold">{t('deliveryTitle')}</div>
      </div>

      <div>
        <div
          onClick={() => openLocationPopup(false)}
          className="md:text-sm sm:text-xs text-xs bg-[#F4F4F4] rounded-2xl p-4 flex items-center justify-between cursor-pointer hover:bg-gray-200 transition-colors"
        >
          <div>
            <div className="font-bold text-gray-700">{delTitle}</div>
            <div className="text-[#545454] text-xs mt-1">
              {t('from')} {places.length} {t('afterDeliveryNum')}
            </div>
          </div>

          <ChevronDown className="text-gray-500 rotate-[-90deg]" size={20} />
        </div>

        {deliveryLocation.isDesired && (
          <div className="mt-2 animate-fade-in px-1">
            <input
              type="text"
              value={deliveryLocation.address || ''}
              onChange={(e) => dispatch(changeDeliveryLocation({ ...deliveryLocation, address: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg p-3 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-200 transition-all bg-white"
              placeholder={t('optionalTitle')}
            />
          </div>
        )}

        <label className="flex gap-2 items-center my-4 lg:text-sm md:text-xs text-xs cursor-pointer select-none">
          <div className="relative">
            <input
              type="checkbox"
              checked={!areLocationsSame}
              onChange={() => dispatch(changeAreLocationsSame(!areLocationsSame))}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-focus:ring-4 peer-focus:ring-blue-300 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </div>
          <span className="text-gray-700 font-medium">{t('otherPlaces')}</span>
        </label>

        <div className={`overflow-hidden transition-all duration-300 ease-in-out ${areLocationsSame ? 'max-h-0 opacity-0' : 'max-h-40 opacity-100'}`}>
          <div
            onClick={() => openLocationPopup(true)}
            className="md:text-sm sm:text-xs text-xs bg-[#F4F4F4] rounded-2xl p-4 flex items-center justify-between cursor-pointer hover:bg-gray-200 transition-colors"
          >
            <div>
              <div className="font-bold text-gray-700">{retTitle}</div>
              <div className="text-[#545454] text-xs mt-1">
                {t('from')} {places.length} {t('afterDeliveryNum')}
              </div>
            </div>

            <ChevronDown className="text-gray-500 rotate-[-90deg]" size={20} />
          </div>

          {returnLocation.isDesired && !areLocationsSame && (
            <div className="mt-2 animate-fade-in px-1">
              <input
                type="text"
                value={returnLocation.address || ''}
                onChange={(e) => dispatch(changeReturnLocation({ ...returnLocation, address: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg p-3 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-200 transition-all bg-white"
                placeholder={t('optionalTitle')}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function ExtraServices({ options, selected, setSelected }) {
  const t = useTranslations();
  const dispatch = useDispatch();

  function toggleOption(id) {
    if (selected.includes(id)) setSelected(selected.filter((i) => i !== id));
    else setSelected([...selected, id]);
  }

  function openDescriptionPopup(title, desc) {
    dispatch(changeDescriptionPopup({ title, description: desc || '...' }));
  }

  return (
    <div className="border border-[#0000001f] shadow-[0_2px_5px_-1px_rgba(0,0,0,.08)] p-4 rounded-4xl my-4 flex-1 bg-white">
      <div className="mb-4">
        <div className="lg:text-base sm:text-sm text-xs font-semibold">{t('extraSerTitle')}</div>
      </div>

      <div className="flex flex-col gap-3">
        {options.map((item) => (
          <div
            key={item.id}
            className="md:text-sm sm:text-xs text-xs bg-[#F4F4F4] rounded-2xl p-3 flex items-center justify-between hover:bg-gray-100 transition-colors cursor-pointer"
            onClick={() => toggleOption(item.id)}
          >
            <div className="flex gap-2 items-center">
              <label className="flex gap-2 items-center cursor-pointer pointer-events-none">
                <input type="checkbox" className="peer hidden" checked={selected.includes(item.id)} readOnly />

                <div className="md:size-[28px] sm:size-[26px] size-[24px] text-white bg-[#3B82F6] rounded-sm overflow-hidden relative hidden peer-checked:flex items-center justify-center">
                  <Check size={18} />
                </div>

                <div className="md:size-[28px] sm:size-[26px] size-[24px] border-2 border-[#3B82F6] rounded-sm overflow-hidden relative peer-checked:hidden"></div>

                <div className="font-medium">{item.title}</div>
              </label>

              <div
                onClick={(e) => {
                  e.stopPropagation();
                  openDescriptionPopup(item.title, item.description);
                }}
                className="text-gray-400 hover:text-blue-500 p-1"
              >
                <Info size={18} />
              </div>
            </div>

            <div className="text-[#545454] font-bold">
              {parseInt(item.price) === 0 ? t('free') : `${item.price} ${t('AED')}`}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function FineDeposit({ borderLess = false, price, currency }) {
  const t = useTranslations();
  const dispatch = useDispatch();

  return (
    <div className={`${!borderLess ? 'bg-white p-4 my-4 rounded-2xl border border-[#0000001f] shadow-[0_2px_5px_-1px_rgba(0,0,0,.08)]' : ''}`}>
      <div
        className="md:text-sm sm:text-xs text-xs bg-[#F4F4F4] rounded-2xl p-4 flex items-center justify-between cursor-pointer"
        onClick={() => dispatch(changeDescriptionPopup({ title: t('fineTitle'), description: '...' }))}
      >
        <div className="flex gap-2 items-center">
          <span className="flex size-9 p-1 text-[#7C7C7C]">
            <ArrowUpDown />
          </span>
          <div className="font-medium">{t('fineTitle')}</div>
          <div className="text-gray-400">
            <Info size={18} />
          </div>
        </div>
        <div className="text-[#545454] font-bold">
          {price} {t(currency)}
        </div>
      </div>
    </div>
  );
}

export function PaymentDetail({ borderLess = false, data, totals, currency, toman }) {
  const t = useTranslations();
  if (!totals) return null;

  const displayDaily = totals.dailyPrice.toLocaleString();
  const displayTotal = totals.total.toLocaleString();

  return (
    <div className={`${!borderLess && 'border border-[#0000001f] shadow-[0_2px_5px_-1px_rgba(0,0,0,.08)] p-4 rounded-4xl'} my-4 flex-1 bg-white`}>
      <div className="mb-4 flex justify-between px-2">
        <div className="lg:text-base sm:text-sm text-xs font-semibold">{t('reviewTitle')}</div>
        <div className="text-[#3B82F6] cursor-pointer text-xs font-bold">{t('gotDiscount')}</div>
      </div>

      <div className="bg-[#EFFBF6] rounded-2xl overflow-hidden pt-6 pb-2 relative">
        <div className="absolute top-0 right-0 w-full opacity-5 pointer-events-none flex justify-end p-3">
          <LayoutGrid size={120} />
        </div>

        <div className="flex flex-col justify-center items-center w-full md:text-sm text-xs z-10">
          <SinglePaymentDet
            title={`${t('rentPriceB')} ${totals.rentDays} ${t('days')}`}
            subtitle={<span className="text-[#0FA875] text-xs">{displayDaily} {t(currency)} {t('daily')}</span>}
            price={`${(totals.dailyPrice * totals.rentDays).toLocaleString()} ${t(currency)}`}
          />

          {totals.extraItems?.map((item, idx) => (
            <SinglePaymentDet key={idx} title={item.title} subtitle="" price={`${item.price.toLocaleString()} ${t(currency)}`} />
          ))}

          {totals.tax > 0 && (
            <SinglePaymentDet
              title={t('tax Title')}
              subtitle={`${data.tax_percent} ${t('percent')}`}
              price={`${totals.tax.toLocaleString()} ${t(currency)}`}
            />
          )}

          <div className="border-b border-[#B5E9D880] flex justify-between items-center w-full p-3 px-4">
            <div className="font-bold text-base text-gray-800">
              {t('finalPriceB')} {totals.rentDays} {t('days')}
            </div>
            <div className="font-bold text-lg text-[#3B82F6]">
              {displayTotal} {t(currency)}
            </div>
          </div>

          <div className="p-3 w-full">
            <div className="rounded-2xl bg-white w-full border border-gray-100 shadow-sm">
              <div className="py-4 md:px-5 px-2 flex w-full items-center justify-between">
                <div className="flex flex-col gap-1">
                  <div className="lg:text-lg md:text-base text-xs font-semibold text-gray-800">{t('prepayment')}</div>
                  <div className="flex gap-1 opacity-75">
                    <Image src={'/images/shaparak.png'} width={35} height={20} alt="shaparak" style={{ objectFit: 'contain' }} />
                    <Image src={'/images/zarinpal.png'} width={45} height={22} alt="zarinpal" style={{ objectFit: 'contain' }} />
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1 md:text-sm text-xs">
                  <div className="font-bold text-lg text-gray-900">
                    {totals.prePay.toLocaleString()} {t(currency)}
                  </div>
                  <div className="text-xs text-[#10B981]">
                    {(totals.prePay * toman).toLocaleString()} {t('toman')}
                  </div>
                </div>
              </div>

              <div className="border-t border-gray-100 pt-3 flex justify-between items-center bg-gray-50 p-2 rounded-lg">
                <div>
                  <div className="font-bold text-sm text-gray-700">{t('debt')}</div>
                  <div className="text-[10px] text-gray-500">{t('debtDescription')}</div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-base text-gray-700">
                    {totals.debt.toLocaleString()} {t(currency)}
                  </div>
                  <div className="text-xs text-[#10B981]">
                    {(totals.debt * toman).toLocaleString()} {t('toman')}
                  </div>
                </div>
              </div>

            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

export function SinglePaymentDet({ title, subtitle, price }) {
  return (
    <div className="border-b border-[#B5E9D880] flex justify-between items-center w-full p-3 px-4 last:border-0 hover:bg-[#E0F2E980] transition-colors">
      <div>
        <div className="text-gray-800 font-medium text-sm">{title}</div>
        <div className="mt-0.5">{subtitle}</div>
      </div>
      <div className="text-[#333333] font-bold text-sm">{price}</div>
    </div>
  );
}

export function PersonalInfoBox({ userInfo, setUserInfo }) {
  const t = useTranslations();
  const dispatch = useDispatch();
  const handleChange = (field, value) => setUserInfo({ ...userInfo, [field]: value });

  return (
    <div className="lg:text-sm md:text-xs text-xs pb-6 border border-[#0000001f] shadow-[0_2px_5px_-1px_rgba(0,0,0,.08)] p-4 rounded-4xl my-4 flex-1 bg-white">
      <div className="mb-4 flex justify-between items-center">
        <div className="lg:text-base sm:text-sm text-xs font-semibold">{t('personalInfoTitle')}</div>
        <button
          onClick={() => dispatch(changeIsInfoListOpen(true))}
          className="text-[#3B82F6] hover:bg-blue-50 transition-all cursor-pointer text-xs items-center flex gap-2 border border-[#3B82F6] rounded-lg px-3 py-1.5 font-bold"
        >
          <span className="size-6 inline-flex items-center justify-center">
            <UserSearch size={18} />
          </span>
          <span>{t('chooseInfoTitle')}</span>
        </button>
      </div>

      <div className="flex flex-col gap-4">
        <label className="border border-[#B0B0B0B2] rounded-[5px] relative focus-within:border-blue-500 transition-colors bg-white h-12 flex items-center">
          <input
            value={userInfo.name}
            onChange={(e) => handleChange('name', e.target.value)}
            className="p-3 w-full outline-none bg-transparent"
            type="text"
            placeholder=" "
          />
          <span className="absolute -translate-y-1/2 right-2 transition-all px-2 text-[#8A8A8A] bg-white top-0 text-xs">{t('nameLastname')}</span>
        </label>

        <div dir="ltr" className="w-full relative h-12">
          <PhoneInput
            country={'ae'}
            value={userInfo.phone}
            onChange={(phone) => handleChange('phone', phone)}
            containerStyle={{ width: '100%', height: '100%' }}
            inputStyle={{
              width: '100%',
              height: '100%',
              borderRadius: '5px',
              borderColor: '#B0B0B0B2',
              fontSize: '14px',
              paddingLeft: '48px',
            }}
            buttonStyle={{
              borderRadius: '5px 0 0 5px',
              borderColor: '#B0B0B0B2',
              borderRight: 'none',
              backgroundColor: '#f9f9f9',
            }}
          />
        </div>

        <label className="border border-[#B0B0B0B2] rounded-[5px] relative focus-within:border-blue-500 transition-colors bg-white h-12 flex items-center">
          <input
            value={userInfo.email}
            onChange={(e) => handleChange('email', e.target.value)}
            className="p-3 w-full outline-none bg-transparent"
            type="email"
            placeholder=" "
          />
          <span className="absolute -translate-y-1/2 right-2 transition-all px-2 text-[#8A8A8A] bg-white top-0 text-xs">{t('email')}</span>
        </label>
      </div>

      <div className="flex justify-center py-4 gap-1 sm:text-xs text-[10px] text-gray-500">
        {t('rulesB')}{' '}
        <Link className="text-[#3B82F6] underline" href={'/rules'}>
          {t('rules2')}
        </Link>{' '}
        {t('rulesA')}
      </div>

      <div className="bg-blue-50 p-3 rounded-lg flex items-start gap-2 text-xs text-blue-800">
        <span className="shrink-0 mt-0.5">
          <Info size={18} />
        </span>
        <div>{t('rulesDescription')}</div>
      </div>
    </div>
  );
}

export function SideCarDetail({ item, totals }) {
  const t = useTranslations();
  if (!item) return null;

  const dailyPrice = totals?.dailyPrice ? totals.dailyPrice.toLocaleString() : item.rent_price_day;
  const rentDays = totals?.rentDays || item.rent_days || 0;

  return (
    <div className="border border-[#0000001f] shadow-[0_2px_5px_-1px_rgba(0,0,0,.08)] p-4 rounded-4xl my-4 flex-1 bg-white h-fit sticky top-24">
      <div className="mb-4 pb-2 border-b border-gray-100">
        <div className="lg:text-base sm:text-sm text-xs font-bold text-gray-800">{t('onlinePur')}</div>
      </div>
{console.log(item.photo)}
      <div className="relative w-full aspect-video rounded-lg overflow-hidden mb-4 bg-gray-100">
        <Image className="object-cover" src={`${STORAGE_URL}${item.photo?.[0]}` || '/images/placeholder.png'} fill alt={item.title} />
      </div>

      <div className="py-3">
        <div className="flex w-full justify-between my-2 items-center">
          <h3 className="font-bold text-gray-800 text-lg">{item.title}</h3>
        </div>
        <SingleCarOptions car={{ gearbox: item.gearbox === 'اتوماتیک' ? 'automatic' : 'geared', fuel: item.fuel, baggage: item.baggage, passengers: item.person }} />
      </div>

      <div className="mt-4 bg-gray-50 p-3 rounded-xl">
        <div className="flex justify-between items-center text-sm mb-2">
          <div className="flex items-center gap-2">
            <span className="text-gray-500">{t('BSPrice')}</span>
            <span className="text-xs text-gray-400 text-center">
              {rentDays} {t('days')}
            </span>
          </div>

          <div className="font-bold text-[#3B82F6]">
            {dailyPrice} {t('AED')}
          </div>
        </div>
      </div>
    </div>
  );
}
