/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { create } from "zustand";

type DescriptionPopupState =
  | {
      description?: string;
      [key: string]: any;
    }
  | null;

// ------- Car Types (برای UI مثل Redux قبلی) -------
type CarCardPriceItem = {
  previousPrice: any;
  currentPrice: any;
};

type CarCardModel = {
  id: number;
  title: string;
  priceList: Record<string, CarCardPriceItem>;
  images: any[];
  options: number[];
  gearBox: "automatic" | "geared";
  passengers: any;
  suitcase: any;
  gasType: string;
  discount: any;
  video: any;
  [key: string]: any;
};

type ReelItem = any;

type SearchPageState = {
  // ===== UI =====
  roadMapStep: number;
  isHeaderClose: boolean;
  isSearchOpen: boolean;
  isFilterOpen: boolean;

  // ✅ NEW: وقتی هر Sheet/Modal بازه، هدر auto-hide نباید کار کنه
  isAnySheetOpen: boolean;

  // ✅ NEW: برای باز کردن شیت موبایل از SingleCar
  isMobileInfoOpen: boolean;

  // ===== Required (dates) =====
  carDates: [string | null, string | null] | null;

  // ✅ Times
  deliveryTime: string | null;
  returnTime: string | null;

  // ===== Filters =====
  sort: string | null;
  search_title: string;
  selectedCategories: number[];
  selectedPriceRange: [number, number] | null;
  priceRange: [number, number] | null;
  currency: string | null;
  selectedCarId: number | null;

  // ===== Cars =====
  carList: CarCardModel[];

  // ===== Reels =====
  isReelActive: boolean;
  reelList: ReelItem[];
  activeIndex: number;

  // ===== Extra =====
  descriptionPopup: DescriptionPopupState;

  // ===== Actions =====
  setRoadMapStep: (n: number) => void;
  setIsHeaderClose: (v: boolean) => void;
  setIsSearchOpen: (v: boolean) => void;
  setIsFilterOpen: (v: boolean) => void;

  // ✅ NEW
  setIsAnySheetOpen: (v: boolean) => void;

  // ✅ NEW: برای باز کردن شیت موبایل از SingleCar
  setIsMobileInfoOpen: (v: boolean) => void;

  setCarDates: (v: [string | null, string | null] | null) => void;

  setDeliveryTime: (v: string | null) => void;
  setReturnTime: (v: string | null) => void;

  setSort: (v: string | null) => void;
  setSearchTitle: (v: string) => void;

  setSelectedCategories: (v: number[]) => void;
  toggleSelectedCategory: (id: number) => void;
  resetCategories: () => void;

  setSelectedPriceRange: (v: [number, number] | null) => void;
  setPriceRange: (v: [number, number] | null) => void;
  setCurrency: (v: string | null) => void;

  setSelectedCarId: (v: number | null) => void;

  setDescriptionPopup: (v: DescriptionPopupState) => void;

  // ===== Cars actions =====
  setCarList: (cars: CarCardModel[]) => void;
  addCarList: (cars: any[]) => void;
  clearCarList: () => void;

  // ===== Reels actions =====
  setReelActive: (v: boolean) => void;
  setActiveIndex: (i: number) => void;
  addReelItem: (item: ReelItem) => void;

  resetFilters: () => void;
  resetAll: () => void;
};

/**
 * ✅ مهم: رنج priceList نباید "1:" بشه چون regex فقط "1" می‌گیره
 * و max=9999 میشه و برای 10 روز هم همون 1 رو match می‌کنه.
 *
 * خروجی استاندارد: "min-max" یا "min-9999"
 */
function makeRangeKey(text: string) {
  if (!text) return null;
  const nums = String(text).match(/\d+/g);
  if (!nums || nums.length < 1) return null;
  const min = parseInt(nums[0], 10);
  const max = nums[1] ? parseInt(nums[1], 10) : 9999;
  if (!Number.isFinite(min)) return null;
  return `${min}-${Number.isFinite(max) ? max : 9999}`;
}

function uniqStrings(arr: any[]) {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const x of arr || []) {
    const s = String(x || "").trim();
    if (!s) continue;
    if (seen.has(s)) continue;
    seen.add(s);
    out.push(s);
  }
  return out;
}

function normalizeCarsToCardModel(rawCars: any[]): CarCardModel[] {
  if (!Array.isArray(rawCars)) return [];

  return rawCars.map((car: any) => {
    const options: number[] = [];
    if (car?.deposit === "no") options.push(1);
    if (car?.free_delivery === "yes") options.push(2);
    if (car?.insurance === "yes") options.push(3);
    if (car?.km === "no") options.push(4);

    let priceList: Record<string, CarCardPriceItem> = {};

    if (car?.rent_price) {
      priceList = {
        "1-9999": {
          previousPrice: car.rent_price,
          currentPrice: car.final_price || car.rent_price,
        },
      };
    } else if (Array.isArray(car?.prices)) {
      car.prices.forEach((item: any) => {
        const key = makeRangeKey(item?.range);
        if (!key) return;
        priceList[key] = {
          previousPrice: item?.base_price,
          currentPrice: item?.final_price,
        };
      });
    }

    const imagesRaw = Array.isArray(car?.photo)
      ? car.photo
      : car?.photo
        ? [car.photo]
        : [];
    const images = uniqStrings(imagesRaw);

    const gearBox =
      car?.gearbox === "اتوماتیک" || car?.gearbox === "automatic"
        ? "automatic"
        : "geared";
    const gasType = car?.fuel ? String(car.fuel).toLowerCase() : "petrol";

    const model: CarCardModel = {
      ...car,
      id: Number(car?.id),
      title: car?.title ?? "",
      priceList,
      images,
      options,
      gearBox,
      passengers: car?.person,
      suitcase: car?.baggage,
      gasType,
      discount: car?.off,
      video: car?.video,
    };

    return model;
  });
}

// ==========================
// ✅ Equality helpers (ضد لوپ)
// ==========================
const sameArrayNumbers = (a: number[] = [], b: number[] = []) => {
  if (a === b) return true;
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
  return true;
};

const sameTuple2 = (a?: [number, number] | null, b?: [number, number] | null) => {
  if (a === b) return true;
  if (!a && !b) return true;
  if (!a || !b) return false;
  return a[0] === b[0] && a[1] === b[1];
};

const sameDatePair = (
  a?: [string | null, string | null] | null,
  b?: [string | null, string | null] | null,
) => {
  if (a === b) return true;
  if (!a && !b) return true;
  if (!a || !b) return false;
  return a[0] === b[0] && a[1] === b[1];
};

// --------- Initial State ---------
const initialState = {
  roadMapStep: 1,
  isHeaderClose: false,
  isSearchOpen: false,
  isFilterOpen: false,

  // ✅ NEW
  isAnySheetOpen: false,

  // ✅ NEW: برای باز کردن شیت موبایل از SingleCar
  isMobileInfoOpen: false,

  carDates: null as [string | null, string | null] | null,

  deliveryTime: null as string | null,
  returnTime: null as string | null,

  sort: null as string | null,
  search_title: "",
  selectedCategories: [] as number[],
  selectedPriceRange: null as [number, number] | null,
  priceRange: null as [number, number] | null,
  currency: "AED" as string | null,
  selectedCarId: null as number | null,

  carList: [] as CarCardModel[],

  isReelActive: false,
  reelList: [] as ReelItem[],
  activeIndex: 0,

  descriptionPopup: null as DescriptionPopupState,
};

export const useSearchPageStore = create<SearchPageState>((set, get) => ({
  ...initialState,

  // ===== UI =====
  setRoadMapStep: (n) => {
    if (get().roadMapStep === n) return;
    set({ roadMapStep: n });
  },
  setIsHeaderClose: (v) => {
    if (get().isHeaderClose === v) return;
    set({ isHeaderClose: v });
  },
  setIsSearchOpen: (v) => {
    if (get().isSearchOpen === v) return;
    set({ isSearchOpen: v });
  },
  setIsFilterOpen: (v) => {
    if (get().isFilterOpen === v) return;
    set({ isFilterOpen: v });
  },

  // ✅ NEW
  setIsAnySheetOpen: (v) => {
    if (get().isAnySheetOpen === v) return;
    set({ isAnySheetOpen: v });
  },

  // ✅ NEW: برای باز کردن شیت موبایل از SingleCar
  setIsMobileInfoOpen: (v) => {
    if (get().isMobileInfoOpen === v) return;
    set({ isMobileInfoOpen: v });
  },

  // ===== Dates & Times =====
  setCarDates: (v) => {
    const cur = get().carDates;
    if (sameDatePair(cur, v)) return;
    set({ carDates: v });
  },

  setDeliveryTime: (v) => {
    if (get().deliveryTime === v) return;
    set({ deliveryTime: v });
  },
  setReturnTime: (v) => {
    if (get().returnTime === v) return;
    set({ returnTime: v });
  },

  // ===== Filters =====
  setSort: (v) => {
    if (get().sort === v) return;
    set({ sort: v });
  },

  setSearchTitle: (v) => {
    if (get().search_title === v) return;
    set({ search_title: v });
  },

  setSelectedCategories: (v) => {
    const next = Array.isArray(v) ? v : [];
    const cur = get().selectedCategories || [];
    if (sameArrayNumbers(cur, next)) return;
    set({ selectedCategories: next });
  },

  toggleSelectedCategory: (id) => {
    const cur = get().selectedCategories || [];
    const exists = cur.includes(id);
    const next = exists ? cur.filter((x) => x !== id) : [...cur, id];
    if (sameArrayNumbers(cur, next)) return;
    set({ selectedCategories: next });
  },

  resetCategories: () => {
    const cur = get().selectedCategories || [];
    if (!cur.length) return;
    set({ selectedCategories: [] });
  },

  setSelectedPriceRange: (v) => {
    const cur = get().selectedPriceRange;
    if (sameTuple2(cur, v)) return;
    set({ selectedPriceRange: v });
  },

  setPriceRange: (v) => {
    const cur = get().priceRange;
    if (sameTuple2(cur, v)) return;
    set({ priceRange: v });
  },

  setCurrency: (v) => {
    if (get().currency === v) return;
    set({ currency: v });
  },

  setSelectedCarId: (v) => {
    if (get().selectedCarId === v) return;
    set({ selectedCarId: v });
  },

  setDescriptionPopup: (v) => {
    const cur = get().descriptionPopup;
    if (cur === v) return;
    set({ descriptionPopup: v });
  },

  // ===== Cars =====
  setCarList: (cars) => {
    const next = Array.isArray(cars) ? cars : [];
    set({ carList: next });
  },

  addCarList: (cars) => {
    const incoming = Array.isArray(cars) ? cars : [];
    const normalized = normalizeCarsToCardModel(incoming);

    const current = get().carList || [];
    const existingIds = new Set(current.map((c) => c.id));
    const unique = normalized.filter((c) => !existingIds.has(c.id));

    if (!unique.length) return;
    set({ carList: [...current, ...unique] });
  },

  clearCarList: () => {
    const cur = get().carList || [];
    if (!cur.length) return;
    set({ carList: [] });
  },

  // ===== Reels =====
  setReelActive: (v) => {
    if (get().isReelActive === v) return;
    set({ isReelActive: v });
  },

  setActiveIndex: (i) => {
    if (get().activeIndex === i) return;
    set({ activeIndex: i });
  },

  addReelItem: (item) => {
    const cur = get().reelList || [];
    const exists = cur.findIndex((x: any) => x?.id == item?.id);
    if (exists !== -1) return;
    set({ reelList: [...cur, item] });
  },

  // ===== Resets =====
  resetFilters: () => {
    set({
      sort: null,
      search_title: "",
      selectedCategories: [],
      selectedPriceRange: null,
      selectedCarId: null,
      descriptionPopup: null,
    });
  },

  resetAll: () => set({ ...initialState }),
}));
