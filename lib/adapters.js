/**
 * Converts 'yes'/'no' strings to boolean.
 * Handles null/undefined safely.
 */
export const toBool = (value) => {
   if (!value) return false;
   return String(value).toLowerCase() === 'yes';
};

/**
 * Converts a string number to a real number/float.
 * Returns 0 if value is null, undefined, or invalid.
 */
export const toNum = (value) => {
   if (value === null || value === undefined || value === '') return 0;
   if (typeof value === 'number') return Number.isFinite(value) ? value : 0;

   const cleaned = String(value).replace(/[^0-9.]/g, '');
   const parsed = parseFloat(cleaned);
   return Number.isFinite(parsed) ? parsed : 0;
};

/**
 * Normalizes image arrays.
 * Supports new API: images: [...]
 * Supports old API: photos/photo
 */
export const normalizeImages = (item) => {
   if (!item) return ['/images/placeholder.png'];

   const list = [];

   // NEW API
   if (Array.isArray(item.images) && item.images.length) list.push(...item.images);

   // OLD API (backward compat)
   if (Array.isArray(item.photos) && item.photos.length) list.push(...item.photos);
   if (Array.isArray(item.photo) && item.photo.length) list.push(...item.photo);
   if (typeof item.photo === 'string' && item.photo) list.push(item.photo);

   const cleaned = list.filter(Boolean);
   return cleaned.length ? cleaned : ['/images/placeholder.png'];
};

/**
 * Extracts a "default" price from NEW priceList object like:
 * { "1:6": { previousPrice, currentPrice }, ... }
 */
const getDefaultPriceFromPriceList = (priceListObj) => {
   if (!priceListObj || typeof priceListObj !== 'object') return { price: 0, oldPrice: null };

   const entries = Object.entries(priceListObj).map(([range, v]) => {
      const nums = String(range).match(/\d+/g) || [];
      const min = nums[0] ? parseInt(nums[0], 10) : 999999;
      const max = nums[1] ? parseInt(nums[1], 10) : 9999999;

      return {
         range,
         min,
         max,
         current: toNum(v?.currentPrice ?? v?.final_price),
         previous: toNum(v?.previousPrice ?? v?.base_price),
      };
   });

   // pick the smallest "min" range (usually 1:6)
   entries.sort((a, b) => a.min - b.min);

   const first = entries[0];
   if (!first) return { price: 0, oldPrice: null };

   const price = first.current || 0;
   const oldPrice = first.previous > price ? first.previous : null;

   return { price, oldPrice };
};

const normalizeGearbox = (value) => {
   const v = String(value || '').toLowerCase();
   if (v.includes('auto') || v.includes('اتوماتیک')) return 'automatic';
   return 'geared';
};

/**
 * Main Adapter: Cleans raw car data from API (NEW + OLD compatible).
 */
export function adaptCarData(car) {
   if (!car) return null;

   // NEW API fields
   const priceList = car.priceList ?? null;
   const { price: priceFromList, oldPrice: oldFromList } = getDefaultPriceFromPriceList(priceList);

   // OLD API fallback fields (if any)
   const displayPriceFallback = toNum(car.min_price_f) || toNum(car.final_price) || toNum(car.rent_price) || 0;

   const basePriceFallback = toNum(car.min_price) || toNum(car.rent_price) || 0;

   const finalPrice = priceFromList || displayPriceFallback;
   const finalOld = oldFromList ?? (basePriceFallback > finalPrice ? basePriceFallback : null);

   return {
      id: car.id,
      title: car.title || 'Unknown Car',
      branch: car.branch || '',

      // NEW: keep priceList as-is (object) for your component
      priceList,

      // Pricing (Safe Numbers)
      price: finalPrice,
      oldPrice: finalOld,
      currency: car.currency || 'AED',
      discountPercent: toNum(car.discount ?? car.off),

      // Specs (NEW + OLD)
      gearbox: normalizeGearbox(car.gearBox ?? car.gearbox),
      fuel: car.gasType ?? car.fuel ?? 'Petrol',
      passengers: toNum(car.passengers ?? car.person),
      baggage: toNum(car.suitcase ?? car.baggage),

      // Features (may not exist in NEW API, kept for backward compat)
      isNoDeposit: String(car.deposit ?? '').toLowerCase() === 'no',
      hasFreeDelivery: toBool(car.free_delivery),
      hasInsurance: toBool(car.insurance),
      isUnlimitedKm: String(car.km ?? '').toLowerCase() === 'no',

      // Media
      images: normalizeImages(car),
      video: car.video || null,

      // Options
      rawOptions: Array.isArray(car.options) ? car.options : [],

      // OLD API list fallback
      dailyPrices: Array.isArray(car.prices) ? car.prices : [],
   };
}
