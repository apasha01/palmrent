import { createSlice } from '@reduxjs/toolkit';

const initialState = {
   selectedCarId: null,
   optionList: {
      1: {
         title: 'noDeposite',
         description: 'No deposit required for this car.',
      },
      2: {
         title: 'freeDelivery',
         description: 'Free delivery to your location.',
      },
      3: {
         title: 'freeinsurance',
         description: 'Basic insurance is included for free.',
      },
      4: {
         title: 'unlimitedKilometers',
         description: 'Drive as much as you want without extra charges.',
      },
   },
   carList: [],
};

// Helper to extract range keys
function getFromToDay(text) {
   if (!text) return 'daily';
   const numbers = text.match(/\d+/g);
   if (!numbers || numbers.length < 1) return null;
   return `${numbers[0]}:${numbers[1] || ''}`;
}

const carListSlice = createSlice({
   name: 'carList',
   initialState,
   reducers: {
      selectCar: (state, action) => {
         state.selectedCarId = action.payload;
      },
      addCarList: (state, action) => {
         const newCars = action.payload.map((car) => {
            // Build options based on conditions
            const options = [];
            if (car.deposit === 'no') options.push(1);
            if (car.free_delivery === 'yes') options.push(2);
            if (car.insurance === 'yes') options.push(3);
            if (car.km === 'no') options.push(4);

            let priceList = {};
            // Convert Prices
            if (car.rent_price) {
               priceList = {
                  1: {
                     previousPrice: car.rent_price,
                     currentPrice: car.final_price || car.rent_price,
                  },
               };
            } else if (Array.isArray(car.prices)) {
               car.prices.map((item) => {
                  const key = getFromToDay(item.range);
                  if (key) priceList[key] = { previousPrice: item.base_price, currentPrice: item.final_price };
               });
            }

            return {
               id: car.id,
               title: car.title,
               priceList: priceList,
               images: Array.isArray(car.photo) ? car.photo : [car.photo],
               options: options,
               gearBox: car.gearbox === 'اتوماتیک' || car.gearbox === 'automatic' ? 'automatic' : 'geared',
               passengers: car.person,
               suitcase: car.baggage,
               gasType: car.fuel ? car.fuel.toLowerCase() : 'petrol',
               discount: car.off,
               video: car.video,
            };
         });

         // Filter duplicates based on ID
         const uniqueNewCars = newCars.filter((newCar) => !state.carList.some((existingCar) => existingCar.id === newCar.id));

         state.carList = [...state.carList, ...uniqueNewCars];
      },
      clearCarList: (state) => {
         state.carList = [];
      },
   },
});

export const { addCarList, clearCarList, selectCar } = carListSlice.actions;
export default carListSlice.reducer;
