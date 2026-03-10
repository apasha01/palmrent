/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { create } from "zustand";

type DescriptionPopupState =
  | {
      description?: string;
      [key: string]: any;
    }
  | null;

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

type ReserveDraft = {
  branch_id: number | null;
  car_id: number | null;
  from: string | null;
  to: string | null;
  dt: string | null;
  rt: string | null;
  sort?: string | null;
  search_title?: string | null;
  categories?: number[];
  min_p?: number | null;
  max_p?: number | null;
};

type YesNoValue = "yes" | "no" | null;
type GearboxValue = "automatic" | "geared" | "hybrid";
type FuelValue = "petrol" | "diesel" | "hybrid" | "electric";

type SearchPageState = {
  roadMapStep: number;
  isHeaderClose: boolean;
  isSearchOpen: boolean;
  isFilterOpen: boolean;
  isAnySheetOpen: boolean;
  isMobileInfoOpen: boolean;
  branchId: number | null;

  carDates: [string | null, string | null];
  deliveryTime: string;
  returnTime: string;

  sort: string | null;
  search_title: string;

  // قدیمی
  selectedCategories: number[];
  selectedBrands: string[];

  // جدید
  selectedGearboxes: GearboxValue[];
  selectedFuels: FuelValue[];
  selectedPersons: number[];
  selectedBaggages: number[];

  selectedDeposit: YesNoValue;
  selectedFreeDelivery: YesNoValue;
  selectedInsurance: YesNoValue;
  selectedKm: YesNoValue;

  selectedPriceRange: [number, number] | null;
  priceRange: [number, number] | null;
  currency: string | null;
  selectedCarId: number | null;

  carList: CarCardModel[];

  isReelActive: boolean;
  reelList: ReelItem[];
  activeIndex: number;

  descriptionPopup: DescriptionPopupState;

  reserveDraft: ReserveDraft;
  setReserveDraft: (patch: Partial<ReserveDraft>) => void;
  resetReserveDraft: () => void;

  setRoadMapStep: (n: number) => void;
  setIsHeaderClose: (v: boolean) => void;
  setIsSearchOpen: (v: boolean) => void;
  setIsFilterOpen: (v: boolean) => void;
  setIsAnySheetOpen: (v: boolean) => void;
  setIsMobileInfoOpen: (v: boolean) => void;
  setBranchId: (v: number | null) => void;

  setCarDates: (v: [string | null, string | null] | null) => void;
  setDeliveryTime: (v: string | null) => void;
  setReturnTime: (v: string | null) => void;

  setSort: (v: string | null) => void;
  setSearchTitle: (v: string) => void;

  setSelectedCategories: (v: number[]) => void;
  toggleSelectedCategory: (id: number) => void;
  resetCategories: () => void;

  setSelectedBrands: (brands: string[]) => void;
  toggleSelectedBrand: (brand: string) => void;
  resetBrands: () => void;

  setSelectedGearboxes: (v: GearboxValue[]) => void;
  toggleSelectedGearbox: (v: GearboxValue) => void;
  resetGearboxes: () => void;

  setSelectedFuels: (v: FuelValue[]) => void;
  toggleSelectedFuel: (v: FuelValue) => void;
  resetFuels: () => void;

  setSelectedPersons: (v: number[]) => void;
  toggleSelectedPerson: (v: number) => void;
  resetPersons: () => void;

  setSelectedBaggages: (v: number[]) => void;
  toggleSelectedBaggage: (v: number) => void;
  resetBaggages: () => void;

  setSelectedDeposit: (v: YesNoValue) => void;
  setSelectedFreeDelivery: (v: YesNoValue) => void;
  setSelectedInsurance: (v: YesNoValue) => void;
  setSelectedKm: (v: YesNoValue) => void;
  resetReserveFlags: () => void;

  setSelectedPriceRange: (v: [number, number] | null) => void;
  setPriceRange: (v: [number, number] | null) => void;
  setCurrency: (v: string | null) => void;

  setSelectedCarId: (v: number | null) => void;
  setDescriptionPopup: (v: DescriptionPopupState) => void;

  setCarList: (cars: CarCardModel[]) => void;
  addCarList: (cars: any[]) => void;
  clearCarList: () => void;

  setReelActive: (v: boolean) => void;
  setActiveIndex: (i: number) => void;
  addReelItem: (item: ReelItem) => void;

  resetFilters: () => void;
  resetAll: () => void;
};

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

function uniqNumbers(arr: any[]) {
  const out: number[] = [];
  const seen = new Set<number>();

  for (const x of arr || []) {
    const n = Number(x);
    if (!Number.isFinite(n) || n <= 0) continue;
    if (seen.has(n)) continue;
    seen.add(n);
    out.push(n);
  }

  return out.sort((a, b) => a - b);
}

function uniqLiteralStrings<T extends string>(arr: T[]) {
  const out: T[] = [];
  const seen = new Set<string>();

  for (const x of arr || []) {
    const s = String(x || "").trim() as T;
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

    if (car?.rent_price || car?.final_price) {
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

const sameArrayNumbers = (a: number[] = [], b: number[] = []) => {
  if (a === b) return true;
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
  return true;
};

const sameArrayStrings = (a: string[] = [], b: string[] = []) => {
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

function normalizeCategoryList(arr: number[]) {
  return uniqNumbers(arr);
}

const initialReserveDraft: ReserveDraft = {
  branch_id: null,
  car_id: null,
  from: null,
  to: null,
  dt: null,
  rt: null,
  sort: null,
  search_title: null,
  categories: [],
  min_p: null,
  max_p: null,
};

const initialState = {
  roadMapStep: 1,
  isHeaderClose: false,
  isSearchOpen: false,
  isFilterOpen: false,

  isAnySheetOpen: false,
  isMobileInfoOpen: false,

  branchId: null as number | null,

  carDates: [null, null] as [string | null, string | null],

  deliveryTime: "10:00",
  returnTime: "10:00",

  sort: null as string | null,
  search_title: "",
  selectedCategories: [] as number[],
  selectedBrands: [] as string[],

  selectedGearboxes: [] as GearboxValue[],
  selectedFuels: [] as FuelValue[],
  selectedPersons: [] as number[],
  selectedBaggages: [] as number[],

  selectedDeposit: null as YesNoValue,
  selectedFreeDelivery: null as YesNoValue,
  selectedInsurance: null as YesNoValue,
  selectedKm: null as YesNoValue,

  selectedPriceRange: null as [number, number] | null,
  priceRange: null as [number, number] | null,
  currency: "AED" as string | null,
  selectedCarId: null as number | null,

  carList: [] as CarCardModel[],

  isReelActive: false,
  reelList: [] as ReelItem[],
  activeIndex: 0,

  descriptionPopup: null as DescriptionPopupState,
  reserveDraft: initialReserveDraft as ReserveDraft,
};

export const useSearchPageStore = create<SearchPageState>((set, get) => ({
  ...initialState,

  setReserveDraft: (patch) => {
    const cur = get().reserveDraft;
    const next = { ...cur, ...patch };

    const same =
      cur.branch_id === next.branch_id &&
      cur.car_id === next.car_id &&
      cur.from === next.from &&
      cur.to === next.to &&
      cur.dt === next.dt &&
      cur.rt === next.rt &&
      (cur.sort ?? null) === (next.sort ?? null) &&
      (cur.search_title ?? null) === (next.search_title ?? null) &&
      sameArrayNumbers(cur.categories || [], next.categories || []) &&
      (cur.min_p ?? null) === (next.min_p ?? null) &&
      (cur.max_p ?? null) === (next.max_p ?? null);

    if (same) return;
    set({ reserveDraft: next });
  },

  resetReserveDraft: () => {
    set({ reserveDraft: { ...initialReserveDraft } });
  },

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

  setIsAnySheetOpen: (v) => {
    if (get().isAnySheetOpen === v) return;
    set({ isAnySheetOpen: v });
  },

  setIsMobileInfoOpen: (v) => {
    if (get().isMobileInfoOpen === v) return;
    set({ isMobileInfoOpen: v });
  },

  setBranchId: (v) => {
    if (get().branchId === v) return;
    set({ branchId: v });
  },

  setCarDates: (v) => {
    const next: [string | null, string | null] = v ?? [null, null];
    const cur = get().carDates;
    if (sameDatePair(cur, next)) return;
    set({ carDates: next });
  },

  setDeliveryTime: (v) => {
    const next = v ? String(v) : "10:00";
    if (get().deliveryTime === next) return;
    set({ deliveryTime: next });
  },

  setReturnTime: (v) => {
    const next = v ? String(v) : "10:00";
    if (get().returnTime === next) return;
    set({ returnTime: next });
  },

  setSort: (v) => {
    if (get().sort === v) return;
    set({ sort: v });
  },

  setSearchTitle: (v) => {
    if (get().search_title === v) return;
    set({ search_title: v });
  },

  setSelectedCategories: (v) => {
    const next = normalizeCategoryList(v || []);
    const cur = normalizeCategoryList(get().selectedCategories || []);
    if (sameArrayNumbers(cur, next)) return;
    set({ selectedCategories: next });
  },

  toggleSelectedCategory: (id) => {
    const nid = Number(id);
    if (!Number.isFinite(nid) || nid <= 0) return;

    const cur = normalizeCategoryList(get().selectedCategories || []);
    const exists = cur.includes(nid);
    const next = exists ? cur.filter((x) => x !== nid) : [...cur, nid];
    const nextNorm = normalizeCategoryList(next);

    if (sameArrayNumbers(cur, nextNorm)) return;
    set({ selectedCategories: nextNorm });
  },

  resetCategories: () => {
    if (!get().selectedCategories.length) return;
    set({ selectedCategories: [] });
  },

  setSelectedBrands: (brands) => {
    const next = uniqStrings(brands);
    const cur = get().selectedBrands;
    if (sameArrayStrings(cur, next)) return;
    set({ selectedBrands: next });
  },

  toggleSelectedBrand: (brand) => {
    const v = String(brand || "").trim();
    if (!v) return;

    const cur = get().selectedBrands;
    const exists = cur.includes(v);
    const next = exists ? cur.filter((b) => b !== v) : [...cur, v];

    if (sameArrayStrings(cur, next)) return;
    set({ selectedBrands: next });
  },

  resetBrands: () => {
    if (!get().selectedBrands.length) return;
    set({ selectedBrands: [] });
  },

  setSelectedGearboxes: (v) => {
    const next = uniqLiteralStrings(v || []);
    const cur = get().selectedGearboxes;
    if (sameArrayStrings(cur, next)) return;
    set({ selectedGearboxes: next });
  },

  toggleSelectedGearbox: (v) => {
    const cur = get().selectedGearboxes;
    const exists = cur.includes(v);
    const next = exists ? cur.filter((x) => x !== v) : [...cur, v];
    if (sameArrayStrings(cur, next)) return;
    set({ selectedGearboxes: next });
  },

  resetGearboxes: () => {
    if (!get().selectedGearboxes.length) return;
    set({ selectedGearboxes: [] });
  },

  setSelectedFuels: (v) => {
    const next = uniqLiteralStrings(v || []);
    const cur = get().selectedFuels;
    if (sameArrayStrings(cur, next)) return;
    set({ selectedFuels: next });
  },

  toggleSelectedFuel: (v) => {
    const cur = get().selectedFuels;
    const exists = cur.includes(v);
    const next = exists ? cur.filter((x) => x !== v) : [...cur, v];
    if (sameArrayStrings(cur, next)) return;
    set({ selectedFuels: next });
  },

  resetFuels: () => {
    if (!get().selectedFuels.length) return;
    set({ selectedFuels: [] });
  },

  setSelectedPersons: (v) => {
    const next = uniqNumbers(v || []);
    const cur = get().selectedPersons;
    if (sameArrayNumbers(cur, next)) return;
    set({ selectedPersons: next });
  },

  toggleSelectedPerson: (v) => {
    const n = Number(v);
    if (!Number.isFinite(n) || n <= 0) return;

    const cur = get().selectedPersons;
    const exists = cur.includes(n);
    const next = exists ? cur.filter((x) => x !== n) : [...cur, n];
    const norm = uniqNumbers(next);

    if (sameArrayNumbers(cur, norm)) return;
    set({ selectedPersons: norm });
  },

  resetPersons: () => {
    if (!get().selectedPersons.length) return;
    set({ selectedPersons: [] });
  },

  setSelectedBaggages: (v) => {
    const next = uniqNumbers(v || []);
    const cur = get().selectedBaggages;
    if (sameArrayNumbers(cur, next)) return;
    set({ selectedBaggages: next });
  },

  toggleSelectedBaggage: (v) => {
    const n = Number(v);
    if (!Number.isFinite(n) || n <= 0) return;

    const cur = get().selectedBaggages;
    const exists = cur.includes(n);
    const next = exists ? cur.filter((x) => x !== n) : [...cur, n];
    const norm = uniqNumbers(next);

    if (sameArrayNumbers(cur, norm)) return;
    set({ selectedBaggages: norm });
  },

  resetBaggages: () => {
    if (!get().selectedBaggages.length) return;
    set({ selectedBaggages: [] });
  },

  setSelectedDeposit: (v) => {
    if (get().selectedDeposit === v) return;
    set({ selectedDeposit: v });
  },

  setSelectedFreeDelivery: (v) => {
    if (get().selectedFreeDelivery === v) return;
    set({ selectedFreeDelivery: v });
  },

  setSelectedInsurance: (v) => {
    if (get().selectedInsurance === v) return;
    set({ selectedInsurance: v });
  },

  setSelectedKm: (v) => {
    if (get().selectedKm === v) return;
    set({ selectedKm: v });
  },

  resetReserveFlags: () => {
    if (
      get().selectedDeposit === null &&
      get().selectedFreeDelivery === null &&
      get().selectedInsurance === null &&
      get().selectedKm === null
    ) {
      return;
    }

    set({
      selectedDeposit: null,
      selectedFreeDelivery: null,
      selectedInsurance: null,
      selectedKm: null,
    });
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
    if (get().descriptionPopup === v) return;
    set({ descriptionPopup: v });
  },

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
    if (!get().carList.length) return;
    set({ carList: [] });
  },

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

  resetFilters: () => {
    set({
      sort: null,
      search_title: "",
      selectedCategories: [],
      selectedBrands: [],
      selectedGearboxes: [],
      selectedFuels: [],
      selectedPersons: [],
      selectedBaggages: [],
      selectedDeposit: null,
      selectedFreeDelivery: null,
      selectedInsurance: null,
      selectedKm: null,
      selectedPriceRange: null,
      selectedCarId: null,
      descriptionPopup: null,
    });
  },

  resetAll: () => set({ ...(initialState as any) }),
}));
